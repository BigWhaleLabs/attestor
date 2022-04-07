import { IsArray, IsString } from 'amala'

export default class InputBody {
  @IsString()
  root!: string

  @IsString()
  leaf!: string

  @IsArray()
  pathIndices!: Array<number>

  @IsArray()
  siblings!: Array<Array<string>>

  @IsArray()
  r!: Array<string>

  @IsArray()
  s!: Array<string>

  @IsArray()
  msghash!: Array<string>

  @IsArray()
  pubkey!: Array<Array<string>>
}
