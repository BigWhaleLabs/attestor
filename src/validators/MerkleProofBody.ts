import { IsArray, IsString } from 'amala'

export default class {
  @IsString()
  root!: string
  @IsString()
  leaf!: string
  @IsArray()
  pathIndices!: Array<number>
  @IsArray()
  siblings!: Array<Array<string>>
}
