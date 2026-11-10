const demoPassword = process.env.SEED_DEMO_PASSWORD || 'password-uji-123'

const defaultDemoAccounts = [
  { label: 'Admin', role: 'admin', username: 'demo_admin', password: demoPassword },
  { label: 'Karyawan', role: 'karyawan', username: 'siti_karyawan', password: demoPassword },
  { label: 'Pengecer', role: 'pengecer', username: 'warung_sumber', password: demoPassword },
]

function parseDemoAccounts() {
  const raw = process.env.NUXT_PUBLIC_DEMO_ACCOUNTS
  if (!raw) return defaultDemoAccounts
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : defaultDemoAccounts
  } catch {
    return defaultDemoAccounts
  }
}

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
    public: {
      // Aktif di mode dev; di produksi harus dinyalakan eksplisit untuk UAT/demo.
      demoMode: process.env.NUXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production',
      demoAccounts: parseDemoAccounts(),
    },
  },
  routeRules: { '/api/**': { headers: { 'Cache-Control': 'no-store' } } },
})
