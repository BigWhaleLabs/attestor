import { IsEnum, IsEthereumAddress, IsOptional } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsEthereumAddress()
  ownerAddress!: string
}
