import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const THEGRAPH_API_ENDPOINT = process.env.THEGRAPH_API_ENDPOINT;

if (!THEGRAPH_API_ENDPOINT) {
    console.error("❌ THEGRAPH_API_ENDPOINT is missing. Update your .env file.");
    process.exit(1);
}

const query = gql`
{
  pools(first: 5) {
    id
    token0 {
      id
      symbol
    }
    token1 {
      id
      symbol
    }
    liquidity
    sqrtPrice
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

fetchPoolData();
// JavaScript source code
