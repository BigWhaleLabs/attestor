import { NotEmptyStorageValue, buildStorage } from 'axios-cache-interceptor'
import { getItem, removeItem, setItem } from 'node-persist'

export default function buildPersistedStorage() {
  return buildStorage({
    find(key: string) {
      return getItem(key)
    },
    async remove(key: string) {
      await removeItem(key)
    },
    async set(key: string, value: NotEmptyStorageValue) {
      await setItem(key, value)
    },
  })
}
