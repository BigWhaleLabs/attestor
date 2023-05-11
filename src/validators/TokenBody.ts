import { IsEnum, IsString } from 'amala'

enum AttestationType {
  vc = 2,
  founder = 1,
}

export default class {
  @IsString()
  token!: string

  @IsEnum(AttestationType)
  type!: AttestationType
}
