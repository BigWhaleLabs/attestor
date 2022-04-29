import 'module-alias/register'
import 'source-map-support/register'

import cleanJobs from '@/helpers/cleanJobs'
import runMongo from '@/helpers/mongo'
import startJobChecker from '@/helpers/jobs'

void (async () => {
  console.log('Starting mongo...')
  await runMongo()
  console.log('Cleaning jobs...')
  await cleanJobs()
  console.log('Start checking jobs...')
  startJobChecker()
  console.log('Launch sequence completed 🚀')
})()
