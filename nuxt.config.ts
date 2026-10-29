export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: false },
  typescript: { strict: true },
  runtimeConfig: {
    appOrigin: 'http://localhost:3000',
    sessionHours: 12,
  },
  nitro: { preset: 'node-server' },
  routeRules: { '/api/**': { headers: { 'Cache-Control': 'no-store' } } },
})
