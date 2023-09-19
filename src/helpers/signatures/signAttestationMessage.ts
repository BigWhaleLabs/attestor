import AttestationType from '@/models/AttestationType'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'

export default async function signAttestationMessage(
  attestationType: AttestationType,
  attestationHash: string
) {
  const message = [attestationType, attestationHash]
  const signature = await eddsaSigPoseidon(message)

  return {
    message,
    signature,
  }
}
