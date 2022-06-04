import * as ed from '@noble/ed25519'
import { Controller, Get, Post } from 'amala'
import env from '@/helpers/env'

@Controller('/verify')
export default class VerifyController {
  @Get('/eddsa-public-key')
  publicKey() {
    return '0x' + ed.getPublicKey(env.EDDSA_PRIVATE_KEY)
  }

  @Get('/email')
  email() {
    return env.SMTP_USER
  }

  @Post('/erc721')
  erc721() {
    return { success: false }
  }
}
