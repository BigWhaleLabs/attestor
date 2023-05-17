import Attestation from '@/models/Attestation'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'
import poseidonHash from '@/helpers/signatures/poseidonHash'

export default async function signVerificationMessage(
  attestation: Attestation,
  ...eddsaMessage: string[]
) {
  const hash = await poseidonHash(eddsaMessage)
  const message = [attestation, hash]
  const signature = await eddsaSigPoseidon(message)

  return {
    message,
    signature,
  }
}
