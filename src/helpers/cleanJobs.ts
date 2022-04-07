import { JobModel } from '@/models/Job'
import JobStatus from '@/models/JobStatus'

export default async function cleanJobs() {
  const jobs = await JobModel.find({
    status: { $in: [JobStatus.scheduled, JobStatus.running] },
  })
  console.log(`Found ${jobs.length} jobs, cancelling them...`)
  for (const job of jobs) {
    await job.update({ status: JobStatus.cancelled, $unset: { input: true } })
  }
  console.log('Cancled all jobs')
}
