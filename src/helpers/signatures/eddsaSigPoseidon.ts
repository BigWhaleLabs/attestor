import { BigNumber, utils } from 'ethers'
import { buildEddsa, buildPoseidon } from 'circomlibjs'
import env from '@/helpers/env'

const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)

export default async function (message: (number | BigNumber)[] | Uint8Array) {
  // Message
  const poseidon = await buildPoseidon()
  const hash = poseidon(message)

  // EdDSA
  const eddsa = await buildEddsa()
  const signature = eddsa.signPoseidon(privateKey, hash)

  const packedSignature = eddsa.packSignature(signature)
  return utils.hexlify(packedSignature)
}
