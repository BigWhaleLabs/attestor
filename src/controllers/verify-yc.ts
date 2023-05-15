import { Body, Controller, Ctx, Post } from 'amala'
import { Context } from 'vm'
import { badRequest } from '@hapi/boom'
import { ethers, utils } from 'ethers'
import { polygonProvider } from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import Attestation from '@/models/Attestation'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import EmailUniqueVerifyBody from '@/validators/EmailUniqueVerifyBody'
import TwitterBody from '@/validators/TwitterBody'
import YCVerification from '@/models/YCVerification'
import eddsaSigPoseidon from '@/helpers/signatures/eddsaSigPoseidon'
import fetchUserProfile from '@/helpers/twitter/fetchUserProfile'
import getBalance from '@/helpers/getBalance'
import poseidonHash from '@/helpers/signatures/poseidonHash'
import sendEmail from '@/helpers/sendEmail'
import zeroAddress from '@/models/zeroAddress'

@Controller('/verify-yc')
export default class VerifyYCController {
  @Post('/email-unique')
  async sendUniqueEmail(
    @Body({ required: true }) { email }: EmailUniqueVerifyBody
  ) {
    const eddsaMessage = [
      YCVerification.email,
      utils.hexlify(utils.toUtf8Bytes(email)),
    ]

    const emailHash = await poseidonHash(eddsaMessage)

    const eddsaSignature = await eddsaSigPoseidon([Attestation.yc, emailHash])

    const domain = email.split('@')[1].toLowerCase()

    void sendEmail({
      domain,
      forKetl: true,
      secret: `${emailHash}:${eddsaSignature}`,
      subject: "Here's your token!",
      to: email,
    })
  }

  @Post('/twitter')
  async twitter(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token }: TwitterBody
  ) {
    let userId = ''
    try {
      const { id } = await fetchUserProfile(token)
      userId = id
    } catch (e) {
      console.log(e)
      return ctx.throw(badRequest('Failed to fetch user profile'))
    }

    const eddsaMessage = [YCVerification.twitter, userId]
    const userIdHash = await poseidonHash(eddsaMessage)

    const eddsaSignature = await eddsaSigPoseidon([Attestation.yc, userIdHash])

    return {
      message: [Attestation.yc, userIdHash],
      signature: eddsaSignature,
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

    if (signerAddress !== ownerAddress) {
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
    } catch {
      return ctx.throw(badRequest("Can't fetch the balances"))
    }

    const eddsaMessage = [
      YCVerification.balance,
      utils.hexlify(utils.toUtf8Bytes(ownerAddress)),
      utils.hexlify(utils.toUtf8Bytes(threshold)),
      utils.hexlify(utils.toUtf8Bytes(tokenAddress)),
    ]

    const balanceHash = await poseidonHash(eddsaMessage)

    const eddsaSignature = await eddsaSigPoseidon([
      Attestation.yc,
      ...utils.toUtf8Bytes(balanceHash),
    ])

    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }
}
