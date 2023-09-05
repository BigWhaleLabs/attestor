import { Body, Controller, Ctx, Post, Version } from 'amala'
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
import OrangeDAOTokenAddress from '@/validators/OrangeDAOTokenAddress'
import Signature from '@/validators/Signature'
import Token from '@/validators/Token'
import TwitterBody from '@/validators/TwitterBody'
import VerificationType from '@/models/VerificationType'
import fetchUserProfile from '@/helpers/twitter/fetchUserProfile'
import getAllowlistMap from '@/helpers/getAllowlistMap'
import getBalance from '@/helpers/getBalance'
import getEmailDomain from '@/helpers/getEmailDomain'
import handleInvitationError from '@/helpers/handleInvitationError'
import hexlifyString from '@/helpers/hexlifyString'
import sendEmail from '@/helpers/sendEmail'
import signAttestationMessage from '@/helpers/signatures/signAttestationMessage'
import zeroAddress from '@/models/zeroAddress'

const allowlistMap = getAllowlistMap()

@Controller('/verify-ketl')
export default class VerifyKetlController {
  @Version('0.2.2')
  @Post('/token')
  multipleToken(
    @Ctx() ctx: Context,
    @Body({ required: true }) { token, types }: AttestationTypeList & Token
  ) {
    const attestations = []
    for (const type of types) {
      const allowlist = allowlistMap.get(type)
      if (allowlist?.has(`token:${token}`))
        attestations.push(signAttestationMessage(type, hexlifyString(token)))
    }

    if (!attestations.length)
      return ctx.throw(notFound(handleInvitationError('token')))
    return Promise.all(attestations)
  }

  @Post('/token')
  token(@Body({ required: true }) { token, type }: AttestationType & Token) {
    return signAttestationMessage(type, hexlifyString(token))
  }

  @Post('/email-unique')
  @Version('0.2.2')
  async sendMultipleEmailAttestation(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { email, types }: AttestationTypeList & Email
  ) {
    const secret = []

    for (const type of types) {
      const allowlist = allowlistMap.get(type)
      if (!allowlist?.has(`email:${email}`)) continue
      const { message, signature } = await signAttestationMessage(
        type,
        VerificationType.email,
        hexlifyString(email)
      )
      if (secret.length === 0) {
        const attestationHash = message[1]
        secret.push(attestationHash)
      }
      secret.push(`t${type}${signature}`)
    }

    if (!secret.length)
      return ctx.throw(notFound(handleInvitationError('email')))

    const domain = getEmailDomain(email)
    void sendEmail({
      domain,
      forKetl: true,
      secret: secret.join(''),
      subject: "Here's your token!",
      to: email,
    })
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
  @Version('0.2.2')
  async multipleTwitterAttestation(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { token, types }: TwitterBody & AttestationTypeList
  ) {
    const user = await fetchUserProfile(token)
    if (!user) return ctx.throw(badRequest('Failed to fetch user profile'))

    const { id } = user

    const attestations = []
    for (const type of types) {
      const allowlist = allowlistMap.get(type)
      if (allowlist?.has(`twitter:${id}`))
        attestations.push(
          signAttestationMessage(type, VerificationType.twitter, id)
        )
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

    return signAttestationMessage(type, VerificationType.twitter, id)
  }

  @Post('/balance-unique')
  @Version('0.2.2')
  async multipleBalanceAttestation(
    @Ctx() ctx: Context,
    @Body({ required: true })
    {
      message,
      ownerAddress,
      signature,
      threshold,
      tokenAddress = zeroAddress,
      tokenId,
      types,
    }: BalanceUniqueVerifyBody &
      Signature &
      AttestationTypeList &
      OrangeDAOTokenAddress
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

    const attestations = []
    for (const type of types) {
      const allowlist = allowlistMap.get(type)
      if (allowlist?.has(`orangedao:${ownerAddress}`))
        attestations.push(
          signAttestationMessage(
            type,
            VerificationType.balance,
            hexlifyString(ownerAddress.toLowerCase()),
            threshold,
            hexlifyString(YC_ALUM_NFT_CONTRACT)
          )
        )
      if (allowlist?.has(`bwlnft:${ownerAddress}`))
        attestations.push(
          signAttestationMessage(
            type,
            VerificationType.balance,
            hexlifyString(ownerAddress.toLowerCase()),
            threshold,
            hexlifyString(KETL_BWL_NFT_CONTRACT)
          )
        )
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

    return signAttestationMessage(
      type,
      VerificationType.balance,
      hexlifyString(ownerAddress.toLowerCase()),
      threshold,
      hexlifyString(tokenAddress)
    )
  }
}
