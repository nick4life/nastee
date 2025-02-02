import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const THEGRAPH_API_ENDPOINT = process.env.THEGRAPH_API_ENDPOINT;

if (!THEGRAPH_API_ENDPOINT) {
    console.error("❌ THEGRAPH_API_ENDPOINT is missing. Update your .env file.");
    process.exit(1);
}

// For Uniswap V3, the Uniswap V2 factory address isn't needed for this query,
// so you can remove or repurpose it if required.

// 🔹 GraphQL Query to Fetch Pools from Uniswap V3
const query = gql`
{
  pools(first: 5, orderBy: volumeUSD, orderDirection: desc) {
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
    sqrtPrice
    liquidity
    feeTier
    volumeUSD
  }
}`;

async function fetchPoolData() {
    try {
        console.log(`🔹 Fetching Pool Data from ${THEGRAPH_API_ENDPOINT}...`);
        const data = await request(THEGRAPH_API_ENDPOINT, query);
        console.log("✅ Pool Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("❌ Error fetching pool data:", error.message);
    }
}

// Run Query
fetchPoolData();
