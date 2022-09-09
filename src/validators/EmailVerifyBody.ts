import { IsEmail } from 'amala'

export default class {
  @IsEmail({}, { each: true })
  emails!: string[]
}
