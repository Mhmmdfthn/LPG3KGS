<script setup lang="ts">
const { currentUser, isAdmin, isStaff, changePassword, updateProfile, logout } = useAuth()
const { showSuccess, showError } = useNotification()

definePageMeta({
  layout: false
})

const currentLayout = computed(() => {
  if (isAdmin.value) return 'admin'
  if (isStaff.value) return 'staff'
  return 'retailer'
})

// State Edit Profil
const isEditingProfile = ref(false)
const profileForm = reactive({
  name: '',
  business_name: '',
  contact: '',
  email: ''
})
const isSavingProfile = ref(false)

// Inisialisasi data form profil
watch(currentUser, (u) => {
  if (u) {
    profileForm.name = u.name
    profileForm.business_name = u.business_name || ''
    profileForm.contact = u.contact
    profileForm.email = u.email || ''
  }
}, { immediate: true })

async function handleSaveProfile() {
  if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
    showError('Nama minimal 2 karakter.')
    return
  }
  if (!profileForm.contact.trim() || !/^\+?[0-9 ()-]{6,30}$/.test(profileForm.contact.trim())) {
    showError('Nomor kontak tidak valid.')
    return
  }

  isSavingProfile.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    await updateProfile({
      name: profileForm.name,
      business_name: profileForm.business_name,
      contact: profileForm.contact,
      email: profileForm.email
    })
    isEditingProfile.value = false
    showSuccess('Data profil berhasil diperbarui!', 'Profil Disimpan')
  } catch (err: any) {
    showError(err.message || 'Gagal memperbarui profil.')
  } finally {
    isSavingProfile.value = false
  }
}

// State Ubah Sandi
const currentPass = ref('')
const newPass = ref('')
const confirmPass = ref('')
const isChangingPass = ref(false)
const passError = ref('')

async function handleChangePassword() {
  passError.value = ''

  if (!currentPass.value) {
    passError.value = 'Kata sandi saat ini wajib diisi.'
    return
  }
  if (!newPass.value || newPass.value.length < 10) {
    passError.value = 'Kata sandi baru minimal 10 karakter.'
    return
  }
  if (newPass.value === currentPass.value) {
    passError.value = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.'
    return
  }
  if (newPass.value !== confirmPass.value) {
    passError.value = 'Konfirmasi kata sandi baru tidak cocok.'
    return
  }

  isChangingPass.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    await changePassword(currentPass.value, newPass.value)
    currentPass.value = ''
    newPass.value = ''
    confirmPass.value = ''
    showSuccess('Kata sandi berhasil diperbarui!', 'Sandi Diubah')
  } catch (err: any) {
    passError.value = err.message || 'Gagal mengubah kata sandi.'
    showError(passError.value, 'Ubah Sandi Gagal')
  } finally {
    isChangingPass.value = false
  }
}

// State Logout Modal
const isLogoutModalOpen = ref(false)

function handleLogout() {
  logout()
  isLogoutModalOpen.value = false
  showSuccess('Sesi akun berhasil diakhiri.', 'Sampai Jumpa')
  navigateTo('/login')
}
</script>

