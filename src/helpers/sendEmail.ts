import { createTransport } from 'nodemailer'
import { generateTokenHtml } from '@big-whale-labs/seal-cred-email'
import env from '@/helpers/env'

const user = env.SMTP_USER
const pass = env.SMTP_PASS

const emailer = createTransport({
  auth: {
    pass,
    user,
  },
  host: 'box.mail.sealcred.xyz',
  port: 465,
  secure: true,
})

export default async function ({
  domain,
  secret,
  subject,
  to,
}: {
  to: string
  subject: string
  secret: string
  domain: string
}) {
  try {
    const { html } = generateTokenHtml({ domain, secret })
    await emailer.sendMail({
      from: `"SealCred" <${user}>`,
      html,
      subject,
      to,
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
