import { BigNumber, ethers, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { RESERVED_CONTRACT_METADATA } from '@big-whale-labs/constants'
import { badRequest } from '@hapi/boom'
import { buildBabyjub, buildEddsa } from 'circomlibjs'
import {
  goerliProvider,
  mainnetProvider,
  rinkebyProvider,
} from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceVerifyBody from '@/validators/BalanceVerifyBody'
import EmailVerifyBody from '@/validators/EmailVerifyBody'
import FarcasterVerifyBody from '@/validators/FarcasterVerifyBody'
import MetadataVerifyBody from '@/validators/MetadataVerifyBody'
import axios from 'axios'
import ecdsaSigFromString from '@/helpers/ecdsaSigFromString'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'
import networkPick from '@/helpers/networkPick'
import sendEmail from '@/helpers/sendEmail'

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

  @Get('/ecdsa-address')
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
  async sendEmail(@Body({ required: true }) { emails }: EmailVerifyBody) {
    for (const email of emails.sort()) {
      const domain = email.split('@')[1].toLowerCase()
      const domainBytes = padZeroesOnRightUint8(utils.toUtf8Bytes(domain), 90)
      const signature = await eddsaSigFromString(domainBytes)
      void sendEmail({
        to: email,
        subject: "Here's your token!",
        secret: signature,
        domain,
      })
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
    const eddsaMessage = `${ownerAddress.toLowerCase()}owns${tokenAddress.toLowerCase()}${network
      .toLowerCase()
      .substring(0, 1)}`
    const eddsaSignature = await eddsaSigFromString([
      ...utils.toUtf8Bytes(eddsaMessage),
      balance,
    ])
    return {
      signature: eddsaSignature,
      message: eddsaMessage,
      balance: balance.toHexString(),
    }
  }

  @Post('/farcaster')
  async farcaster(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { username, address }: FarcasterVerifyBody
  ) {
    const abi = ['function usernameToUrl(bytes32 name) view returns (string)']
    const contract = new ethers.Contract(
      '0xe3Be01D99bAa8dB9905b33a3cA391238234B79D1',
      abi,
      rinkebyProvider
    )
    const url = (await contract.usernameToUrl(username)).replace(
      'directory',
      'proof'
    )
    const {
      data: { signerAddress },
    } = await axios.get<{
      signerAddress: string
    }>(url)
    if (signerAddress?.toLowerCase() !== address.toLowerCase()) {
      return ctx.throw(badRequest("Connected address doesn't match"))
    }
    // Generate EDDSA signature
    const eddsaMessage = `${address.toLowerCase()}ownsfarcaster`
    const eddsaSignature = await eddsaSigFromString([
      ...utils.toUtf8Bytes(eddsaMessage),
    ])
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
    const contractMetadata = RESERVED_CONTRACT_METADATA[tokenAddress]
    if (contractMetadata) {
      name = contractMetadata.name
      symbol = contractMetadata.symbol
    } else {
      try {
        const abi = [
          'function name() external view returns (string memory)',
          'function symbol() external view returns (string memory)',
        ]
        const contract = new ethers.Contract(
          tokenAddress,
          abi,
          networkPick(network, goerliProvider, mainnetProvider)
        )
        name = await contract.name()
        symbol = await contract.symbol()
      } catch (error) {
        return ctx.throw(
          badRequest(
            `Can't fetch the metadata: ${
              error instanceof Error ? error.message : error
            }`
          )
        )
      }
    }
    if (!name || !symbol) {
      return ctx.throw(badRequest('Name or symbol not found'))
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
