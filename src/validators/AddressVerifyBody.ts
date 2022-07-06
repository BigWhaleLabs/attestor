import { IsString } from 'amala'

export default class {
  @IsString()
  signature!: string
  @IsString()
  message!: string
}
