import env from '@/helpers/env'

export default function verifyAuthToken(authToken?: string) {
  if (!authToken) return false
  try {
    return env.SECRET === authToken
  } catch (e) {
    console.log(e)
    return false
  }
}
