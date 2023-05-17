import { IsEnum, IsString } from 'amala'
import Attestation from '@/models/Attestation'

enum AttestationType {
  VC = Attestation.VC,
  Founder = Attestation.Founder,
  KetlTeam = Attestation.KetlTeam,
}

export default class {
  @IsString()
  token!: string

  @IsEnum(AttestationType)
  type!: AttestationType
}
