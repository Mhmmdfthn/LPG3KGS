<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { register } = useAuth()
const { showSuccess, showError } = useNotification()

const form = reactive({
  name: '',
  business_name: '',
  contact: '',
  email: '',
  username: '',
  password: '',
  password_confirmation: ''
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)
const globalError = ref('')

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  globalError.value = ''
  let valid = true

  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Nama penanggung jawab minimal 2 karakter.'
    valid = false
  }

  if (form.business_name && form.business_name.trim().length < 2) {
    errors.business_name = 'Nama usaha minimal 2 karakter jika diisi.'
    valid = false
  }

  if (!form.contact || !/^\+?[0-9 ()-]{6,30}$/.test(form.contact.trim())) {
    errors.contact = 'Nomor kontak telepon/WhatsApp tidak valid (minimal 6 angka).'
    valid = false
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Format alamat email tidak valid.'
    valid = false
  }

  if (!form.username || !/^[a-z0-9_.-]{3,50}$/.test(form.username.trim())) {
    errors.username = 'Username wajib huruf kecil/angka (3–50 karakter: a-z, 0-9, _, ., -).'
    valid = false
  }

  if (!form.password || form.password.length < 10) {
    errors.password = 'Kata sandi minimal 10 karakter.'
    valid = false
  }

  if (form.password !== form.password_confirmation) {
    errors.password_confirmation = 'Konfirmasi kata sandi tidak cocok.'
    valid = false
  }

  return valid
}

async function handleRegister() {
  if (!validate()) {
    showError('Periksa kembali kolom isian formulir yang ditandai merah.', 'Form Tidak Lengkap')
    return
  }

  isSubmitting.value = true
  globalError.value = ''

  try {
    await new Promise(resolve => setTimeout(resolve, 600))

    const newUser = await register({
      username: form.username,
      password: form.password,
      name: form.name,
      business_name: form.business_name || undefined,
      contact: form.contact,
      email: form.email || undefined
    })

    showSuccess(`Pendaftaran atas nama ${newUser.name} berhasil diajukan!`, 'Pengajuan Diterima')
    navigateTo('/registration-pending')
  } catch (err: any) {
    globalError.value = err.message || 'Gagal mengajukan pendaftaran.'
    showError(globalError.value, 'Registrasi Gagal')
  } finally {
    isSubmitting.value = false
  }
}

// Shortcut pengujian form registrasi
function autoFill(type: 'valid' | 'duplicate_user' | 'mismatch_pass') {
  globalError.value = ''
  Object.keys(errors).forEach(k => delete errors[k])

  if (type === 'valid') {
    const randomSuffix = Math.floor(Math.random() * 900 + 100)
    form.name = 'Hendra Pratama'
    form.business_name = `Warung Berkah ${randomSuffix}`
    form.contact = '081399887766'
    form.email = `hendra_${randomSuffix}@gmail.com`
    form.username = `warung_berkah_${randomSuffix}`
    form.password = 'sandi-aman-123'
    form.password_confirmation = 'sandi-aman-123'
  } else if (type === 'duplicate_user') {
    form.name = 'Ahmad Fauzi KW'
    form.business_name = 'Toko Tiruan'
    form.contact = '081233445566'
    form.email = 'ahmad.kw@gmail.com'
    form.username = 'warung_sumber' // Username ini sudah ada di mock
    form.password = 'sandi-aman-123'
    form.password_confirmation = 'sandi-aman-123'
  } else if (type === 'mismatch_pass') {
    form.name = 'Joko Susanto'
    form.business_name = 'Kios Jaya'
    form.contact = '085611223344'
    form.username = 'kios_joko_99'
    form.password = 'sandi-pertama-123'
    form.password_confirmation = 'sandi-berbeda-456'
  }
}
</script>

