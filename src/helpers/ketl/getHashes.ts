import axiosWithCache from '@/helpers/axiosWithCache'
import env from '@/helpers/env'

export default async function getHashes(attestationType: number) {
  const { data } = await axiosWithCache.get<string[]>(
    `${env.KETL_HASHES_SOURCE}/hashes/${attestationType}.json`,
    {
      cache: {
        ttl: 1000 * 60 * 5, // 5 minute.
      },
      id: `hashes-${attestationType}`,
    }
  )

  return new Set(data)
}
