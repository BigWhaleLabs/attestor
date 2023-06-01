import { BigNumber } from 'ethers'
import { buildPoseidon } from 'circomlibjs'

let poseidon: typeof buildPoseidon
export default async function (
  message: (number | string | BigNumber)[] | Uint8Array,
  toString?: boolean
) {
  if (!poseidon) poseidon = await buildPoseidon()
  const F = poseidon.F

  return toString ? F.toString(poseidon(message)) : poseidon(message)
}
