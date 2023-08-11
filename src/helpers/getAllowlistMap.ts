import * as fs from 'fs'
import { resolve } from 'path'
import AttestationType from '@/models/AttestationType'

function getAllowlist(attestationType: AttestationType) {
  try {
    const filePath = resolve(
      process.cwd(),
      'merkleTrees',
      `${attestationType}.txt`
    )
    const file = fs.readFileSync(filePath, 'utf8')
    const allowlist = file.split('\n')
    const filteredAllowlist = allowlist.filter(
      (record: string) => !/^#/.test(record) && record !== ''
    )
    return filteredAllowlist
  } catch (e) {
    return []
  }
}

export default function getAllowlistMap(): Map<AttestationType, Set<string>> {
  const allowlistMap = new Map()
  for (const type in AttestationType) {
    const attestationType = Number(type)
    if (isNaN(attestationType)) continue
    allowlistMap.set(attestationType, new Set(getAllowlist(attestationType)))
  }
  return allowlistMap
}
