import { createTransport } from 'nodemailer'
import { generateTokenHtml } from '@big-whale-labs/seal-cred-email-template'
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

export default function (to: string, subject: string, secret: string) {
  const { html } = generateTokenHtml({ secret })
  return emailer.sendMail({
    from: `"SealCred" <${user}>`,
    to,
    subject,
    html,
  })
}
