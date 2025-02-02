const { request, gql } = require('graphql-request');

// 🔹 Define The Graph API endpoint (Choose Uniswap or SushiSwap)
const UNISWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const SUSHISWAP_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange';

// 🔹 Define the Uniswap/SushiSwap USDC-WETH pair contract address
const PAIR_ADDRESS = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"; // USDC/WETH

// 🔹 GraphQL Query to Fetch Pair Data
const query = gql`
{
   pair(id: "${PAIR_ADDRESS}") {
      id
      token0 {
         id
         symbol
         name
      }
      token1 {
         id
         symbol
         name
      }
      reserve0
      reserve1
      totalSupply
      reserveUSD
      volumeUSD
   }
}`;

// 🔹 Function to Fetch Data from The Graph
async function fetchPairData(graphUrl) {
    try {
        console.log(`🔹 Fetching Pair Data from ${graphUrl}...`);
        const data = await request(graphUrl, query);
        console.log("✅ Pair Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("❌ Error fetching pair data:", error.message);
    }
}

// 🔹 Run Query for Uniswap & SushiSwap
fetchPairData(UNISWAP_GRAPH_URL);
fetchPairData(SUSHISWAP_GRAPH_URL);
