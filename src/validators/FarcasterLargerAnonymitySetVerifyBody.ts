import { IsEthereumAddress } from 'amala'

export default class {
  @IsEthereumAddress({ each: true })
  ownerAddresses!: string[]
}
