import axiosWithCache from 'helpers/axiosWithCache'
import env from '@/helpers/env'

export default async function checkInvite(
  attestationType: number,
  hash: string
) {
  const { data } = await axiosWithCache.get<boolean>(
    `${env.KETL_INVITES_BACKEND}/merkle/hash?attestationType=${attestationType}&hash=${hash}`,
    { cache: false }
  )

  return data
}
