import { Body, Controller, Post } from 'amala'
import { utils } from 'ethers'
import TokenBody from '@/validators/TokenBody'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  token(@Body({ required: true }) { token, type }: TokenBody) {
    return signAttestationMessage(type, utils.hexlify(utils.toUtf8Bytes(token)))
  }
}
