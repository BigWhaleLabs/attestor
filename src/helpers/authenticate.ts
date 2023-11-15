import { Context, Next } from 'koa'
import { forbidden } from '@hapi/boom'
import verifyAuthToken from '@/helpers/verifyAuthToken'

export default async function authenticate(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  const isValidToken = await verifyAuthToken(token)

  if (!isValidToken) throw forbidden()

  return next()
}
