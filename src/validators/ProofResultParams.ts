import { IsMongoId } from 'amala'

export default class ProofResultParams {
  @IsMongoId()
  id!: string
}
