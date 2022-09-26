import axios from 'axios'
import checkIfPrimary from '@/helpers/cluster/checkIfPrimary'

const baseUrl = 'https://api.farcaster.xyz/v1'

export const faddressToConnectedAddresses = {} as {
  [faddress: string]: string[]
}

export async function fetchConnectedAddress(address: string) {
  checkIfPrimary()
  const {
    data: {
      result: { verifiedAddresses },
    },
  } = await axios.get<{
    result: {
      verifiedAddresses: {
        signerAddress: string
      }[]
    }
  }>(`${baseUrl}/verified_addresses/${address}`)
  const connectedAddresses = verifiedAddresses.map(
    ({ signerAddress }) => signerAddress
  )
  faddressToConnectedAddresses[address] = connectedAddresses
}

const step = 5
export async function fetchConnectedAddresses(addresses: string[]) {
  checkIfPrimary()
  for (let i = 0; i < addresses.length; i += step) {
    console.log(
      `Fetching connected addresses ${i} to ${i + step} / ${addresses.length}`
    )
    try {
      await Promise.all(
        addresses
          .slice(i, i + step)
          .map((address) => fetchConnectedAddress(address))
      )
    } catch (error) {
      console.error(
        'Error fetching connected addresses',
        error instanceof Error ? error.message : error
      )
      i -= step
    }
  }
}

export function isAddressConnected(address: string) {
  checkIfPrimary()
  const allConnectedAddresses = Object.values(faddressToConnectedAddresses)
    .reduce((acc, val) => acc.concat(val), [] as string[])
    .map((s) => s.toLowerCase())
  return allConnectedAddresses.includes(address.toLowerCase())
}
