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
export const rinkebyProvider = new providers.JsonRpcProvider(
  env.ETH_RPC_RINKEBY,
  'rinkeby'
)
