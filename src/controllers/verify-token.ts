import { BigNumber } from 'ethers'
import { Body, Controller, Post } from 'amala'
import TokenBody from '@/validators/TokenBody'
import eddsaSigFromString from '@/helpers/signatures/eddsaSigFromString'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  async token(@Body({ required: true }) { token }: TokenBody) {
    // TODO:
    // 1. Verify that token is a part of founders tokens or vc tokens
    // 2. Set attestationType to 1 if token is a part of founders tokens, 2 if token is a part of vc tokens
    const attestationTye = '' === token ? 1 : 2
    const message = [attestationTye, BigNumber.from(token)] // 1 = founders tokens, 2 = vc tokens
    const eddsaSignature = await eddsaSigFromString(message)
    return {
      message,
      signature: eddsaSignature,
    }
  }
}
