import { Body, Controller, Ctx, Flow, Post, Version } from 'amala'
import { Context } from 'vm'
import {
  KETL_BWL_NFT_CONTRACT,
  YC_ALUM_NFT_CONTRACT,
} from '@big-whale-labs/constants'
import { badRequest, notFound } from '@hapi/boom'
import { ethers } from 'ethers'
import { polygonProvider } from '@/helpers/providers'
import AttestationType from '@/validators/AttestationType'
import AttestationTypeList from '@/validators/AttestationTypeList'
import BalanceUniqueVerifyBody from '@/validators/BalanceUniqueVerifyBody'
import Email from '@/validators/Email'
import SignValidator from '@/validators/SignValidator'
import Signature from '@/validators/Signature'
import Token from '@/validators/Token'
import TwitterBody from '@/validators/TwitterBody'
import VerificationType from '@/models/VerificationType'
import authenticate from '@/helpers/authenticate'
import checkInvite from '@/helpers/ketl/checkInvite'
import fetchUserProfile from '@/helpers/twitter/fetchUserProfile'
import getAttestationHash from '@/helpers/signatures/getAttestationHash'
import getBalance from '@/helpers/getBalance'
import handleInvitationError from '@/helpers/handleInvitationError'
import hexlifyString from '@/helpers/hexlifyString'
import sendEmail from '@/helpers/sendEmail'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'
import zeroAddress from '@/models/zeroAddress'

@Controller('/verify-ketl')
export default class VerifyKetlController {
  @Version('0.2.2')
  @Post('/token')
  async multipleToken(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token, types }: AttestationTypeList & Token
  ) {
    const attestations = []
    for (const type of types) {
      const attestationHash = await getAttestationHash(hexlifyString(token))
      const record = await signAttestationMessage(type, attestationHash)
      if (await checkInvite(type, attestationHash)) attestations.push(record)
    }

    if (!attestations.length)
      return ctx.throw(notFound(handleInvitationError('token')))
    return Promise.all(attestations)
  }

  @Post('/token')
  token(@Body({ required: true }) { token, type }: AttestationType & Token) {
    return signAttestationMessage(type, hexlifyString(token))
  }

  @Post('/sign')
  @Flow(authenticate)
  @Version('0.2.2')
  async sign(
    @Ctx() ctx: Context,
    @Body({ required: true })
    body: SignValidator
  ) {
    const { hash, types } = body
    const secretParts = []

    for (const type of types) {
      const { message, signature } = await signAttestationMessage(type, hash)
      const hasInvite = await checkInvite(type, hash)
      if (!hasInvite) continue
      if (secretParts.length === 0) {
        const attestationHash = message[1]
        secretParts.push(attestationHash)
      }
      secretParts.push(`t${type}${signature}`)
    }

    if (!secretParts.length)
      return ctx.throw(notFound(handleInvitationError('email')))

    const secret = secretParts.join('')

    return {
      secret,
    }
  }

  @Post('/email-unique')
  @Version('0.2.2')
  async sendMultipleEmailAttestation(
    @Ctx() ctx: Context,
    @Body({ required: true })
    body: AttestationTypeList & Email
  ) {
    const { email, types } = body
    const secret = []

    for (const type of types) {
      const attestationHash = await getAttestationHash(
        VerificationType.email,
        hexlifyString(email)
      )
      const { message, signature } = await signAttestationMessage(
        type,
        attestationHash
      )
      const hasInvite = await checkInvite(type, attestationHash)
      if (!hasInvite) continue
      if (secret.length === 0) {
        const attestationHash = message[1]
        secret.push(attestationHash)
      }
      secret.push(`t${type}${signature}`)
    }

    if (!secret.length)
      return ctx.throw(notFound(handleInvitationError('email')))

    const fullSecret = secret.join('')

    void sendEmail({
      forKetl: true,
      secret: fullSecret,
      subject: "Here's your invite code!",
      to: email,
    })
  }

  @Post('/email-unique')
  async sendUniqueEmail(
    @Body({ required: true })
    body: AttestationType & Email
  ) {
    const { email, type } = body
    const attestationHash = await getAttestationHash(
      VerificationType.email,
      hexlifyString(email)
    )
    const { signature } = await signAttestationMessage(type, attestationHash)

    void sendEmail({
      forKetl: true,
      secret: `${type}${attestationHash}${signature}`,
      subject: "Here's your invite code!",
      to: email,
    })
  }

  @Post('/twitter')
  @Version('0.2.2')
  async multipleTwitterAttestation(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { token, types }: TwitterBody & AttestationTypeList
  ) {
    const user = await fetchUserProfile(token)
    if (!user) return ctx.throw(badRequest('Failed to fetch user profile'))

    const { id, username } = user

    const attestations = []
    for (const type of types) {
      const attestationHash = await getAttestationHash(
        VerificationType.twitter,
        id
      )
      const record = await signAttestationMessage(type, attestationHash)
      const hasInvite = await checkInvite(type, attestationHash)
      if (hasInvite) attestations.push(record)

      const attestationHashHandle = await getAttestationHash(
        VerificationType.twitterHandle,
        hexlifyString(username)
      )
      const recordHandle = await signAttestationMessage(
        type,
        attestationHashHandle
      )
      const hasInviteHandle = await checkInvite(type, attestationHashHandle)
      if (hasInviteHandle) attestations.push(recordHandle)
    }

    if (!attestations.length)
      return ctx.throw(notFound(handleInvitationError('Twitter handle')))

    return Promise.all(attestations)
  }

  @Post('/twitter')
  async twitter(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token, type }: TwitterBody & AttestationType
  ) {
    const user = await fetchUserProfile(token)
    if (!user) return ctx.throw(badRequest('Failed to fetch user profile'))
    const { id } = user

    const attestationHash = await getAttestationHash(
      VerificationType.twitter,
      id
    )
    return signAttestationMessage(type, attestationHash)
  }

  @Post('/balance-unique')
  @Version('0.2.2')
  async multipleBalanceAttestationSimplified(
    @Ctx() ctx: Context,
    @Body({ required: true })
    body: Signature & AttestationTypeList
  ) {
    const { message, signature, types } = body
    const signerAddress = ethers.utils
      .verifyMessage(message, signature)
      .toLowerCase()

    const attestations = []
    for (const type of types) {
      for (const tokenAddress of [
        YC_ALUM_NFT_CONTRACT,
        KETL_BWL_NFT_CONTRACT,
      ]) {
        try {
          const attestationHash = await getAttestationHash(
            VerificationType.balance,
            hexlifyString(signerAddress),
            1,
            hexlifyString(tokenAddress)
          )
          const record = await signAttestationMessage(type, attestationHash)
          const hasInvite = await checkInvite(type, attestationHash)
          if (hasInvite) attestations.push(record)
        } catch (e) {
          console.error(e)
        }
      }
    }

    if (!attestations.length)
      return ctx.throw(notFound(handleInvitationError('wallet')))

    return Promise.all(attestations)
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

    const attestationHash = await getAttestationHash(
      VerificationType.balance,
      hexlifyString(ownerAddress.toLowerCase()),
      threshold,
      hexlifyString(tokenAddress)
    )

    return signAttestationMessage(type, attestationHash)
  }
}
