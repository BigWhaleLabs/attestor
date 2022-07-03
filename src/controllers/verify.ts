import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { Entropy } from 'entropy-string'
import { badRequest } from '@hapi/boom'
import { buildBabyjub, buildEddsa } from 'circomlibjs'
import { ethers, utils } from 'ethers'
import ERC721VerifyBody from '@/validators/ERC721VerifyBody'
import EmailBody from '@/validators/EmailBody'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import provider from '@/helpers/provider'
import sendEmail from '@/helpers/sendEmail'

const entropy = new Entropy({ total: 1e6, risk: 1e9 })

function padZeroesOnRightUint8(array: Uint8Array, length: number) {
  const padding = new Uint8Array(length - array.length)
  return utils.concat([array, padding])
}

let publicKeyCached: { x: string; y: string } | undefined
@Controller('/verify')
export default class VerifyController {
  @Get('/eddsa-public-key')
  async publicKey() {
    if (publicKeyCached) {
      return publicKeyCached
    }
    const babyJub = await buildBabyjub()
    const F = babyJub.F
    const eddsa = await buildEddsa()
    const privateKey = utils.arrayify(env.EDDSA_PRIVATE_KEY)
    const publicKey = eddsa.prv2pub(privateKey)
    publicKeyCached = {
      x: F.toObject(publicKey[0]).toString(),
      y: F.toObject(publicKey[1]).toString(),
    }
    return publicKeyCached
  }

  @Get('/email')
  email() {
    return env.SMTP_USER
  }

  @Post('/email')
  async sendEmail(@Body({ required: true }) { email }: EmailBody) {
    const domain = email.split('@')[1].toLowerCase()
    const domainBytes = padZeroesOnRightUint8(utils.toUtf8Bytes(domain), 90)
    const nullifier = entropy.string()
    const messageUInt8 = utils.concat([
      domainBytes,
      utils.toUtf8Bytes(nullifier),
    ])

    const signature = await eddsaSigFromString(messageUInt8)
    return sendEmail(email, "Here's your token!", `${signature}-${nullifier}`)
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
    const nullifier = entropy.string()
    const eddsaMessage = `${ownerAddress.toLowerCase()}-owns-${tokenAddress.toLowerCase()}-${nullifier}`
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }
}
