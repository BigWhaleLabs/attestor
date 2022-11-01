import { ethers, providers } from 'ethers'

const zeroAddress = '0x0000000000000000000000000000000000000000'

export default function (
  tokenAddress: string,
  ownerAddress: string,
  provider: providers.Provider
) {
  if (tokenAddress === zeroAddress) {
    return provider.getBalance(ownerAddress)
  } else {
    const abi = ['function balanceOf(address owner) view returns (uint256)']
    const contract = new ethers.Contract(tokenAddress, abi, provider)
    return contract.balanceOf(ownerAddress)
  }
}
