import { ethers, providers } from 'ethers'

const zeroAddress = '0x0000000000000000000000000000000000000000'

export default function (
  provider: providers.Provider,
  ownerAddress: string,
  tokenAddress = zeroAddress,
  tokenId?: number
) {
  if (tokenAddress === zeroAddress) {
    return provider.getBalance(ownerAddress)
  } else if (tokenId) {
    const abi = [
      'function balanceOf(address account, uint256 id) view returns (uint256)',
    ]
    const contract = new ethers.Contract(tokenAddress, abi, provider)
    return contract.balanceOf(ownerAddress, tokenId)
  } else {
    const abi = ['function balanceOf(address owner) view returns (uint256)']
    const contract = new ethers.Contract(tokenAddress, abi, provider)
    return contract.balanceOf(ownerAddress)
  }
}
