import { Body, Controller, Post } from 'amala'
import { utils } from 'ethers'
import TokenBody from '@/validators/TokenBody'
import signVerificationMessage from '@/helpers/signatures/signVerificationMessage'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  token(@Body({ required: true }) { token, type }: TokenBody) {
    return signVerificationMessage(
      type,
      utils.hexlify(utils.toUtf8Bytes(token))
    )
  }
}
