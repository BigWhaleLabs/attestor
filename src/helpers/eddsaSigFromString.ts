import { BigNumber, utils } from 'ethers'
import { buildEddsa, buildMimc7 } from 'circomlibjs'
import env from '@/helpers/env'

const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)

export default async function (message: (number | BigNumber)[] | Uint8Array) {
  // Message
  const mimc7 = await buildMimc7()
  const M = mimc7.multiHash(message)
  // EdDSA
  const eddsa = await buildEddsa()
  const signature = eddsa.signMiMC(privateKey, M)
  const packedSignature = eddsa.packSignature(signature)
  return utils.hexlify(packedSignature)
}
