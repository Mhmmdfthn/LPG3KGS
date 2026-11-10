export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: false },
  typescript: { strict: true },
  ignore: ['server/routes/index.get.ts'],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    appOrigin: 'http://localhost:3000',
    sessionHours: 12,
    // Aktif di mode dev secara default; di produksi dapat diaktifkan lewat NUXT_DEMO_LOGIN=true.
    demoLogin: process.env.NUXT_DEMO_LOGIN !== undefined
      ? process.env.NUXT_DEMO_LOGIN === 'true'
      : process.env.NODE_ENV !== 'production',
  },
  routeRules: { '/api/**': { headers: { 'Cache-Control': 'no-store' } } },
})
