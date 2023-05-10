import { buildPoseidon } from 'circomlibjs'

export default async function (message: string[]) {
  const poseidon = await buildPoseidon()
  const F = poseidon.F

  return F.toString(poseidon(message))
}
