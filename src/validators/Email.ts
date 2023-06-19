import { IsEmail } from 'amala'

export default class {
  @IsEmail()
  email!: string
}
