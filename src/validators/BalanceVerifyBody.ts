import { IsEnum, IsEthereumAddress, IsOptional, IsString } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsString()
  signature!: string
  @IsString()
  message!: string
}
