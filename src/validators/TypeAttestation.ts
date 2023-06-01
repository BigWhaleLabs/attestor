import { IsEnum } from 'amala'
import Attestation from '@/models/Attestation'

export default class {
  @IsEnum(Attestation)
  type!: Attestation
}
