<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { login } = useAuth()
const { showSuccess, showError } = useNotification()

const identity = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

interface DemoAccount {
  label: string
  role: 'admin' | 'karyawan' | 'pengecer'
  username: string
  password: string
}

const runtimeConfig = useRuntimeConfig()
const demoAccounts = computed<DemoAccount[]>(() => {
  // Nilai bisa berupa array (dari nuxt.config) atau string JSON saat di-override env runtime.
  const raw = runtimeConfig.public.demoAccounts as unknown
  const accounts = typeof raw === 'string' ? safeParse(raw) : raw
  if (!Array.isArray(accounts)) return []
  return accounts.filter((account): account is DemoAccount =>
    !!account && typeof account.username === 'string' && typeof account.password === 'string'
  )
})

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
// Tombol cepat hanya muncul saat mode demo aktif (default: hanya di lingkungan dev).
const showDemoAccounts = computed(() => Boolean(runtimeConfig.public.demoMode) && demoAccounts.value.length > 0)
const activeDemoRole = ref('')

async function quickLogin(account: DemoAccount) {
  if (isLoading.value) return
  activeDemoRole.value = account.role
  identity.value = account.username
  password.value = account.password
  try {
    await handleLogin()
  } finally {
    activeDemoRole.value = ''
  }
}

const errors = reactive({
  identity: '',
  password: ''
})
const serverError = ref('')

function validate(): boolean {
  errors.identity = ''
  errors.password = ''
  serverError.value = ''
  let valid = true

  if (!identity.value.trim()) {
    errors.identity = 'Username atau email wajib diisi.'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Kata sandi wajib diisi.'
    valid = false
  }

  return valid
}

async function handleLogin() {
  if (!validate()) return

  isLoading.value = true
  serverError.value = ''

  try {
    const loggedUser = await login(identity.value, password.value)
    showSuccess(`Selamat datang kembali, ${loggedUser.name}!`, 'Masuk Berhasil')

    if (loggedUser.role === 'admin') {
      navigateTo('/admin')
    } else if (loggedUser.role === 'karyawan') {
      navigateTo('/staff')
    } else {
      navigateTo('/retailer')
    }
  } catch (err: any) {
    serverError.value = err.message || 'Terjadi kesalahan saat masuk.'
    showError(serverError.value, 'Gagal Masuk')
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <div class="auth-wrapper container">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-badge">LPG3KGS</span>
        <h2 class="auth-title">Masuk ke Sistem Pangkalan</h2>
        <p class="auth-subtitle">Gunakan username atau email akun yang telah terdaftar</p>
      </div>

      <!-- Alert Error Banner jika kredensial/status ditolak -->
      <div v-if="serverError" class="auth-error-banner" role="alert">
        <span class="error-banner-icon">⚠️</span>
        <div class="error-banner-text">{{ serverError }}</div>
      </div>

      <form class="auth-form" @submit.prevent="handleLogin">
        <BaseInput
          v-model="identity"
          label="Username atau Email"
          placeholder="admin / nama_pengguna"
          :error-text="errors.identity"
          required
        />

        <div class="password-field-group">
          <BaseInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Kata Sandi"
            placeholder="Masukkan kata sandi..."
            :error-text="errors.password"
            required
          />
          <button
            type="button"
            class="toggle-pass-btn"
            :class="{ 'has-error': !!errors.password }"
            aria-label="Tampilkan atau sembunyikan kata sandi"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Sembunyikan' : 'Lihat' }}
          </button>
        </div>

        <div class="form-actions mt-4">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
          >
            Masuk Sekarang
          </BaseButton>
        </div>
      </form>

      <div v-if="showDemoAccounts" class="demo-login-box">
        <div class="demo-login-head">
          <span class="demo-login-tag">Akun demo</span>
          <span class="demo-login-hint">Sekali klik langsung masuk</span>
        </div>
        <div class="demo-login-grid">
          <BaseButton
            v-for="account in demoAccounts"
            :key="account.role"
            type="button"
            variant="secondary"
            size="sm"
            :loading="isLoading && activeDemoRole === account.role"
            :disabled="isLoading"
            @click="quickLogin(account)"
          >
            {{ account.label || account.role }}
          </BaseButton>
        </div>
        <p class="demo-login-note">
          Khusus demo/UAT. Akun dibuat lewat <code>npm run db:seed</code> dengan
          <code>SEED_DEMO_ACCOUNTS=true</code>.
        </p>
      </div>

      <div class="auth-footer">
        <span>Belum memiliki akun pengecer?</span>
        <NuxtLink to="/register" class="auth-link">Daftar sebagai Pengecer</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  min-height: calc(100vh - var(--header-height) - 80px);
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.auth-badge {
  display: inline-block;
  background-color: var(--color-primary-900);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  margin-bottom: var(--space-2);
}

.auth-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin-bottom: var(--space-1);
}

.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.auth-error-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  line-height: var(--line-height-normal);
}

.error-banner-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.password-field-group {
  position: relative;
}

.toggle-pass-btn {
  position: absolute;
  right: var(--space-3);
  top: 36px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary-700);
  background: none;
  border: none;
  cursor: pointer;
}

.toggle-pass-btn.has-error {
  top: 36px;
}

.demo-login-box {
  margin-top: var(--space-5);
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.demo-login-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.demo-login-tag {
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.demo-login-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.demo-login-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

.demo-login-note {
  margin-top: var(--space-2);
  font-size: 11px;
  line-height: var(--line-height-normal);
  text-align: center;
  color: var(--color-text-muted);
}

.demo-login-note code {
  font-size: 11px;
}

@media (max-width: 420px) {
  .demo-login-grid {
    grid-template-columns: 1fr;
  }
}

.auth-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-link {
  font-weight: 700;
  color: var(--color-primary-700);
}
</style>
