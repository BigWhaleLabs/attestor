import { IsEthereumAddress, IsString } from 'amala'

export default class {
  @IsString()
  username!: string
  @IsEthereumAddress()
  address!: string
}
