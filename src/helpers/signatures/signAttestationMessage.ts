import Attestation from '@/models/Attestation'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'
import poseidonHash from '@/helpers/signatures/poseidonHash'

export default async function signAttestationMessage(
  attestation: Attestation,
  ...eddsaMessage: string[]
) {
  const hash = await poseidonHash(eddsaMessage, true)
  const message = [attestation, hash]
  const signature = await eddsaSigPoseidon(message)

  return {
    message,
    signature,
  }
}
