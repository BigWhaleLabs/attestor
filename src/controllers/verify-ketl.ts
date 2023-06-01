import { Body, Controller, Ctx, Post } from 'amala'
import { Context } from 'vm'
import { badRequest } from '@hapi/boom'
import { ethers } from 'ethers'
import { polygonProvider } from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import EmailUniqueVerifyBody from '@/validators/EmailUniqueVerifyBody'
import TokenBody from '@/validators/TokenBody'
import TwitterBody from '@/validators/TwitterBody'
import TypeAttestation from '@/validators/TypeAttestation'
import Verification from '@/models/Verification'
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
  token(
    @Body({ required: true }) { token, type }: TokenBody & TypeAttestation
  ) {
    return signAttestationMessage(type, hexlifyString(token))
  }

  @Post('/email-unique')
  async sendUniqueEmail(
    @Body({ required: true })
    { email, type }: EmailUniqueVerifyBody & TypeAttestation
  ) {
    const { message, signature } = await signAttestationMessage(
      type,
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
    @Body({ required: true }) { token, type }: TwitterBody & TypeAttestation
  ) {
    try {
      const { id } = await fetchUserProfile(token)

      return signAttestationMessage(type, Verification.twitter, id)
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
    }: BalanceUniqueVerifyBody & AddressVerifyBody & TypeAttestation
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
      Verification.balance,
      hexlifyString(ownerAddress.toLowerCase()),
      threshold,
      hexlifyString(tokenAddress)
    )
  }
}
