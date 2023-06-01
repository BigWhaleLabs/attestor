import { IsEthereumAddress, IsNumberString, IsOptional } from 'amala'

export default class {
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsEthereumAddress()
  ownerAddress!: string
  @IsNumberString()
  threshold!: string
  @IsOptional()
  @IsNumberString()
  tokenId?: number
}
