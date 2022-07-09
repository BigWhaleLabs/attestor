import { BigNumber, ethers, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Post, Version } from 'amala'
import { Context } from 'koa'
import { ERC721__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { Entropy } from 'entropy-string'
import { badRequest } from '@hapi/boom'
import { buildBabyjub, buildEddsa } from 'circomlibjs'
import { goerliProvider, mainnetProvider } from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceVerifyBody from '@/validators/BalanceVerifyBody'
import EmailVerifyBody from '@/validators/EmailVerifyBody'
import MetadataVerifyBody from '@/validators/MetadataVerifyBody'
import TokenVerifyBody from '@/validators/TokenVerifyBody'
import ecdsaSigFromString from '@/helpers/ecdsaSigFromString'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import networkPick from '@/helpers/networkPick'
import sendEmail from '@/helpers/sendEmail'

const entropy = new Entropy({ total: 1e6, risk: 1e9 })
const zeroAddress = '0x0000000000000000000000000000000000000000'

function padZeroesOnRightUint8(array: Uint8Array, length: number) {
  const padding = new Uint8Array(length - array.length)
  return utils.concat([array, padding])
}

let publicKeyCached: { x: string; y: string } | undefined
let ecdsaAddress: string | undefined

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

  @Get('ecdsa-address')
  ecdsaAddress() {
    if (ecdsaAddress) {
      return ecdsaAddress
    }
    const ecdsaWallet = new ethers.Wallet(env.ECDSA_PRIVATE_KEY)
    const address = ecdsaWallet.address
    ecdsaAddress = address.toLowerCase()
    return ecdsaAddress
  }

  @Get('/email')
  email() {
    return env.SMTP_USER
  }

  @Post('/email')
  @Version('0.2.1')
  async sendEmailV021(@Body({ required: true }) { email }: EmailVerifyBody) {
    const domain = email.split('@')[1].toLowerCase()
    const domainBytes = padZeroesOnRightUint8(utils.toUtf8Bytes(domain), 90)
    const signature = await eddsaSigFromString(domainBytes)
    return sendEmail(email, "Here's your token!", signature)
  }

  @Post('/email')
  async sendEmail(@Body({ required: true }) { email }: EmailVerifyBody) {
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
    { tokenAddress, signature, message }: TokenVerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Verify ownership
    try {
      const contract = ERC721__factory.connect(tokenAddress, goerliProvider)
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

  @Post('/balance')
  async balance(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress = zeroAddress, network, ownerAddress }: BalanceVerifyBody
  ) {
    const provider = networkPick(network, goerliProvider, mainnetProvider)
    // Verify ownership
    let balance: BigNumber
    try {
      // Check if it's ethereum balance
      if (tokenAddress === zeroAddress) {
        balance = await provider.getBalance(ownerAddress)
      } else {
        const abi = ['function balanceOf(address owner) view returns (uint256)']
        const contract = new ethers.Contract(tokenAddress, abi, provider)
        balance = await contract.balanceOf(ownerAddress)
      }
    } catch {
      return ctx.throw(badRequest("Can't fetch the balance"))
    }
    // Generate EDDSA signature
    const eddsaMessage = `${ownerAddress.toLowerCase()}owns${tokenAddress.toLowerCase()}${network.substring(
      0,
      1
    )}`
    const eddsaSignature = await eddsaSigFromString(
      ethers.utils.concat([
        utils.toUtf8Bytes(eddsaMessage),
        utils.arrayify(balance),
      ])
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }

  @Post('/ethereum-address')
  async ethereumAddress(
    @Body({ required: true })
    { signature, message }: AddressVerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Generate EDDSA signature
    const eddsaMessage = ownerAddress.toLowerCase()
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
    }
  }

  @Post('/contract-metadata')
  async contractMetadata(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { tokenAddress, network }: MetadataVerifyBody
  ) {
    // Get metadata
    let name: string
    let symbol: string
    try {
      const abi = [
        'function name() external view returns (string _name)',
        'function symbol() external view returns (string _symbol);',
      ]
      const contract = new ethers.Contract(
        tokenAddress,
        abi,
        networkPick(network, goerliProvider, mainnetProvider)
      )
      name = await contract.name()
      symbol = await contract.symbol()
    } catch {
      return ctx.throw(badRequest("Can't fetch the metadata"))
    }
    const message = [
      ...ethers.utils.toUtf8Bytes(tokenAddress.toLowerCase()),
      networkPick(network, 103, 109), // 103 = 'g', 109 = 'm',
      ...ethers.utils.toUtf8Bytes(name),
      0,
      ...ethers.utils.toUtf8Bytes(symbol),
    ]
    const signature = await ecdsaSigFromString(new Uint8Array(message))
    return {
      signature,
      message: utils.hexlify(message),
    }
  }
}
