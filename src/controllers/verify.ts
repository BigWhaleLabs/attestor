import { BigNumber, ethers, utils } from 'ethers'
import { Body, Controller, Ctx, Get, Post, Version } from 'amala'
import { Context } from 'koa'
import { RESERVED_CONTRACT_METADATA } from '@big-whale-labs/constants'
import { badRequest } from '@hapi/boom'
import { buildBabyjub, buildEddsa } from 'circomlibjs'
import { goerliProvider, mainnetProvider } from '@/helpers/providers'
import AddressVerifyBody from '@/validators/AddressVerifyBody'
import BalanceLargerAnonymitySetVerifyBody from '@/validators/BalanceLargerAnonymitySetVerifyBody'
import BalanceVerifyBody from '@/validators/BalanceVerifyBody'
import EmailVerifyBody from '@/validators/EmailVerifyBody'
import FarcasterLargerAnonymitySetVerifyBody from '@/validators/FarcasterLargerAnonymitySetVerifyBody'
import FarcasterVerifyBody from '@/validators/FarcasterVerifyBody'
import MetadataVerifyBody from '@/validators/MetadataVerifyBody'
import ecdsaSigFromString from '@/helpers/signatures/ecdsaSigFromString'
import eddsaSigFromString from '@/helpers/signatures/eddsaSigFromString'
import env from '@/helpers/env'
import getBalance from '@/helpers/getBalance'
import getMerkleTree from '@/helpers/getMerkleTree'
import isAddressConnectedToFarcaster from '@/helpers/farcaster/isAddressConnectedToFarcaster'
import networkPick from '@/helpers/networkPick'
import sendEmail from '@/helpers/sendEmail'
import zeroAddress from '@/models/zeroAddress'

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
        domain,
        secret: signature,
        subject: "Here's your token!",
        to: email,
      })
    }
  }

  @Post('/balance')
  async balance(
    @Ctx() ctx: Context,
    @Body({ required: true })
    {
      network,
      ownerAddress,
      tokenAddress = zeroAddress,
      tokenId,
    }: BalanceVerifyBody
  ) {
    const provider = networkPick(network, goerliProvider, mainnetProvider)
    // Verify ownership
    let balance: BigNumber
    try {
      balance = await getBalance(provider, ownerAddress, tokenAddress, tokenId)
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
      balance: balance.toHexString(),
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/balance')
  @Version('0.2.2')
  async balanceWithLargerAnonymitySet(
    @Ctx() ctx: Context,
    @Body({ required: true })
    {
      network,
      ownerAddresses,
      threshold: thresholdString,
      tokenAddress = zeroAddress,
    }: BalanceLargerAnonymitySetVerifyBody
  ) {
    const provider = networkPick(network, goerliProvider, mainnetProvider)
    // Verify ownership
    const balances = [] as BigNumber[]
    try {
      for (const ownerAddress of ownerAddresses) {
        balances.push(await getBalance(provider, ownerAddress, tokenAddress))
      }
    } catch {
      return ctx.throw(badRequest("Can't fetch the balances"))
    }
    // Check balances
    const threshold = BigNumber.from(thresholdString)
    for (const balance of balances) {
      if (balance.lt(threshold)) {
        return ctx.throw(badRequest('Not enough balance'))
      }
    }
    // Create Merkle tree of ownerAddresses
    const tree = await getMerkleTree(
      ownerAddresses.map((v) => BigNumber.from(v))
    )
    const merkleRoot = BigNumber.from(utils.hexlify(tree.root))
    // Get network
    const networkCompact = network.toLowerCase().substring(0, 1)
    const networkByte = utils.toUtf8Bytes(networkCompact)[0]
    // Generate EDDSA signature
    const eddsaMessage = [
      0, // "owns" type of attestation
      merkleRoot,
      BigNumber.from(tokenAddress),
      networkByte,
      threshold,
    ]
    const eddsaSignature = await eddsaSigFromString(eddsaMessage)
    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/farcaster')
  @Version('0.2.3')
  async farcasterWithLargerAnonymitySet(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { ownerAddresses }: FarcasterLargerAnonymitySetVerifyBody
  ) {
    try {
      for (const ownerAddress of ownerAddresses) {
        await isAddressConnectedToFarcaster(ownerAddress)
      }
    } catch {
      return ctx.throw(
        badRequest(`The Ethereum address should be connected to Farcaster!`)
      )
    }
    // Generate EDDSA signature
    const farcasterBytes = utils.toUtf8Bytes('farcaster')
    // Create Merkle tree of ownerAddresses
    const tree = await getMerkleTree(
      ownerAddresses.map((v) => BigNumber.from(v))
    )
    const merkleRoot = BigNumber.from(utils.hexlify(tree.root))
    // Get network
    const eddsaMessage = [
      0, // "owns" type of attestation,
      merkleRoot,
      ...farcasterBytes,
    ]

    const eddsaSignature = await eddsaSigFromString(eddsaMessage)

    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/farcaster')
  @Version('0.2.2')
  async farcasterCompact(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { address }: FarcasterVerifyBody
  ) {
    if (!(await isAddressConnectedToFarcaster(address)))
      return ctx.throw(
        badRequest(`The Ethereum address should be connected to Farcaster!`)
      )
    // Generate EDDSA signature
    const farcasterBytes = utils.toUtf8Bytes('farcaster')
    const eddsaMessage = [
      0, // "owns" type of attestation,
      address.toLowerCase(),
      ...farcasterBytes,
    ]

    const eddsaSignature = await eddsaSigFromString(
      eddsaMessage.map((v) => BigNumber.from(v))
    )

    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/farcaster')
  async farcaster(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { address }: FarcasterVerifyBody
  ) {
    if (!(await isAddressConnectedToFarcaster(address)))
      return ctx.throw(
        badRequest(`The Ethereum address should be connected to Farcaster!`)
      )
    // Generate EDDSA signature
    const eddsaMessage = `${address.toLowerCase()}ownsfarcaster`
    const eddsaSignature = await eddsaSigFromString([
      ...utils.toUtf8Bytes(eddsaMessage),
    ])
    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/ethereum-address')
  @Version('0.2.2')
  async ethereumAddressCompact(
    @Body({ required: true })
    { message, signature }: AddressVerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils
      .verifyMessage(message, signature)
      .toLowerCase()
    const ownerAddressNumber = BigNumber.from(ownerAddress)
    // Generate EDDSA signature
    const eddsaSignature = await eddsaSigFromString([ownerAddressNumber])
    return {
      message: ownerAddress,
      signature: eddsaSignature,
    }
  }

  @Post('/ethereum-address')
  async ethereumAddress(
    @Body({ required: true })
    { message, signature }: AddressVerifyBody
  ) {
    // Verify ECDSA signature
    const ownerAddress = ethers.utils.verifyMessage(message, signature)
    // Generate EDDSA signature
    const eddsaMessage = ownerAddress.toLowerCase()
    const eddsaSignature = await eddsaSigFromString(
      utils.toUtf8Bytes(eddsaMessage)
    )
    return {
      message: eddsaMessage,
      signature: eddsaSignature,
    }
  }

  @Post('/contract-metadata')
  async contractMetadata(
    @Ctx() ctx: Context,
    @Body({ required: true })
    { network, tokenAddress }: MetadataVerifyBody
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
      message: utils.hexlify(message),
      signature,
    }
  }
}
