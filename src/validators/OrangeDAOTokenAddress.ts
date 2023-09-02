import { IsEthereumAddress, IsIn } from 'amala'
import {
  KETL_BWL_NFT_CONTRACT,
  YC_ALUM_NFT_CONTRACT,
} from '@big-whale-labs/constants'

export default class {
  @IsEthereumAddress()
  @IsIn([KETL_BWL_NFT_CONTRACT, YC_ALUM_NFT_CONTRACT])
  tokenAddress?: string
}
