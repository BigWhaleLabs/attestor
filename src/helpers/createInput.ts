import 'module-alias/register'
import 'source-map-support/register'

import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree'
import { poseidon } from 'circomlibjs'

import { MsgInput } from '@/types/msgInput'
import { sign, Point } from '@noble/secp256k1'
import * as keccak256 from 'keccak256'

const addresses = [
  '0x525A7a36009AAfCB2dE1dd239a257aae84ED585B',
  '0x76fD3DA586b07253C913D0637e5f59BCB7602C07',
  '0x147bA179784B21BdEAF7d4a902fEC833EFdcB64F',
  '0x22A7aF03aD63E75AC3fE8e595F25C693373FD206',
  '0xBc625368eD41f8FBacbDF2e45b2E453a1c1F5ae5',
  '0x0f98464907DeD982C8bCfCee0B9257086400135e',
  '0x3aCF081962805cA8A4928066bB528aC4C7030e0f',
  '0xb644358c6b1E06f1F0301Fb0e0f6d2bA7197C842',
  '0x4D6c0E282b45DA9FD8A44Be5CcAb0F5C9E77C3A9',
  '0x7877dF1504a7909f98c74cc30a87526F86df47cB',
  '0x6B29380bb9955D5b2dF1624c5C6a72a5E69a6b80',
  '0x9e0AA09345982eA56C63Cd0b7842B401A23e258d',
  '0x097B5fFE023B868e163e829569c079447387D101',
  '0x8aF0B9A9B751E086122bC340188Bd9d99b8C7ec1',
  '0x298A8fF8128D8427781B44F7e64657548768E3D4',
  '0x3fEE67802D44d42Bd99aeC30254624494f2149C2',
  '0x3D4b20f4F80cF2BE6ec66967C9d735485BDC1759',
  '0xaBE862679dca846495cf1cA7b1b72C326823ecf2',
  '0xe01b34baf14308145A54893e3faa8d755eC254c2',
  '0xeB76C90aa794B131864f544A5457B7001b06D239',
  '0x1966961856734688e6675679F028744C6e97cC81',
  '0x76D7D04a0d48211876A0Cf53c37969dd2c64ed29',
  '0x3aDf0B2A65270c4943E9fa0507e2cb2cF5b5C2A8',
  '0x52DD6E834f863576979eB170720cB748c63EA086',
  '0x09e7aB45f20AAf705E0B349c3E2b6cF852D8F64e',
  '0xdf9D49CA0e0366bDECdB380a7df9B3ef3664F1DC',
  '0x1Ef1148fee8FEF36288fEaa3d1b173daBB3e8967',
  '0x8b4EF241f31B7dA8C248400ea00eED51ae2e8919',
  '0x20643627A2d02F520A006dF56Acc51E3e67E3Ee5',
  '0xFD507230712578a1960b3DC2a5B3c0E45e7CF0Fd',
  '0xA47b31690eCA4baDB02CA78B2f90A04AB1F7E9F6',
]

const createMerkleProof = (leaf: string) => {
  const tree = new IncrementalMerkleTree(poseidon, 20, BigInt(0), 2)
  for (const address of addresses) {
    tree.insert(BigInt(address))
  }
  const indexToProve = addresses.findIndex((element) => element === leaf)
  const siblingIndex =
    indexToProve % 2 === 0 ? indexToProve + 1 : indexToProve - 1
  const proof = tree.createProof(indexToProve)
  proof.leaf = addresses[indexToProve]
  proof.siblings = proof.siblings.map((s) => [s.toString()])
  proof.siblings[0] = [addresses[siblingIndex]]
  proof.root = proof.root.toString()
  return proof
}

// bigendian
const bigint_to_Uint8Array = (x: bigint) => {
  let ret = new Uint8Array(32)
  for (let idx = 31; idx >= 0; idx--) {
    ret[idx] = Number(x % BigInt(256))
    x = x / BigInt(256)
  }
  return ret
}

const createMsgInput = async (leaf: string): Promise<MsgInput | undefined> => {
  try {
    // privkey, msghash, pub0, pub1
    const test_cases = []
    const proverPrivkey = BigInt(leaf)

    const bigint_to_tuple = (x: bigint) => {
      // 2 ** 86
      let mod = BigInt('77371252455336267181195264')
      let ret = [BigInt(0), BigInt(0), BigInt(0)]

      let x_temp = x
      for (let idx = 0; idx < 3; idx++) {
        ret[idx] = x_temp % mod
        x_temp = x_temp / mod
      }
      return ret
    }

    const bigint_to_array = (n: number, k: number, x: bigint) => {
      let mod = BigInt(1)
      for (let idx = 0; idx < n; idx++) {
        mod = mod * BigInt(2)
      }

      let ret = []
      let x_temp = x
      for (let idx = 0; idx < k; idx++) {
        ret.push(x_temp % mod)
        x_temp = x_temp / mod
      }
      return ret
    }

    // bigendian
    const Uint8Array_to_bigint = (x: Uint8Array) => {
      let ret = BigInt(0)
      for (let idx = 0; idx < x.length; idx++) {
        ret = ret * BigInt(256)
        ret = ret + BigInt(x[idx])
      }
      return ret
    }

    const proverPubkey = Point.fromPrivateKey(proverPrivkey)
    const msg = 'zk-airdrop'
    const msghash_bigint = Uint8Array_to_bigint(keccak256(msg)) // Needs to be basicaly some public random hardcoded value
    const msghash = bigint_to_Uint8Array(msghash_bigint)
    const sig = await sign(msghash, bigint_to_Uint8Array(proverPrivkey), {
      canonical: true,
      der: false,
    })
    const r = sig.slice(0, 32)
    const s = sig.slice(32, 64)
    let r_bigint = Uint8Array_to_bigint(r)
    let s_bigint = Uint8Array_to_bigint(s)
    let r_array = bigint_to_array(86, 3, r_bigint)
    let s_array = bigint_to_array(86, 3, s_bigint)
    let msghash_array = bigint_to_array(86, 3, msghash_bigint)
    test_cases.push([
      proverPrivkey,
      msghash_bigint,
      sig,
      proverPubkey.x,
      proverPubkey.y,
    ])

    return {
      r: r_array.map((x) => x.toString()),
      s: s_array.map((x) => x.toString()),
      msghash: msghash_array.map((x) => x.toString()),
      pubkey: [
        bigint_to_tuple(proverPubkey.x).map((x) => x.toString()),
        bigint_to_tuple(proverPubkey.y).map((x) => x.toString()),
      ],
    }
  } catch (error) {
    console.log(error)
  }
}

const createInput = async (leaf: string) => {
  const merkleProof = createMerkleProof(leaf)
  const msgInput = await createMsgInput(leaf).then()

  const input = {
    root: merkleProof.root,
    leaf: merkleProof.leaf,
    siblings: merkleProof.siblings,
    pathIndices: merkleProof.pathIndices,
    r: msgInput?.r,
    s: msgInput?.s,
    msghash: msgInput?.msghash,
    pubkey: msgInput?.pubkey,
  }

  console.log(input)

  return input
}

export default createInput
