import LinkedInProfile from '@/models/LinkedInProfile'
import axios from 'axios'

export default async function fetchUserinfo(token: string) {
  const { data } = await axios.get<LinkedInProfile>(
    `https://api.linkedin.com/v2/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return data
}
