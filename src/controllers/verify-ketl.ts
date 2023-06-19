import { Body, Controller, Ctx, Post } from 'amala'
import { Context } from 'vm'
import { badRequest } from '@hapi/boom'
import { ethers } from 'ethers'
import { polygonProvider } from '@/helpers/providers'
import AttestationType from '@/validators/AttestationType'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import Email from '@/validators/Email'
import Signature from '@/validators/Signature'
import Token from '@/validators/Token'
import TwitterBody from '@/validators/TwitterBody'
import VerificationType from '@/models/VerificationType'
import fetchUserProfile from '@/helpers/twitter/fetchUserProfile'
import getBalance from '@/helpers/getBalance'
import getEmailDomain from '@/helpers/getEmailDomain'
import hexlifyString from '@/helpers/hexlifyString'
import sendEmail from '@/helpers/sendEmail'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'
import zeroAddress from '@/models/zeroAddress'

@Controller('/verify-ketl')
export default class VerifyKetlController {
  @Post('/token')
  token(@Body({ required: true }) { token, type }: AttestationType & Token) {
    return signAttestationMessage(type, hexlifyString(token))
  }

  @Post('/email-unique')
  async sendUniqueEmail(
    @Body({ required: true })
    { email, type }: AttestationType & Email
  ) {
    const { message, signature } = await signAttestationMessage(
      type,
      VerificationType.email,
      hexlifyString(email)
    )
    const domain = getEmailDomain(email)
    const attestationHash = message[1]

    void sendEmail({
      domain,
      forKetl: true,
      secret: `${type}${attestationHash}${signature}`,
      subject: "Here's your token!",
      to: email,
    })
  }

  @Post('/twitter')
  async twitter(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token, type }: TwitterBody & AttestationType
  ) {
    try {
      const { id } = await fetchUserProfile(token)

      return signAttestationMessage(type, VerificationType.twitter, id)
    } catch (e) {
      console.error(e)
      return ctx.throw(badRequest('Failed to fetch user profile'))
    }
  }

  @Post('/balance-unique')
  async sendUniqueBalance(
    @Ctx() ctx: Context,
    @Body({ required: true })
    {
      message,
      ownerAddress,
      signature,
      threshold,
      tokenAddress = zeroAddress,
      tokenId,
      type,
    }: BalanceUniqueVerifyBody & Signature & AttestationType
  ) {
    const signerAddress = ethers.utils
      .verifyMessage(message, signature)
      .toLowerCase()

    if (signerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return ctx.throw(badRequest('Invalid ownerAddress'))
    }

    try {
      const balance = await getBalance(
        polygonProvider,
        ownerAddress,
        tokenAddress,
        tokenId
      )
      if (balance.lt(threshold)) {
        return ctx.throw(badRequest('Not enough balance'))
      }
    } catch (e) {
      console.error(e)
      return ctx.throw(badRequest("Can't fetch the balances"))
    }

    return signAttestationMessage(
      type,
      VerificationType.balance,
      hexlifyString(ownerAddress.toLowerCase()),
      threshold,
      hexlifyString(tokenAddress)
    )
  }
}
