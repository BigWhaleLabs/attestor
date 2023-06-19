import AttestationType from '@/models/AttestationType'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'
import poseidonHash from '@/helpers/signatures/poseidonHash'

export default async function signAttestationMessage(
  attestationType: AttestationType,
  ...attestation: string[]
) {
  const attestationHash = await poseidonHash(attestation, true)
  const message = [attestationType, attestationHash]
  const signature = await eddsaSigPoseidon(message)

  return {
    message,
    signature,
  }
}
