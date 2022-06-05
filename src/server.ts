import 'module-alias/register'
import 'source-map-support/register'

import runApp from '@/helpers/runApp'
import setupMailer from '@/helpers/mailer'

void (async () => {
  console.log('Starting app...')
  await runApp()
  console.log('Setting up mailer...')
  await setupMailer()
  console.log('Server launch sequence completed 🚀')
})()
