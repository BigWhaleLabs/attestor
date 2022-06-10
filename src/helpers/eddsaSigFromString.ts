import { buildEddsa, buildMimc7 } from 'circomlibjs'
import { utils } from 'ethers'
import cryptoRandomString from 'crypto-random-string'
import env from '@/helpers/env'

export default async function (message: string) {
  // Message
  const messageUInt8 = utils.toUtf8Bytes(
    `${message}-${cryptoRandomString({ length: 6 })}`
  )
  const mimc7 = await buildMimc7()
  const M = mimc7.multiHash(messageUInt8)
  // EdDSA
  const eddsa = await buildEddsa()
  const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)
  const signature = eddsa.signMiMC(privateKey, M)
  const packedSignature = eddsa.packSignature(signature)
  return utils.hexlify(packedSignature)
}
