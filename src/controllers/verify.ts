import { BigNumber, ethers, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { badRequest } from '@hapi/boom'
import { buildBabyjub, buildEddsa } from 'circomlibjs'
import { goerliProvider, mainnetProvider } from '@/helpers/providers'
import BalanceVerifyBody from '@/validators/BalanceVerifyBody'
import EmailVerifyBody from '@/validators/EmailVerifyBody'
import Network from '@/models/Network'
import TokenVerifyBody from '@/validators/TokenVerifyBody'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import sendEmail from '@/helpers/sendEmail'

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
  async sendEmail(@Body({ required: true }) { email }: EmailVerifyBody) {
    const domain = email.split('@')[1].toLowerCase()
    const domainBytes = padZeroesOnRightUint8(utils.toUtf8Bytes(domain), 90)
    const signature = await eddsaSigFromString(domainBytes)
    return sendEmail(email, "Here's your token!", signature)
  }

  @Post('/erc721')
  async erc721(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress, signature, message, network }: TokenVerifyBody
  ) {
    const provider =
      network === Network.goerli ? goerliProvider : mainnetProvider
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
    const eddsaMessage = `${ownerAddress.toLowerCase()}owns${tokenAddress.toLowerCase()}`
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }

  @Post('/ethereum-balance')
  async ethereumBalance(
    @Body({ required: true })
    { signature, message, network }: BalanceVerifyBody
  ) {
    const provider =
      network === Network.goerli ? goerliProvider : mainnetProvider
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Verify ownership
    const balance = await provider.getBalance(ownerAddress)
    // Generate EDDSA signature
    const eddsaMessage = `${ownerAddress.toLowerCase()}${balance.toHexString()}`
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }

  @Post('/erc20-balance')
  async erc20Balance(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress, signature, message, network }: TokenVerifyBody
  ) {
    const provider =
      network === Network.goerli ? goerliProvider : mainnetProvider
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Verify ownership
    let balance: BigNumber
    try {
      const abi = [
        // Read-Only Functions
        'function balanceOf(address owner) view returns (uint256)',
      ]
      const contract = new ethers.Contract(tokenAddress, abi, provider)
      balance = await contract.balanceOf(ownerAddress)
    } catch {
      return ctx.throw(badRequest("Can't verify token ownership"))
    }
    // Generate EDDSA signature
    const eddsaMessage = `${ownerAddress.toLowerCase()}owns${tokenAddress.toLowerCase()}${balance.toHexString()}`
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }
}
