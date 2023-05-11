import TwitterProfile from '@/models/TwitterProfile'
import axios from 'axios'

export default async function fetchUserProfile(token: string) {
  const { data } = await axios.get<TwitterProfile>(
    'https://api.twitter.com/2/users/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return data.data
}
