import { IsEnum } from 'amala'
import AttestationType from '@/models/AttestationType'

export default class {
  @IsEnum(AttestationType, { each: true })
  types!: AttestationType[]
}
