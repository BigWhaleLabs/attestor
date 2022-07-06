import { IsEnum, IsEthereumAddress, IsString } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsEthereumAddress()
  tokenAddress!: string
  @IsString()
  signature!: string
  @IsString()
  message!: string
}
