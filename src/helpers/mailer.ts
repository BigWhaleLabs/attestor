import { FetchMessageObject, ImapFlow } from 'imapflow'
import { createTransport } from 'nodemailer'
import eddsaSigFromString from '@/helpers/eddsaSigFromString'
import env from '@/helpers/env'

const user = env.SMTP_USER
const pass = env.SMTP_PASS

const client = new ImapFlow({
  host: 'box.mail.sealcred.xyz',
  port: 993,
  secure: true,
  auth: {
    user,
    pass,
  },
  logger: false,
})

const transporter = createTransport({
  host: 'box.mail.sealcred.xyz',
  port: 465,
  secure: true,
  auth: {
    user,
    pass,
  },
})

let checking = false
async function check() {
  if (checking) {
    return
  }
  checking = true
  try {
    console.log('Checking for new messages...')
    const lock = await client.getMailboxLock('INBOX')
    try {
      const result = client.fetch('1:*', {
        envelope: true,
        source: false,
        bodyStructure: true,
        uid: true,
      })
      const messages = [] as FetchMessageObject[]
      for await (const message of result) {
        const address = message.envelope.from[0].address
        if (!address) {
          return
        }
        const signatureHexString = eddsaSigFromString(address)
        console.log(`Replying to ${address}, ${signatureHexString}`)
        await transporter.sendMail({
          from: `"SealCred" <${user}>`,
          to: address,
          subject: "Here's your token!",
          text: `Your token is: ${signatureHexString}`,
        })
        messages.push(message)
      }
      await Promise.all(
        messages.map((message) =>
          client.messageDelete(`${message.uid}`, { uid: true })
        )
      )
    } finally {
      lock.release()
    }
  } finally {
    checking = false
  }
}

export default async function setupMailer() {
  await client.connect()
  await check()
  setInterval(check, 1000 * 5)
}
