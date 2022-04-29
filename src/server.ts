import 'module-alias/register'
import 'source-map-support/register'

import cleanJobs from '@/helpers/cleanJobs'
import cluster from 'cluster'
import runApp from '@/helpers/runApp'
import runMongo from '@/helpers/mongo'
import startJobChecker from '@/helpers/jobs'

void (async () => {
  console.log('Starting mongo...')
  await runMongo()
  console.log('Cleaning jobs...')
  await cleanJobs()
  console.log('Starting app...')
  await runApp()
  console.log('Launch sequence completed 🚀')
})()

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)
  cluster.fork()

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`)
  })
} else {
  console.log(`Worker ${process.pid} started, starting the job checker...`)
  startJobChecker()
  console.log('Started job checker')
}
