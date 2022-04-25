export default interface ProofResponse {
  proof: {
    pi_a: [string, string]
    pi_b: [[string, string], [string, string]]
    pi_c: [string, string]
    protocol: string
    curve: string
  }
  publicSignals: [string, string]
}
