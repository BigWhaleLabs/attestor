import { Body, Controller, Ctx, Post } from 'amala'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import EmailUniqueVerifyBody from '@/validators/EmailUniqueVerifyBody'
import TokenBody from '@/validators/TokenBody'
import { ethers, utils } from 'ethers'
import { badRequest } from '@hapi/boom'
import { Context } from 'vm'
import getBalance from '@/helpers/getBalance'
import { polygonProvider } from '@/helpers/providers'
import poseidonHash from '@/helpers/signatures/poseidonHash'
import fetchUserProfile from '@/helpers/twitter/twitterProfile'
import zeroAddress from '@/models/zeroAddress'
import eddsaSigFromString from '@/helpers/signatures/eddsaSigFromString'
import sendEmail from '@/helpers/sendEmail'

@Controller('/verify-yc')
export default class VerifyYCController {
  @Post('/email-unique')
  async sendUniqueEmail(@Body({ required: true }) { email }: EmailUniqueVerifyBody) {
    // 1. Create `emailHash = poseidon([0, email])`, (0 = email attestation)
    const eddsaMessage = [
      '0',
      utils.hexlify(utils.toUtf8Bytes(email)),
    ]
    
    const emailHash = await poseidonHash(eddsaMessage)

    // 2. Sign `[0, emailHash]` with EdDSA, (0 = yc attestation)
    const eddsaSignature = await eddsaSigFromString([
      0,
      ...utils.toUtf8Bytes(emailHash),
    ])

    const domain = email.split('@')[1].toLowerCase()

    // TODO:
    // 3. Send email with signature (must look nice and ketl branded)
    void sendEmail({
      domain,
      secret: eddsaSignature,
      subject: "Here's your token!",
      to: email,
    })
  }


  @Post('/twitter')
  async twitter(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token }: TokenBody
  ) {
    // 1. Verify token
    let userId = ''
    try {
      const { id } = await fetchUserProfile(token)
      userId = id
    } catch (e) {
      console.log(e)
      return ctx.throw(badRequest("Failed to fetch user profile"))
    }


    // 2. Get userIdHash = poseidon([1, userId]), (1 = twitter attestation)
    const eddsaMessage = [
      '1',
      utils.hexlify(utils.toUtf8Bytes(userId)),
    ]
    
    const userIdHash = await poseidonHash(eddsaMessage)

    // 3. Sign `[0, userIdHash]` with EdDSA, (0 = yc attestation)
    const eddsaSignature = await eddsaSigFromString([
      0,
      ...utils.toUtf8Bytes(userIdHash),
    ])

    // 4. Return signature
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
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
    // 1. Verify signature and that ownerAddress signed the signature
    const signerAddress = ethers.utils
      .verifyMessage(message, signature)
      .toLowerCase()

    if (signerAddress !== ownerAddress) {
      return ctx.throw(badRequest("Invalid ownerAddress"))
    }

    // 2. Verify that ownerAddress owns at least threshold of tokenAddress (if tokenAddress is undefined, use ETH)
    try {
      const balance = await getBalance(polygonProvider, ownerAddress, tokenAddress, tokenId)
      if (balance.lt(threshold)) {
        return ctx.throw(badRequest('Not enough balance'))
      }
    } catch {
      return ctx.throw(badRequest("Can't fetch the balances"))
    }

    // 3. Create `balanceHash = poseidon([2, ownerAddress, threshold, tokenAddress])`, (2 = balance attestation)
    const eddsaMessage = [
      '2',
      utils.hexlify(utils.toUtf8Bytes(ownerAddress)),
      utils.hexlify(utils.toUtf8Bytes(threshold)),
      utils.hexlify(utils.toUtf8Bytes(tokenAddress)),
    ]
    
    const balanceHash = await poseidonHash(eddsaMessage)

    // 4. Sign `[0, balanceHash]` with EdDSA, (0 = yc attestation)
    const eddsaSignature = await eddsaSigFromString([
      0,
      ...utils.toUtf8Bytes(balanceHash),
    ])

    // 5. Return signature
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }
}
