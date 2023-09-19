import { setupCache } from 'axios-cache-interceptor'
import axios from 'axios'
import buildPersistedStorage from '@/helpers/buildPersistedStorage'

export default setupCache(axios, {
  storage: buildPersistedStorage(),
})
