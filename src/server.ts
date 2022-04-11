import 'module-alias/register'
import 'source-map-support/register'

import cleanJobs from '@/helpers/cleanJobs'
import runApp from '@/helpers/runApp'
import runMongo from '@/helpers/mongo'
import startJobChecker from '@/helpers/jobs'

void (async () => {
  console.log('Starting mongo...')
  await runMongo()
  console.log('Starting app...')
  await runApp()
  console.log('Cleaning jobs...')
  await cleanJobs()
  console.log('Starting job checker...')
  startJobChecker()
  console.log('Launch sequence completed!')
})()
