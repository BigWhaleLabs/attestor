import { createTransport } from 'nodemailer'
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

export default function (to: string, subject: string, text: string) {
  return emailer.sendMail({
    from: `"SealCred" <${user}>`,
    to,
    subject,
    text,
  })
}
