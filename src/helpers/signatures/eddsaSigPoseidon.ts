import { BigNumber, utils } from 'ethers'
import { buildEddsa } from 'circomlibjs'
import env from '@/helpers/env'
import poseidonHash from '@/helpers/signatures/poseidonHash'

const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)

let eddsa: typeof buildEddsa
export default async function (
  message: (string | number | BigNumber)[] | Uint8Array
) {
  const hash = await poseidonHash(message)
  if (!eddsa) eddsa = await buildEddsa()
  const signature = eddsa.signPoseidon(privateKey, hash)
  const packedSignature = eddsa.packSignature(signature)
  return utils.hexlify(packedSignature)
}
