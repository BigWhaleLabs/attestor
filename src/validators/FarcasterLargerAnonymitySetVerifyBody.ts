import { IsEthereumAddress } from 'amala'

export default class {
  @IsEthereumAddress()
  address!: string
  @IsEthereumAddress({ each: true })
  ownerAddresses!: string[]
}
