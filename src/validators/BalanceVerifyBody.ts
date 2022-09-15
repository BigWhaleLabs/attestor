import { IsEnum, IsEthereumAddress, IsOptional } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  owners!: { address: string; tokenAddress: string; threshold: string }[]
}
