import axios from 'axios'
import env from '@/helpers/env'

export default async function checkInvite(
  attestationType: number,
  hash: string
) {
  const { data } = await axios.get<boolean>(
    `${env.KETL_INVITES_BACKEND}/merkle/hash?attestationType=${attestationType}&hash=${hash}`
  )

  return data
}
