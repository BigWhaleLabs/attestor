import getHashes from '@/helpers/ketl/getHashes'

export default async function checkInvite(type: number, hash: string) {
  const hashes = await getHashes(type)

  return hashes.has(hash)
}
