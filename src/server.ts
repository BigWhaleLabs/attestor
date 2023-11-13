import 'module-alias/register'
import 'source-map-support/register'

import * as os from 'os'
import { init as initStorage } from 'node-persist'
import { isAddressConnected } from '@/helpers/farcaster/connectedAddresses'
import Cluster from '@/helpers/cluster/cluster'
import axiosWithCache from '@/helpers/axiosWithCache'
import buildPersistedStorage from '@/helpers/buildPersistedStorage'
import prepareFarcaster from '@/helpers/farcaster/prepareFarcaster'
import runApp from '@/helpers/runApp'

const totalCPUs = os.cpus().length

void (async () => {
  await initStorage()
  axiosWithCache.storage = buildPersistedStorage()

  if (!Cluster.isPrimary) {
    console.log(`Number of CPUs is ${totalCPUs}`)
    console.log(`Primary ${process.pid} is running`)

    console.log('Preparing Farcaster...')
    void prepareFarcaster()

    // Fork workers.
    for (let i = 0; i < totalCPUs; i++) {
      const worker = Cluster.fork()
      worker.on('message', (message: string) => {
        const { address, promiseId } = JSON.parse(message)
        try {
          const isConnected = isAddressConnected(address)
          worker.send(JSON.stringify({ isConnected, promiseId }))
        } catch (error) {
          worker.send(JSON.stringify({ error, promiseId }))
        }
      })
    }

    Cluster.on('exit', (worker) => {
      console.log(`worker ${worker.process.pid} died`)
      console.log("Let's fork another worker!")
      Cluster.fork()
    })
  } else {
    void runApp()
    console.log(`Worker ${process.pid} started`)
  }
})()
