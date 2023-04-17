import { v4 as uuidv4 } from 'uuid'
import checkIfWorker from '@/helpers/cluster/checkIfWorker'

const isConnectedPromises = {} as {
  [id: string]: {
    res: (result: boolean) => void
    rej: (error: unknown) => void
  }
}

process.on('message', (message: string) => {
  const { error, isConnected, promiseId } = JSON.parse(message)
  if (error) {
    isConnectedPromises[promiseId]?.rej(error)
  } else {
    isConnectedPromises[promiseId]?.res(isConnected)
  }
  delete isConnectedPromises[promiseId]
})

export default function (address: string) {
  checkIfWorker()
  const promiseId = uuidv4()
  return new Promise<boolean>((res, rej) => {
    if (!process.send) {
      throw new Error('process.send is undefined')
    }
    isConnectedPromises[promiseId] = { rej, res }
    process.send(
      JSON.stringify({
        address,
        promiseId,
      })
    )
  })
}
