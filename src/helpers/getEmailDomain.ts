export default function getEmailDomain(email: string) {
  return email.split('@')[1].toLowerCase()
}
