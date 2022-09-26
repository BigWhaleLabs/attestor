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

export async function fetchConnectedAddresses(addresses: string[]) {
  checkIfPrimary()
  for (let i = 0; i < addresses.length; i += 10) {
    console.log(
      `Fetching connected addresses ${i} to ${i + 10} / ${addresses.length}`
    )
    await Promise.all(
      addresses
        .slice(i, i + 10)
        .map((address) => fetchConnectedAddress(address))
    )
  }
}

export function isAddressConnected(address: string) {
  checkIfPrimary()
  const allConnectedAddresses = Object.values(faddressToConnectedAddresses)
    .reduce((acc, val) => acc.concat(val), [] as string[])
    .map((s) => s.toLowerCase())
  return allConnectedAddresses.includes(address.toLowerCase())
}
