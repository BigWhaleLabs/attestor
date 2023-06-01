import { Body, Controller, Ctx, Post } from 'amala'
import { Context } from 'vm'
import { badRequest } from '@hapi/boom'
import { ethers } from 'ethers'
import { polygonProvider } from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import Attestation from '@/models/Attestation'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import EmailUniqueVerifyBody from '@/validators/EmailUniqueVerifyBody'
import TwitterBody from '@/validators/TwitterBody'
import Verification from '@/models/Verification'
import fetchUserProfile from '@/helpers/twitter/fetchUserProfile'
import getBalance from '@/helpers/getBalance'
import getEmailDomain from '@/helpers/getEmailDomain'
import hexlifyString from '@/helpers/hexlifyString'
import sendEmail from '@/helpers/sendEmail'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'
import zeroAddress from '@/models/zeroAddress'

@Controller('/verify-yc')
export default class VerifyYCController {
  @Post('/email-unique')
  async sendUniqueEmail(
    @Body({ required: true }) { email }: EmailUniqueVerifyBody
  ) {
    const { message, signature } = await signAttestationMessage(
      Attestation.YC,
      Verification.email,
      hexlifyString(email)
    )
    const domain = getEmailDomain(email)

    void sendEmail({
      domain,
      forKetl: true,
      secret: `${message[1]}:${signature}`,
      subject: "Here's your token!",
      to: email,
    })
  }

  @Post('/twitter')
  async twitter(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token }: TwitterBody
  ) {
    try {
      const { id } = await fetchUserProfile(token)

      return signAttestationMessage(Attestation.YC, Verification.twitter, id)
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
    }: BalanceUniqueVerifyBody & AddressVerifyBody
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
      return ctx.throw(badRequest("Can't fetch the balances"))
    }

    return signAttestationMessage(
      Attestation.YC,
      Verification.balance,
      hexlifyString(ownerAddress.toLowerCase()),
      threshold,
      hexlifyString(tokenAddress)
    )
  }
}
