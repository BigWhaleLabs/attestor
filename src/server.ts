import 'module-alias/register'
import 'source-map-support/register'

import runApp from '@/helpers/runApp'

void (async () => {
  console.log('Starting app...')
  await runApp()
  console.log('Server launch sequence completed 🚀')
})()
