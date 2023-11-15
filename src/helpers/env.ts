import * as dotenv from 'dotenv'
import {
  ETH_MUMBAI_NETWORK,
  ETH_NETWORK,
  ETH_RPC,
  ETH_RPC_MAINNET,
  KETL_INVITES_BACKEND,
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
  ETH_RPC: str({ default: ETH_RPC }),
  ETH_RPC_MAINNET: str({ default: ETH_RPC_MAINNET }),
  ETH_RPC_POLYGON: str(),
  KETL_INVITES_BACKEND: str({
    default: KETL_INVITES_BACKEND,
  }),
  MAILGUN_API_KEY: str(),
  MAILGUN_DOMAIN: str(),
  PORT: num({ default: 1337 }),
  SECRET: str(),
  SMTP_PASS: str(),
  SMTP_USER: str(),
})
