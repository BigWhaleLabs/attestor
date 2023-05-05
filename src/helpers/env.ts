import * as dotenv from 'dotenv'
import {
  ETH_NETWORK,
  ETH_RPC,
  ETH_RPC_MAINNET,
  ETH_MUMBAI_NETWORK,
} from '@big-whale-labs/constants'
import { cleanEnv, num, str } from 'envalid'
import { cwd } from 'process'
import { resolve } from 'path'

dotenv.config({ path: resolve(cwd(), '.env') })

// eslint-disable-next-line node/no-process-env
export default cleanEnv(process.env, {
  ECDSA_PRIVATE_KEY: str(),
  EDDSA_PRIVATE_KEY: str(),
  ETH_NETWORK: str({ default: ETH_NETWORK }),
  ETH_POLYGON_NETWORK: str({ default: ETH_MUMBAI_NETWORK }),
  ETH_RPC_POLYGON: str(),
  ETH_RPC: str({ default: ETH_RPC }),
  ETH_RPC_MAINNET: str({ default: ETH_RPC_MAINNET }),
  PORT: num({ default: 1337 }),
  SMTP_PASS: str(),
  SMTP_USER: str(),
})
