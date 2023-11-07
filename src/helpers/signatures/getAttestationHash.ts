import poseidonHash from '@/helpers/signatures/poseidonHash'

export default function getAttestationHash(
  ...attestation: (string | number)[]
) {
  return poseidonHash(attestation, true)
}
