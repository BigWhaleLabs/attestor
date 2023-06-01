import { IsEnum, IsString } from 'amala'
import Attestation from '@/models/Attestation'

export default class {
  @IsString()
  token!: string

  @IsEnum([Attestation.VC, Attestation.Founder, Attestation.KetlTeam])
  type!: Attestation
}
