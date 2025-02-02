const query = gql`
{
  pair(id: "${UNISWAPV2_PAIR_ADDRESS}") {
    id
    token0 { id symbol name }
    token1 { id symbol name }
    reserve0
    reserve1
    totalSupply
    reserveUSD
    volumeUSD
  }
}`;
