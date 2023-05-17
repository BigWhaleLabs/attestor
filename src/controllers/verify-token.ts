import { Body, Controller, Post } from 'amala'
import { utils } from 'ethers'
import TokenBody from '@/validators/TokenBody'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'
import poseidonHash from '@/helpers/signatures/poseidonHash'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  async token(@Body({ required: true }) { token, type }: TokenBody) {
    const hash = await poseidonHash([utils.hexlify(utils.toUtf8Bytes(token))])
    const message = [type, hash]
    const eddsaSignature = await eddsaSigPoseidon(message)

    return {
      message,
      signature: eddsaSignature,
    }
  }
}