<template>
  <div class="register-wrapper container">
    <div class="register-card">
      <div class="register-header">
        <span class="register-badge">PENDAFTARAN MITRA</span>
        <h2 class="register-title">Daftar Akun Pengecer B2B</h2>
        <p class="register-subtitle">
          Ajukan pendaftaran akun usaha Anda untuk dapat memesan LPG langsung dari pangkalan.
        </p>
      </div>

      <!-- Notice: No NIK/KTP required -->
      <div class="privacy-notice">
        🔒 <strong>Privasi & Kepatuhan:</strong> Website pangkalan tidak meminta atau menyimpan NIK/KTP. Pendataan resmi konsumen LPG 3 kg bersubsidi tetap dilakukan melalui aplikasi resmi Pertamina (MAP) di luar website ini.
      </div>

      <!-- Alert Error Banner jika pendaftaran gagal/duplikat -->
      <div v-if="globalError" class="register-error-banner" role="alert">
        <span class="error-banner-icon">⚠️</span>
        <div class="error-banner-text">{{ globalError }}</div>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="grid grid-cols-1 sm-grid-cols-2 gap-4">
          <BaseInput
            v-model="form.name"
            label="Nama Penanggung Jawab"
            placeholder="Nama lengkap..."
            :error-text="errors.name"
            required
          />

          <BaseInput
            v-model="form.business_name"
            label="Nama Usaha / Warung (Opsional)"
            placeholder="Contoh: Warung Berkah"
            helper-text="Nama toko atau warung kelontong"
            :error-text="errors.business_name"
          />

          <BaseInput
            v-model="form.contact"
            label="Nomor Kontak (Telepon / WA)"
            placeholder="081234567890"
            :error-text="errors.contact"
            required
          />

          <BaseInput
            v-model="form.email"
            type="email"
            label="Email (Opsional)"
            placeholder="nama@email.com"
            :error-text="errors.email"
          />

          <div class="sm-span-2">
            <BaseInput
              v-model="form.username"
              label="Username Akun"
              placeholder="warung_anda (huruf kecil)"
              helper-text="Digunakan saat masuk ke sistem (3–50 karakter: a-z, 0-9, _, ., -)"
              :error-text="errors.username"
              required
            />
          </div>

          <BaseInput
            v-model="form.password"
            type="password"
            label="Kata Sandi"
            placeholder="Minimal 10 karakter..."
            :error-text="errors.password"
            required
          />

          <BaseInput
            v-model="form.password_confirmation"
            type="password"
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi..."
            :error-text="errors.password_confirmation"
            required
          />
        </div>

        <div class="form-actions mt-6">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isSubmitting"
          >
            Kirim Pengajuan Pendaftaran
          </BaseButton>
        </div>
      </form>

      <!-- Testing Helpers Box -->
      <div class="quick-fill-box">
        <span class="fill-label">PILIHAN PENGUJIAN OTOMATIS:</span>
        <div class="fill-btn-group">
          <button type="button" class="fill-btn" @click="autoFill('valid')">Isi Data Valid</button>
          <button type="button" class="fill-btn fill-danger" @click="autoFill('duplicate_user')">Uji Username Duplikat</button>
          <button type="button" class="fill-btn fill-warning" @click="autoFill('mismatch_pass')">Uji Sandi Beda</button>
        </div>
      </div>

      <div class="register-footer">
        <span>Sudah memiliki akun?</span>
        <NuxtLink to="/login" class="login-link">Masuk ke Akun</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.register-card {
  width: 100%;
  max-width: 680px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

@media (min-width: 640px) {
  .register-card {
    padding: var(--space-8);
  }
}

.register-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.register-badge {
  display: inline-block;
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  margin-bottom: var(--space-2);
}

.register-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin-bottom: var(--space-1);
}

.register-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.privacy-notice {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface-subtle);
  border-left: 3px solid var(--color-primary-600);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  margin-bottom: var(--space-5);
}

.privacy-notice strong {
  color: var(--color-text);
}

.register-error-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  line-height: var(--line-height-normal);
}

.error-banner-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.sm-span-2 {
  grid-column: span 1;
}

@media (min-width: 640px) {
  .sm-span-2 {
    grid-column: span 2;
  }
}

.quick-fill-box {
  margin-top: var(--space-6);
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}

.fill-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: var(--space-2);
}

.fill-btn-group {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
}

.fill-btn {
  padding: 4px 10px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.fill-btn:hover {
  background-color: var(--color-primary-100);
  border-color: var(--color-primary-600);
}

.fill-danger:hover {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.fill-warning:hover {
  background-color: var(--color-warning-bg);
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.register-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.login-link {
  font-weight: 700;
  color: var(--color-primary-700);
}
</style>
