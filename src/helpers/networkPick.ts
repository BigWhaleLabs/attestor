import Network from '@/models/Network'

export default function <T>(
  attestationSource: Network,
  goerliOption: T,
  mainnetOption: T
) {
  switch (attestationSource) {
    case Network.goerli:
      return goerliOption
    case Network.mainnet:
      return mainnetOption
  }
}
