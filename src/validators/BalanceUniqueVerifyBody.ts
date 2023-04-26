import { IsEthereumAddress, IsOptional, IsString } from 'amala'

export default class {
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsEthereumAddress()
  ownerAddress!: string
  @IsString()
  threshold!: string
}
