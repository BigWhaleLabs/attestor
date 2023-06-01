import { utils } from 'ethers'

export default function hexlifyString(str: string) {
  return utils.hexlify(utils.toUtf8Bytes(str))
}
