import * as fs from 'fs'
import * as snarkjs from 'snarkjs'
import { DocumentType } from '@typegoose/typegoose'
import { Job, JobModel } from '@/models/Job'
import { cwd } from 'process'
import { resolve } from 'path'
import JobStatus from '@/models/JobStatus'

const vKey = JSON.parse(
  fs.readFileSync('./pot/verification_key.json').toString()
)

export default function startJobChecker() {
  setInterval(checkAndRunJobs, 5 * 1000)
}

async function checkAndRunJobs() {
  console.log('Checking for jobs...')
  // Check if there is a running job
  const runningJob = await JobModel.findOne({
    status: JobStatus.running,
  })
  if (runningJob) {
    console.log(`Found running job ${runningJob.id}`)
    return
  }
  // Check if there is a scheduled job
  const scheduledJob = await JobModel.findOne(
    {
      status: JobStatus.scheduled,
    },
    {},
    { sort: { createdAt: 1 } }
  )
  if (!scheduledJob) {
    console.log('No scheduled jobs found')
    return
  }
  // Run scheduled job
  try {
    await scheduledJob.update({
      status: JobStatus.running,
    })
    const proof = await runJob(scheduledJob)
    await scheduledJob.update({
      status: JobStatus.completed,
      proof,
      $unset: { input: true },
    })
  } catch (error) {
    console.log('Error running job:', error)
    await scheduledJob.update({
      status: JobStatus.failed,
    })
  } finally {
    // Erase job input
    await scheduledJob.update({
      $unset: { input: true },
    })
  }
}

async function runJob(job: DocumentType<Job>) {
  console.log(`Running job ${job.id}...`)
  console.log('Generating witness and creating proof...')
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    job.input,
    resolve(cwd(), 'build/OwnershipChecker_js/OwnershipChecker.wasm'),
    resolve(cwd(), 'pot/OwnershipChecker_final.zkey')
  )
  console.log('Verifying proof...')
  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof)
  if (!res) {
    throw new Error('Proof verification failed')
  }
  console.log(`Proof verified for job ${job.id}`)
  return proof
}
