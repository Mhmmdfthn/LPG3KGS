import { createBackend } from '../lib/api'
import { useDatabase } from '../lib/db'

export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const sessionHours = Number(config.sessionHours)
  if (!Number.isFinite(sessionHours) || sessionHours <= 0 || sessionHours > 168) throw new Error('NUXT_SESSION_HOURS harus antara 0 dan 168.')
  return createBackend(useDatabase(),{
    appOrigin:config.appOrigin,
    sessionHours,
    secureCookies:process.env.NODE_ENV === 'production',
  })(event)
})
