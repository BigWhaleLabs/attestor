import { BigNumber } from 'ethers'
import { Body, Controller, Post } from 'amala'
import TokenBody from '@/validators/TokenBody'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  async token(@Body({ required: true }) { token, type }: TokenBody) {
    const message = [type, BigNumber.from(token)]

    const eddsaSignature = await eddsaSigPoseidon(message)
    return {
      message,
      signature: eddsaSignature,
    }
  }
}
