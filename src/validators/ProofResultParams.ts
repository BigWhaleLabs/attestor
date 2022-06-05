import { IsMongoId } from 'amala'

export default class {
  @IsMongoId()
  id!: string
}
