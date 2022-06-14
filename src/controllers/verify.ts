import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { badRequest } from '@hapi/boom'
import { buildEddsa } from 'circomlibjs'
import { ethers, utils } from 'ethers'
import ERC721VerifyBody from '@/validators/ERC721VerifyBody'
import EmailBody from '@/validators/EmailBody'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import provider from '@/helpers/provider'
import sendEmail from '@/helpers/sendEmail'

@Controller('/verify')
export default class VerifyController {
  @Get('/eddsa-public-key')
  async publicKey() {
    const eddsa = await buildEddsa()
    const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)
    const publicKey = eddsa.prv2pub(privateKey)
    return utils.hexlify(publicKey[0])
  }

  @Get('/email')
  email() {
    return env.SMTP_USER
  }

  @Post('/email')
  sendEmail(@Body({ required: true }) { email }: EmailBody) {
    const signatureHexString = eddsaSigFromString(email)
    return sendEmail(
      email,
      "Here's your token!",
      `Your token is: ${signatureHexString}`
    )
  }

  @Post('/erc721')
  async erc721(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress, signature, message }: ERC721VerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Verify ownership
    try {
      const contract = ERC721__factory.connect(tokenAddress, provider)
      const balance = await contract.balanceOf(ownerAddress)
      if (balance.lte(0)) {
        return ctx.throw(badRequest('Token not owned'))
      }
    } catch {
      return ctx.throw(badRequest("Can't verify token ownership"))
    }
    // Generate EDDSA signature
    const eddsaMessage = `${ownerAddress}-owns-${tokenAddress}`
    return {
      signature: await eddsaSigFromString(eddsaMessage),
      message: eddsaMessage,
    }
  }
}
