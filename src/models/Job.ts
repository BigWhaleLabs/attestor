import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import InputBody from '@/validators/InputBody'
import JobStatus from '@/models/JobStatus'
import ProofResponse from '@/models/ProofResponse'

@modelOptions({
  schemaOptions: { timestamps: true, expireAfterSeconds: 24 * 60 * 60 * 1000 },
})
export class Job {
  @prop({
    required: true,
    index: true,
    enum: JobStatus,
    default: JobStatus.scheduled,
  })
  status!: JobStatus
  @prop()
  input?: InputBody
  @prop()
  result?: ProofResponse

  // Mongo fields
  createdAt?: Date
}

export const JobModel = getModelForClass(Job)
