import * as ed from '@noble/ed25519'
import { FetchMessageObject, ImapFlow, MailboxLockObject } from 'imapflow'
import { createTransport } from 'nodemailer'
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
  await client.connect()
  let lock: MailboxLockObject | undefined
  try {
    console.log('Checking for new messages...')
    lock = await client.getMailboxLock('INBOX')
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
      const hexMessage = Buffer.from(address, 'utf8').toString('hex')
      const signature = await ed.sign(hexMessage, env.EDDSA_PRIVATE_KEY)
      const signatureHexString = Buffer.from(signature).toString('hex')
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
      messages.map((message) => client.messageDelete(`${message.uid}`))
    )
  } finally {
    lock?.release()
    await client.logout()
    checking = false
  }
}

export default async function setupMailer() {
  await check()
  setInterval(check, 1000 * 5)
}
