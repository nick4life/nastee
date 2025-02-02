import { request, gql } from 'graphql-request';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testGraphAPI() {
    const query = `{
        pools(first: 1) {
            id
            token0Price
            token1Price
        }
    }`;

    try {
        console.log("🔹 Testing Graph API...");
        const response = await axios.post(process.env.UNISWAP_GRAPH_URL, { query });
        console.log("🔹 API Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Graph API Error:", error.message);
        if (error.response && error.response.data) {
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testGraphAPI();
