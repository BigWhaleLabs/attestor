import { buildEddsa } from 'circomlibjs'
import { utils } from 'ethers'
import env from '@/helpers/env'
import poseidonHash from '@/helpers/signatures/poseidonHash'

const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)

export default async function (message: string[]) {
  const eddsa = await buildEddsa()
  const hash = await poseidonHash(message)

  const signature = eddsa.signPoseidon(privateKey, hash)
  const packedSignature = eddsa.packSignature(signature)

  return utils.hexlify(packedSignature)
}
