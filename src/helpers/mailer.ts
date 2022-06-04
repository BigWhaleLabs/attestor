import * as ed from '@noble/ed25519'
import { ImapFlow, MailboxLockObject } from 'imapflow'
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
  let lock: MailboxLockObject | undefined
  try {
    console.log('Checking for new messages...')
    lock = await client.getMailboxLock('INBOX')
    const result = client.fetch(
      { seen: false },
      {
        envelope: true,
        source: false,
        bodyStructure: true,
        uid: true,
      }
    )
    for await (const msg of result) {
      const address = msg.envelope.from[0].address
      if (!address) {
        return
      }
      const key = ed.utils.randomPrivateKey()
      console.log(key)
      const hexMessage = Buffer.from(address, 'utf8').toString('hex')
      const signature = await ed.sign(hexMessage, key)
      const signatureHexString = Buffer.from(signature).toString('hex')
      console.log(`Replying to ${address}, ${signatureHexString}`)
      await transporter.sendMail({
        from: `"SealCred" <${user}>`,
        to: address,
        subject: "Here's your token!",
        text: `Your token is: ${signatureHexString}`,
      })
      await client.messageFlagsAdd(`${msg.uid}`, ['\\Seen'])
    }
  } finally {
    lock?.release()
    checking = false
  }
}

export default async function setupMailer() {
  await client.connect()
  await check()
  setInterval(check, 1000 * 5)
}
