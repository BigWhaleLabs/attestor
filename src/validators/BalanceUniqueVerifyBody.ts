import { IsEthereumAddress, IsNumberString, IsOptional, IsString } from 'amala'

export default class {
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsEthereumAddress()
  ownerAddress!: string
  @IsString()
  threshold!: string
  @IsOptional()
  @IsNumberString()
  tokenId?: number
}
