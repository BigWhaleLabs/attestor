import { providers } from 'ethers'
import env from '@/helpers/env'

export default new providers.JsonRpcProvider(env.ETH_RPC, env.ETH_NETWORK)
