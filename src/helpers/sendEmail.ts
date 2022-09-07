import { createTransport } from 'nodemailer'
import { generateTokenHtml } from '@big-whale-labs/seal-cred-email'
import env from '@/helpers/env'

const user = env.SMTP_USER
const pass = env.SMTP_PASS

const emailer = createTransport({
  host: 'box.mail.sealcred.xyz',
  port: 465,
  secure: true,
  auth: {
    user,
    pass,
  },
})

export default async function ({
  to,
  subject,
  secret,
  domain,
}: {
  to: string
  subject: string
  secret: string
  domain: string
}) {
  try {
    const { html } = generateTokenHtml({ secret, domain })
    await emailer.sendMail({
      from: `"SealCred" <${user}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
