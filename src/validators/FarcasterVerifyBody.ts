import { IsEthereumAddress } from 'amala'

export default class {
  @IsEthereumAddress()
  address!: string
}
