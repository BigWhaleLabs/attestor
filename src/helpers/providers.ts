import { providers } from 'ethers'
import env from '@/helpers/env'

export const goerliProvider = new providers.JsonRpcProvider(
  env.ETH_RPC,
  env.ETH_NETWORK
)
export const mainnetProvider = new providers.JsonRpcProvider(
  env.ETH_RPC_MAINNET,
  'mainnet'
)
export const polygonProvider = new providers.JsonRpcProvider(
  env.ETH_RPC_POLYGON,
  env.ETH_POLYGON_NETWORK
)
