require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },

    networks: {
        // Arbitrum Network
        arbitrum: {
            url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
            chainId: 42161,
            // Ensure your PRIVATE_KEY does not include the "0x" prefix if you are adding it here.
            accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
        },

        // Avalanche Network
        avalanche: {
            url: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
            chainId: 43114,
            accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
        },

        // Ethereum Mainnet (for deployments or mainnet forking)
        mainnet: {
            url:
                process.env.ETH_MAINNET_RPC_URL ||
                "https://mainnet.infura.io/v3/<YOUR_INFURA_KEY>",
            chainId: 1,
            accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
        },

        // Hardhat Network with Mainnet Forking
        hardhat: {
            chainId: 31337,
            forking: {
                url: process.env.ETH_MAINNET_RPC_URL || "",
                blockNumber: 17000000, // You can make this configurable via an env variable if desired.
            },
            // Additional configuration can be added here if needed.
        },
    },

    etherscan: {
        // For verifying contracts on various networks
        apiKey: {
            arbitrumOne: process.env.ARBISCAN_API_KEY || "",
            avalanche: process.env.SNOWTRACE_API_KEY || "",
            mainnet: process.env.ETHERSCAN_API_KEY || "",
        },
    },

    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
        // Uncomment and set if you need a custom gas price API endpoint for non-Ethereum networks
        // gasPriceApi: "https://api.arbiscan.io/api?module=proxy&action=eth_gasPrice"
    },

    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
};
