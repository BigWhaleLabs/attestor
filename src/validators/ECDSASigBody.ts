import { IsArray } from 'amala'

export default class {
  @IsArray()
  r!: Array<string>
  @IsArray()
  s!: Array<string>
  @IsArray()
  msghash!: Array<string>
  @IsArray()
  pubkey!: Array<Array<string>>
}
