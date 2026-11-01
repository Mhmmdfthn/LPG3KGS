<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { login } = useMockAuth()
const { showSuccess, showError } = useNotification()

const identity = ref('admin')
const password = ref('password-uji-123')
const showPassword = ref(false)
const isLoading = ref(false)

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
    // Simulasi delay jaringan realistis
    await new Promise(resolve => setTimeout(resolve, 500))

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

// Shortcut demo untuk kemudahan pengujian
function quickSelect(type: 'admin' | 'karyawan' | 'pengecer' | 'pending' | 'rejected' | 'inactive' | 'wrong_pass') {
  serverError.value = ''
  errors.identity = ''
  errors.password = ''

  switch (type) {
    case 'admin':
      identity.value = 'admin'
      password.value = 'password-uji-123'
      break
    case 'karyawan':
      identity.value = 'siti_karyawan'
      password.value = 'password-uji-123'
      break
    case 'pengecer':
      identity.value = 'warung_sumber'
      password.value = 'password-uji-123'
      break
    case 'pending':
      identity.value = 'toko_makmur'
      password.value = 'password-uji-123'
      break
    case 'rejected':
      identity.value = 'toko_subur'
      password.value = 'password-uji-123'
      break
    case 'inactive':
      identity.value = 'kios_bunda'
      password.value = 'password-uji-123'
      break
    case 'wrong_pass':
      identity.value = 'admin'
      password.value = 'sandi-salah-123'
      break
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

      <!-- Quick Demo Switcher untuk pengujian role & error states -->
      <div class="quick-demo-box">
        <span class="demo-tag">UJI COBA SIMULASI LOGIN:</span>
        <div class="demo-btn-group">
          <button type="button" class="quick-btn" title="Login sebagai Pemilik" @click="quickSelect('admin')">Admin</button>
          <button type="button" class="quick-btn" title="Login sebagai Karyawan" @click="quickSelect('karyawan')">Karyawan</button>
          <button type="button" class="quick-btn" title="Login sebagai Pengecer Aktif" @click="quickSelect('pengecer')">Pengecer</button>
        </div>
        <div class="demo-btn-group mt-2">
          <button type="button" class="quick-btn btn-state" title="Uji akun status PENDING" @click="quickSelect('pending')">Akun Pending</button>
          <button type="button" class="quick-btn btn-state" title="Uji akun status REJECTED" @click="quickSelect('rejected')">Akun Ditolak</button>
          <button type="button" class="quick-btn btn-state" title="Uji akun status INACTIVE" @click="quickSelect('inactive')">Akun Nonaktif</button>
          <button type="button" class="quick-btn btn-state" title="Uji kata sandi salah" @click="quickSelect('wrong_pass')">Sandi Salah</button>
        </div>
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

.quick-demo-box {
  margin-top: var(--space-6);
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}

.demo-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--space-2);
}

.demo-btn-group {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 5px 12px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-btn:hover {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
}

.btn-state {
  font-size: 11px;
  color: var(--color-text-muted);
}

.btn-state:hover {
  background-color: var(--color-warning-bg);
  border-color: var(--color-warning);
  color: var(--color-warning);
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
