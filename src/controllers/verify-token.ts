import { Body, Controller, Post } from 'amala'
import TokenBody from '@/validators/TokenBody'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'
import hexlifyString from '@/helpers/hexlifyString'

@Controller('/verify-token')
export default class VerifyTokenController {
  @Post('/token')
  token(@Body({ required: true }) { token, type }: TokenBody) {
    return signAttestationMessage(type, hexlifyString(token)))
  }
}
