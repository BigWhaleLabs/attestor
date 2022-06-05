import { IsArray } from 'amala'

export default class {
  @IsArray()
  r!: Uint8Array
  @IsArray()
  s!: Uint8Array
  @IsArray()
  msghash!: Uint8Array
  @IsArray()
  pubkey!: Uint8Array
}
