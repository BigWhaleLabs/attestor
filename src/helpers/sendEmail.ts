import { createTransport } from 'nodemailer'
import env from '@/helpers/env'
import htmlBody from '@big-whale-labs/sc-email'

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

export default function (to: string, subject: string, token: string) {
  return emailer.sendMail({
    from: `"SealCred" <${user}>`,
    to,
    subject,
    html: htmlBody.replace('${{token}}', token),
  })
}
