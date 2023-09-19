import poseidonHash from '@/helpers/signatures/poseidonHash'

export default function getAttestationHash(...attestation: string[]) {
  return poseidonHash(attestation, true)
}
