import 'module-alias/register'
import 'source-map-support/register'

import * as os from 'os'
import Cluster from '@/helpers/cluster'
import runApp from '@/helpers/runApp'

const totalCPUs = os.cpus().length

if (Cluster.isPrimary) {
  console.log(`Number of CPUs is ${totalCPUs}`)
  console.log(`Primary ${process.pid} is running`)

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    Cluster.fork()
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
