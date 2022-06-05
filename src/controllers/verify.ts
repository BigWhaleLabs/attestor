import * as ed from '@noble/ed25519'
import * as secp256k1 from '@noble/secp256k1'
import { BigNumber } from 'ethers'
import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { badRequest } from '@hapi/boom'
import ECDSASigBody from '@/validators/ECDSASigBody'
import TokenOwnershipBody from '@/validators/TokenOwnershipBody'
import env from '@/helpers/env'
import provider from '@/helpers/provider'

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
  async erc721(
    @Ctx() ctx: Context,
    @Body({ required: true })
    {
      tokenAddress,
      ownerAddress,
      r,
      s,
      msghash,
      pubkey,
    }: ECDSASigBody & TokenOwnershipBody
  ) {
    // Verify ECDSA signature
    if (
      !secp256k1.verify(
        new secp256k1.Signature(
          BigNumber.from(r).toBigInt(),
          BigNumber.from(s).toBigInt()
        ),
        msghash,
        pubkey
      )
    ) {
      return ctx.throw(badRequest('Wrong ECDSA signature'))
    }
    // Verify ownership
    const contract = ERC721__factory.connect(tokenAddress, provider)
    const balance = await contract.balanceOf(ownerAddress)
    if (balance.lte(0)) {
      return ctx.throw(badRequest('Token not owned'))
    }
    // Generate EDDSA signature
    const hexMessage = Buffer.from(
      `${ownerAddress}-owns-${tokenAddress}`,
      'utf8'
    ).toString('hex')
    const signature = await ed.sign(hexMessage, env.EDDSA_PRIVATE_KEY)
    const signatureHexString = Buffer.from(signature).toString('hex')
    return { signature: signatureHexString }
  }
}