<template>
  <NuxtLayout :name="currentLayout">
    <div v-if="currentUser" class="profile-page">
      <div class="profile-top-bar mb-6">
        <div>
          <h1 class="page-heading">Profil Akun & Keamanan (PG-28)</h1>
          <p class="page-subheading">Informasi identitas akun terdaftar dan pengelolaan keamanan akses sistem.</p>
        </div>

        <div class="top-actions">
          <BaseButton variant="danger" size="sm" @click="isLogoutModalOpen = true">
            ðŸšª Keluar Akun
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg-grid-cols-3 gap-6">
        <!-- Account Info Card -->
        <BaseCard title="Data Identitas Akun" subtitle="Informasi terdaftar pada sistem pangkalan" class="lg-span-1">
          <template #actions>
            <BaseButton
              v-if="!isEditingProfile"
              variant="ghost"
              size="sm"
              @click="isEditingProfile = true"
            >
              âœï¸ Edit
            </BaseButton>
          </template>

          <div class="profile-avatar-wrap">
            <div class="large-avatar">{{ currentUser.name.charAt(0) }}</div>
            <div class="profile-main-meta">
              <h3>{{ currentUser.name }}</h3>
              <p class="text-muted">{{ currentUser.business_name || 'Petugas Pangkalan' }}</p>
              <div class="mt-2 flex gap-2">
                <StatusBadge :status="currentUser.role" />
                <StatusBadge :status="currentUser.status" />
              </div>
            </div>
          </div>

          <!-- Mode Tampilan Profil -->
          <div v-if="!isEditingProfile" class="info-meta-list">
            <div class="meta-item">
              <span class="meta-label">Username:</span>
              <span class="meta-value font-mono font-semibold">{{ currentUser.username }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Nomor Kontak:</span>
              <span class="meta-value">{{ currentUser.contact }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Email:</span>
              <span class="meta-value">{{ currentUser.email || '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Terdaftar Sejak:</span>
              <span class="meta-value">{{ formatDate(currentUser.created_at) }}</span>
            </div>
          </div>

          <!-- Mode Edit Profil -->
          <form v-else class="edit-profile-form" @submit.prevent="handleSaveProfile">
            <BaseInput
              v-model="profileForm.name"
              label="Nama Lengkap"
              required
            />
            <BaseInput
              v-if="currentUser.role === 'pengecer'"
              v-model="profileForm.business_name"
              label="Nama Usaha / Warung"
            />
            <BaseInput
              v-model="profileForm.contact"
              label="Nomor Kontak"
              required
            />
            <BaseInput
              v-model="profileForm.email"
              type="email"
              label="Email"
            />

            <div class="flex gap-2 justify-end mt-4">
              <BaseButton variant="secondary" size="sm" type="button" @click="isEditingProfile = false">
                Batal
              </BaseButton>
              <BaseButton variant="primary" size="sm" type="submit" :loading="isSavingProfile">
                Simpan
              </BaseButton>
            </div>
          </form>
        </BaseCard>

        <!-- Change Password Form -->
        <BaseCard title="Ubah Kata Sandi Akun" subtitle="Perbarui kata sandi untuk keamanan akses pangkalan" class="lg-span-2">
          <!-- Password Error Banner -->
          <div v-if="passError" class="pass-error-banner mb-4" role="alert">
            <span>âš ï¸</span>
            <span>{{ passError }}</span>
          </div>

          <form @submit.prevent="handleChangePassword">
            <div class="grid grid-cols-1 gap-4">
              <BaseInput
                v-model="currentPass"
                type="password"
                label="Kata Sandi Saat Ini"
                placeholder="Masukkan kata sandi lama (demo: password-uji-123)..."
                required
              />

              <BaseInput
                v-model="newPass"
                type="password"
                label="Kata Sandi Baru"
                placeholder="Minimal 10 karakter..."
                helper-text="Kata sandi harus terdiri dari minimal 10 karakter kombinasi aman."
                required
              />

              <BaseInput
                v-model="confirmPass"
                type="password"
                label="Konfirmasi Kata Sandi Baru"
                placeholder="Ulangi kata sandi baru..."
                required
              />
            </div>

            <div class="mt-6 flex justify-end">
              <BaseButton
                type="submit"
                variant="primary"
                :loading="isChangingPass"
              >
                Perbarui Kata Sandi
              </BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>

      <!-- Logout Confirmation Modal -->
      <BaseModal
        :is-open="isLogoutModalOpen"
        title="Konfirmasi Keluar Sesi"
        max-width="440px"
        @close="isLogoutModalOpen = false"
      >
        <p class="text-sm text-muted">
          Apakah Anda yakin ingin keluar dari sesi akun <strong>{{ currentUser.name }}</strong>?
        </p>

        <template #footer>
          <BaseButton variant="secondary" @click="isLogoutModalOpen = false">Batal</BaseButton>
          <BaseButton variant="danger" @click="handleLogout">Ya, Keluar</BaseButton>
        </template>
      </BaseModal>
    </div>

    <!-- Empty fallback jika sesi kosong -->
    <div v-else class="container py-8">
      <EmptyState
        title="Sesi Tidak Ditemukan"
        description="Silakan masuk terlebih dahulu untuk mengakses profil Anda."
        action-label="Ke Halaman Masuk"
        @action="navigateTo('/login')"
      />
    </div>
  </NuxtLayout>
</template>

<style scoped>
.profile-top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.page-heading {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary-900);
}

.page-subheading {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.profile-avatar-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}

.large-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--color-primary-700);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-main-meta h3 {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.info-meta-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-2);
  border-bottom: 1px dashed var(--color-border);
  flex-wrap: wrap;
  gap: var(--space-1);
}

.meta-label {
  color: var(--color-text-muted);
}

.meta-value {
  color: var(--color-text);
}

.edit-profile-form {
  display: flex;
  flex-direction: column;
}

.pass-error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
</style>
