import { BigNumber } from 'ethers'
import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree'
import Mimc7 from '@/helpers/Mimc7'

export default async function (items: BigNumber[]) {
  const mimc7 = await new Mimc7().prepare()
  const tree = new IncrementalMerkleTree(mimc7.hash.bind(mimc7), 20, BigInt(0))
  for (const item of items) {
    tree.insert(item.toBigInt())
  }
  return tree
}
