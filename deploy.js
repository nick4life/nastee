const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Compile and deploy the contract
    const ImprovedSlippageBot = await hre.ethers.getContractFactory("ImprovedSlippageBot");
    const bot = await ImprovedSlippageBot.deploy(
        process.env.UNISWAP_ROUTER, // Uniswap V3 router address
        process.env.WETH           // WETH address
    );

    await bot.deployed();
    console.log("ImprovedSlippageBot deployed to:", bot.address);
}

// Execute the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
