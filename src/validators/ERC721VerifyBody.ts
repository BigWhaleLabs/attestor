import { IsEthereumAddress, IsString } from 'amala'

export default class {
  @IsEthereumAddress()
  tokenAddress!: string
  @IsString()
  signature!: string
  @IsString()
  message!: string
}
