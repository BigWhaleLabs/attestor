import { IsEnum, IsString } from 'amala'
import AttestationType from '@/models/AttestationType'

export default class {
  @IsString()
  hash!: string

  @IsEnum(AttestationType, { each: true })
  types!: AttestationType[]
}
