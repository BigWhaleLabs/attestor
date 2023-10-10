import { IsEthereumAddress } from 'amala'

export default class {
  @IsEthereumAddress()
  ownerAddress!: string
}
