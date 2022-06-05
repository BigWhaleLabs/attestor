import { IsEthereumAddress } from 'amala'

export default class {
  @IsEthereumAddress()
  tokenAddress!: string
  @IsEthereumAddress()
  ownerAddress!: string
}
