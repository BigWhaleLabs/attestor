import { IsEnum, IsEthereumAddress, IsNumberString, IsOptional } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string
  @IsEthereumAddress({ each: true })
  ownerAddresses!: string[]
  @IsNumberString()
  threshold!: string
}
