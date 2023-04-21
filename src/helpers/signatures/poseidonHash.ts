import { buildPoseidon } from 'circomlibjs'

export default async function (message: string[]) {
  const poseidon = await buildPoseidon()
  return poseidon(message)
}
