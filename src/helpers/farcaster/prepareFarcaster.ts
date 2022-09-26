import { Contract } from 'ethers'
import {
  fetchConnectedAddress,
  fetchConnectedAddresses,
} from '@/helpers/farcaster/connectedAddresses'
import { goerliProvider } from '@/helpers/providers'
import checkIfPrimary from '@/helpers/cluster/checkIfPrimary'
import farcasterRegistryABI from '@/helpers/farcaster/farcasterRegistryABI'

const idsToAddresses = {} as { [id: string]: string }

const idRegistryAddress = '0xda107a1caf36d198b12c16c7b6a1d1c795978c42'
const startBlock = 7611350

const idRegistry = new Contract(
  idRegistryAddress,
  farcasterRegistryABI,
  goerliProvider
)

let registered = false
function eventHandler(to: string, id: string) {
  idsToAddresses[id] = to
  return fetchConnectedAddress(to)
}
function registerToEvents() {
  if (registered) return
  idRegistry.on(idRegistry.filters.Register(), (_, to, id) =>
    eventHandler(to, id)
  )
  idRegistry.on(idRegistry.filters.Transfer(), (_, to, id) =>
    eventHandler(to, id)
  )
  registered = true
}

async function fillIdsToAddresses() {
  // Fetch events
  const logs = await goerliProvider.getLogs({
    address: idRegistryAddress,
    fromBlock: startBlock,
    toBlock: 'latest',
    topics: [
      [
        '0x3cd6a0ffcc37406d9958e09bba79ff19d8237819eb2e1911f9edbce656499c87', // Register
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer
      ],
    ],
  })
  // Sort events
  const sortedLogs = logs.sort((a, b) =>
    a.blockNumber > b.blockNumber ? 1 : -1
  )
  // Fill events
  for (const logRecord of sortedLogs) {
    const logDesc = idRegistry.interface.parseLog(logRecord)
    const id = logDesc.args.id
    const to = logDesc.args.to
    idsToAddresses[id] = to
  }
  // Add listeners
  registerToEvents()
}

export default async function () {
  checkIfPrimary()
  if (!Object.keys(idsToAddresses).length) {
    console.log('Fetching fids to addresses...')
    await fillIdsToAddresses()
    console.log('Fetched fids to addresses!')
    console.log('Fetching connected addresses...')
    await fetchConnectedAddresses(Object.values(idsToAddresses))
    console.log('Fetched connected addresses!')
  }
}
