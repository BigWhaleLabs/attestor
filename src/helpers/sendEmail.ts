import { createTransport } from 'nodemailer'
import { generateTokenHtml as scEmail } from '@big-whale-labs/seal-cred-email'
import env from '@/helpers/env'
import ketlEmail from '@big-whale-labs/ketl-email'

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
  forKetl,
  secret,
  subject,
  to,
}: {
  to: string
  subject: string
  secret: string
  domain: string
  forKetl?: boolean
}) {
  try {
    const { html } = forKetl
      ? ketlEmail({ domain, secret })
      : scEmail({ domain, secret })

    const from = forKetl ? 'Ketl' : 'SealCred'

    await emailer.sendMail({
      from: `"${from}" <${user}>`,
      html,
      subject,
      to,
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
