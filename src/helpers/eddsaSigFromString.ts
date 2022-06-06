import * as ed from '@noble/ed25519'
import { ethers } from 'ethers'
import env from '@/helpers/env'

export default async function (str: string) {
  const hexMessage = Buffer.from(str, 'utf8').toString('hex')
  const signature = await ed.sign(hexMessage, env.EDDSA_PRIVATE_KEY)
  return ethers.utils.hexlify(signature)
}
