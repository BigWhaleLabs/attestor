import Network from '@/models/Network'

export default function <T>(
  attestationSource: Network,
  goerliOption: T,
  mainnetOption: T
) {
  switch (attestationSource) {
    case Network.Goerli:
      return goerliOption
    case Network.Mainnet:
      return mainnetOption
  }
}
