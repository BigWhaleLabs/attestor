import * as mg from 'nodemailer-mailgun-transport'
import { createTransport } from 'nodemailer'
import { inviteCode } from '@big-whale-labs/ketl-email'
import { generateTokenHtml as scEmail } from '@big-whale-labs/seal-cred-email'
import env from '@/helpers/env'
import getEmailDomain from '@/helpers/getEmailDomain'

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

const emailerMailgun = createTransport(
  mg({
    auth: {
      api_key: env.MAILGUN_API_KEY,
      domain: env.MAILGUN_DOMAIN,
    },
  })
)

export default async function ({
  forKetl,
  secret,
  subject,
  to,
}: {
  to: string
  subject: string
  secret: string
  forKetl?: boolean
}) {
  try {
    const { html } = forKetl
      ? inviteCode({
          inviteCode: secret,
          value: to,
        })
      : scEmail({ domain: getEmailDomain(to), secret })

    const from = forKetl ? 'Ketl' : 'SealCred'
    const fromEmail = forKetl
      ? 'ketl@mail.useketl.com'
      : 'verify@mail.sealcred.xyz'
    const replyTo = forKetl ? 'hi@ketl.xyz' : 'hi@sealcred.xyz'
    console.log(`Sending email to ${to}`)

    const info = {
      from: `"${from}" <${fromEmail}>`,
      html,
      replyTo,
      subject,
      to,
    }

    forKetl ? await emailerMailgun.sendMail(info) : await emailer.sendMail(info)

    console.log(`Email sent to ${to}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
  }
}
