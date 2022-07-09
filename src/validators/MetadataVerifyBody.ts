import { IsEnum, IsEthereumAddress } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsEthereumAddress()
  tokenAddress!: string
}
