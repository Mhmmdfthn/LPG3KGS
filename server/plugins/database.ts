import { closeDatabase } from '../lib/db'

export default defineNitroPlugin(app => {
  app.hooks.hook('close',closeDatabase)
})
