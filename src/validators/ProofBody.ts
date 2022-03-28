import { IsString } from 'amala'

export default class ProofBody {
  @IsString()
  leaf!: string
}
