import { Wallet } from 'ethers'
import env from '@/helpers/env'

const ecdsaWallet = new Wallet(env.ECDSA_PRIVATE_KEY)

export default function (message: Uint8Array) {
  return ecdsaWallet.signMessage(message)
}
