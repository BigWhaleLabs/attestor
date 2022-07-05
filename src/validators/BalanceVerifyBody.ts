import { IsEnum, IsString } from 'amala'
import Network from '@/models/Network'

export default class {
  @IsEnum(Network)
  network!: Network
  @IsString()
  signature!: string
  @IsString()
  message!: string
}
