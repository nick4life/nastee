require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Load Environment Variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.ARBITRUM_RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Arbiscan & The Graph API Keys (rotate to avoid rate limits)
const arbiscanKeys = [
    process.env.ARBISCAN_API_KEY_1,
    process.env.ARBISCAN_API_KEY_2,
    process.env.ARBISCAN_API_KEY_3
];
const graphAPIKeys = [
    process.env.THEGRAPH_API_1,
    process.env.THEGRAPH_API_2
];

// Select random API keys
const ARBISCAN_API_KEY = arbiscanKeys[Math.floor(Math.random() * arbiscanKeys.length)];
const GRAPH_API_KEY = graphAPIKeys[Math.floor(Math.random() * graphAPIKeys.length)];

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Debugging Environment Variables
console.log("🔹 Loaded Environment Variables:");
console.log("🔹 Private Key:", PRIVATE_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("🔹 RPC URL:", RPC_URL || "❌ MISSING");
console.log("🔹 Contract Address:", CONTRACT_ADDRESS || "❌ MISSING");
console.log("🔹 Arbiscan API Key:", ARBISCAN_API_KEY || "❌ MISSING");
console.log("🔹 The Graph API Key:", GRAPH_API_KEY || "❌ MISSING");

// Ensure all essential variables are set
if (!PRIVATE_KEY || !RPC_URL || !CONTRACT_ADDRESS || !ARBISCAN_API_KEY || !GRAPH_API_KEY) {
    console.error("❌ Missing essential environment variables. Please check your .env file.");
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Arbitrum Provider & Wallet Setup
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Uniswap & SushiSwap Pool/Pair Addresses (from .env)
// For example, for flashloan you might be using the Uniswap pool address for ETH/USDC.
const UNISWAPV2_PAIR_ADDRESS = process.env.UNISWAPV2_PAIR_ADDRESS; // e.g., the flashloan pool address on Uniswap
const SUSHISWAPV2_PAIR_ADDRESS = process.env.SUSHISWAP_PAIR_ADDRESS; // e.g., the SushiSwap pair address

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Token Addresses (make sure these match the tokens on Arbitrum)
// Convert to lowercase for consistency when comparing addresses.
const USDC = process.env.USDC.toLowerCase(); // e.g., USDC on Arbitrum
const WETH = process.env.WETH.toLowerCase(); // e.g., WETH on Arbitrum

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Contract ABI for Flash Swap (your deployed contract)
const contractABI = [
    "function startFlashSwap(address pair, uint amount0Out, uint amount1Out, bytes calldata data) external"
];

// Instantiate the contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 DEX Price APIs (Graph endpoints)
const UNISWAP_GRAPH_URL = "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-arbitrum";
const SUSHISWAP_GRAPH_URL = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange";
const ARBISCAN_API_URL = "https://api.arbiscan.io/api";

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Function to Fetch Prices from Uniswap & SushiSwap
async function getPrices() {
    // Force addresses to lowercase (as Graph queries typically require lowercase addresses)
    const uniswapPoolId = UNISWAPV2_PAIR_ADDRESS.toLowerCase();
    const sushiswapPairId = SUSHISWAPV2_PAIR_ADDRESS.toLowerCase();

    // Uniswap V3 query: using "pool" and the sqrtPriceX96 field.
    const uniswapQuery = `{
        pool(id: "${uniswapPoolId}") {
            id
            token0 { id symbol }
            token1 { id symbol }
            sqrtPriceX96
        }
    }`;

    // SushiSwap V2 query: using "pair", reserves, and token decimals.
    const sushiswapQuery = `{
        pair(id: "${sushiswapPairId}") {
            id
            token0 { id symbol decimals }
            token1 { id symbol decimals }
            reserve0
            reserve1
        }
    }`;

    try {
        console.log("🔹 Fetching Uniswap Prices...");
        const uniswapResponse = await axios.post(UNISWAP_GRAPH_URL, { query: uniswapQuery });
        console.log("🔹 Fetching SushiSwap Prices...");
        const sushiswapResponse = await axios.post(SUSHISWAP_GRAPH_URL, { query: sushiswapQuery });

        const uniswapData = uniswapResponse.data?.data?.pool;
        const sushiswapData = sushiswapResponse.data?.data?.pair;

        if (!uniswapData || !sushiswapData) {
            console.error("⚠️ No price data found! Check pair addresses.");
            return null;
        }

        // ─────────────────────────────────────────────
        // Convert sqrtPriceX96 to price for Uniswap
        // Formula: price = (sqrtPriceX96^2) / 2^192
        const uniswapSqrtPrice = Number(uniswapData.sqrtPriceX96);
        const uniswapPrice = (uniswapSqrtPrice ** 2) / (2 ** 192);

        // ─────────────────────────────────────────────
        // Calculate SushiSwap price from reserves
        const token0 = sushiswapData.token0;
        const token1 = sushiswapData.token1;
        const reserve0 = Number(sushiswapData.reserve0);
        const reserve1 = Number(sushiswapData.reserve1);
        const token0Decimals = Number(token0.decimals);
        const token1Decimals = Number(token1.decimals);
        const adjustedReserve0 = reserve0 / (10 ** token0Decimals);
        const adjustedReserve1 = reserve1 / (10 ** token1Decimals);

        let sushiswapPrice;
        // We assume we want the price of WETH in terms of USDC.
        if (token0.id.toLowerCase() === USDC && token1.id.toLowerCase() === WETH) {
            sushiswapPrice = adjustedReserve0 / adjustedReserve1;
        } else if (token0.id.toLowerCase() === WETH && token1.id.toLowerCase() === USDC) {
            sushiswapPrice = adjustedReserve1 / adjustedReserve0;
        } else {
            console.error("⚠️ Unexpected token order in SushiSwap pair.");
            return null;
        }

        console.log(`🔹 Uniswap Price (WETH in USDC): ${uniswapPrice}`);
        console.log(`🔹 SushiSwap Price (WETH in USDC): ${sushiswapPrice}`);

        return { uniswapPrice, sushiswapPrice };
    } catch (error) {
        console.error("⚠️ Error fetching prices:", error.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Function to Execute Arbitrage (Flash Loan)
async function executeFlashLoan() {
    console.log("🚀 Checking for arbitrage opportunities...");

    const prices = await getPrices();
    if (!prices) return;

    const { uniswapPrice, sushiswapPrice } = prices;

    // If Uniswap price is lower than SushiSwap's, then buy on Uniswap and sell on SushiSwap.
    if (uniswapPrice < sushiswapPrice) {
        console.log("💰 Arbitrage Opportunity: Buy on Uniswap, Sell on SushiSwap!");
        await startFlashSwap();
    } else {
        console.log("❌ No profitable arbitrage found. Retrying...");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Function to Start Flash Loan
async function startFlashSwap() {
    try {
        // Example: Borrow 2000 USDC (USDC has 6 decimals)
        const borrowAmount = ethers.parseUnits("2000", 6);

        console.log(`⚡ Initiating flash loan of ${borrowAmount.toString()} USDC...`);
        const tx = await contract.startFlashSwap(UNISWAPV2_PAIR_ADDRESS, borrowAmount, 0, "0x");

        console.log("✅ Flash loan initiated! TX Hash:", tx.hash);
        await tx.wait();
        console.log("✅ Transaction confirmed!");

        // Track the transaction status via Arbiscan
        await checkTransaction(tx.hash);
    } catch (error) {
        console.error("❌ Error executing flash swap:", error.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Function to Track Transactions Using Arbiscan
async function checkTransaction(txHash) {
    const url = `${ARBISCAN_API_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ARBISCAN_API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === "1") {
            console.log(`✅ Transaction ${txHash} is confirmed!`);
        } else {
            console.log(`⏳ Transaction ${txHash} is still pending...`);
        }
    } catch (error) {
        console.error("❌ Error checking transaction:", error.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Run the Bot Every Minute
async function runBot() {
    console.log("🔄 Starting Arbitrage Bot...");
    await executeFlashLoan();
    // Run again after 60 seconds
    setTimeout(runBot, 60000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 Start the Bot
runBot();
