<script setup lang="ts">
import type { User as MockUser } from '~/types/models'
import type { CreateUserPayload } from '~/composables/useAuth'

definePageMeta({
  layout: 'admin'
})

const { users, loadAccounts, addUser, updateUser, toggleUserStatus, resetUserPassword } = useAuth()
onMounted(() => Promise.all([loadAccounts('/retailers'), loadAccounts('/staff')]))
const { showSuccess, showError } = useNotification()

// Tab aktif: 'pengecer' | 'karyawan'
const activeTab = ref<'pengecer' | 'karyawan'>('pengecer')

// Filter & Pencarian
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
const currentPage = ref(1)
const pageSize = 8

// Total Pending Retailers (untuk reminder banner)
const pendingCount = computed(() => {
  return users.value.filter(u => u.role === 'pengecer' && u.status === 'PENDING').length
})

// Tab Counts
const retailerCount = computed(() => {
  return users.value.filter(u => u.role === 'pengecer' && u.status !== 'PENDING' && u.status !== 'REJECTED').length
})
const staffCount = computed(() => {
  return users.value.filter(u => u.role === 'karyawan').length
})

// List Filtered
const filteredUsers = computed(() => {
  return users.value.filter(u => {
    // Saring berdasarkan tab role
    if (u.role !== activeTab.value) return false

    // Pada tab pengecer, kita kelola akun resmi yang sudah disetujui (ACTIVE atau INACTIVE).
    // Akun PENDING/REJECTED berada pada alur persetujuan (/admin/users/pending)
    if (u.role === 'pengecer' && (u.status === 'PENDING' || u.status === 'REJECTED')) {
      return false
    }

    // Filter status
    if (statusFilter.value !== 'ALL' && u.status !== statusFilter.value) {
      return false
    }

    // Filter search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchName = u.name.toLowerCase().includes(q)
      const matchBusiness = u.business_name ? u.business_name.toLowerCase().includes(q) : false
      const matchUsername = u.username.toLowerCase().includes(q)
      const matchContact = u.contact.includes(q)
      const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false
      if (!matchName && !matchBusiness && !matchUsername && !matchContact && !matchEmail) {
        return false
      }
    }

    return true
  })
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize) || 1)
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

watch([activeTab, searchQuery, statusFilter], () => {
  currentPage.value = 1
})

// ==========================================
// 1. MODAL TAMBAH PENGGUNA
// ==========================================
const isAddModalOpen = ref(false)
const isSubmittingAdd = ref(false)
const addForm = reactive<CreateUserPayload>({
  role: 'pengecer',
  username: '',
  password: '',
  name: '',
  business_name: '',
  contact: '',
  email: ''
})
const addErrors = reactive({
  username: '',
  password: '',
  name: '',
  contact: '',
  email: ''
})

function openAddModal() {
  addForm.role = activeTab.value
  addForm.username = ''
  addForm.password = ''
  addForm.name = ''
  addForm.business_name = ''
  addForm.contact = ''
  addForm.email = ''
  clearAddErrors()
  isAddModalOpen.value = true
}

function clearAddErrors() {
  addErrors.username = ''
  addErrors.password = ''
  addErrors.name = ''
  addErrors.contact = ''
  addErrors.email = ''
}

function validateAddForm(): boolean {
  clearAddErrors()
  let valid = true

  if (!addForm.username.trim()) {
    addErrors.username = 'Username wajib diisi.'
    valid = false
  } else if (addForm.username.trim().length < 3) {
    addErrors.username = 'Username minimal 3 karakter.'
    valid = false
  }

  if (!addForm.password) {
    addErrors.password = 'Kata sandi wajib diisi.'
    valid = false
  } else if (addForm.password.length < 10) {
    addErrors.password = 'Kata sandi minimal 10 karakter sesuai PRD.'
    valid = false
  }

  if (!addForm.name.trim()) {
    addErrors.name = addForm.role === 'pengecer' ? 'Nama pemilik/penanggung jawab wajib diisi.' : 'Nama lengkap wajib diisi.'
    valid = false
  }

  if (!addForm.contact.trim()) {
    addErrors.contact = 'Nomor kontak WhatsApp/telepon wajib diisi.'
    valid = false
  }

  if (addForm.email && addForm.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addForm.email.trim())) {
      addErrors.email = 'Format alamat email tidak valid.'
      valid = false
    }
  }

  return valid
}

async function handleAddUser() {
  if (!validateAddForm()) return

  isSubmittingAdd.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    const created = await addUser({
      role: addForm.role,
      username: addForm.username,
      password: addForm.password,
      name: addForm.name,
      business_name: addForm.business_name,
      contact: addForm.contact,
      email: addForm.email
    })

    showSuccess(
      `Akun ${created.role === 'pengecer' ? 'pengecer' : 'karyawan'} "${created.name}" berhasil dibuat dan berstatus AKTIF.`,
      'Akun Berhasil Ditambahkan'
    )
    isAddModalOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Gagal menambahkan pengguna.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingAdd.value = false
  }
}

// ==========================================
// 2. MODAL EDIT PENGGUNA
// ==========================================
const isEditModalOpen = ref(false)
const isSubmittingEdit = ref(false)
const editingUserId = ref('')
const editForm = reactive({
  role: 'pengecer' as 'pengecer' | 'karyawan',
  username: '',
  name: '',
  business_name: '',
  contact: '',
  email: ''
})
const editErrors = reactive({
  name: '',
  contact: '',
  email: ''
})

function openEditModal(user: MockUser) {
  editingUserId.value = user.id
  editForm.role = user.role as 'pengecer' | 'karyawan'
  editForm.username = user.username
  editForm.name = user.name
  editForm.business_name = user.business_name || ''
  editForm.contact = user.contact
  editForm.email = user.email || ''
  editErrors.name = ''
  editErrors.contact = ''
  editErrors.email = ''
  isEditModalOpen.value = true
}

function validateEditForm(): boolean {
  editErrors.name = ''
  editErrors.contact = ''
  editErrors.email = ''
  let valid = true

  if (!editForm.name.trim()) {
    editErrors.name = 'Nama tidak boleh kosong.'
    valid = false
  }

  if (!editForm.contact.trim()) {
    editErrors.contact = 'Nomor kontak tidak boleh kosong.'
    valid = false
  }

  if (editForm.email && editForm.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email.trim())) {
      editErrors.email = 'Format alamat email tidak valid.'
      valid = false
    }
  }

  return valid
}

async function handleUpdateUser() {
  if (!validateEditForm()) return

  isSubmittingEdit.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    await updateUser(editingUserId.value, {
      name: editForm.name,
      business_name: editForm.business_name,
      contact: editForm.contact,
      email: editForm.email
    }, editForm.role)

    showSuccess('Data informasi akun berhasil diperbarui.', 'Perubahan Tersimpan')
    isEditModalOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Gagal menyimpan pembaruan.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingEdit.value = false
  }
}

// ==========================================
// 3. MODAL TOGGLE STATUS (AKTIFKAN / NONAKTIFKAN)
// ==========================================
const isToggleStatusModalOpen = ref(false)
const userToToggle = ref<MockUser | null>(null)
const isSubmittingToggle = ref(false)

function promptToggleStatus(user: MockUser) {
  userToToggle.value = user
  isToggleStatusModalOpen.value = true
}

async function handleConfirmToggleStatus() {
  if (!userToToggle.value) return
  isSubmittingToggle.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 350))
    const updated = await toggleUserStatus(userToToggle.value.id, userToToggle.value.role)
    const isNowActive = updated.status === 'ACTIVE'

    showSuccess(
      `Akun "${updated.name}" kini ${isNowActive ? 'AKTIF kembali' : 'DINONAKTIFKAN'}.`,
      isNowActive ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan'
    )
    isToggleStatusModalOpen.value = false
    userToToggle.value = null
  } catch (err: any) {
    showError(err.message || 'Gagal mengubah status akun.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingToggle.value = false
  }
}

// ==========================================
// 4. MODAL RESET PASSWORD
// ==========================================
const isResetModalOpen = ref(false)
const userToReset = ref<MockUser | null>(null)
const resetNewPass = ref('')
const resetConfirmPass = ref('')
const resetError = ref('')
const isSubmittingReset = ref(false)

function promptResetPassword(user: MockUser) {
  userToReset.value = user
  resetNewPass.value = ''
  resetConfirmPass.value = ''
  resetError.value = ''
  isResetModalOpen.value = true
}

async function handleConfirmResetPassword() {
  if (!userToReset.value) return
  resetError.value = ''

  if (!resetNewPass.value) {
    resetError.value = 'Kata sandi baru wajib diisi.'
    return
  }
  if (resetNewPass.value.length < 10) {
    resetError.value = 'Kata sandi baru minimal 10 karakter sesuai standar PRD.'
    return
  }
  if (resetNewPass.value !== resetConfirmPass.value) {
    resetError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  isSubmittingReset.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    await resetUserPassword(userToReset.value.id, resetNewPass.value, userToReset.value.role)
    showSuccess(
      `Kata sandi untuk akun "@${userToReset.value.username}" berhasil direset.`,
      'Reset Sandi Berhasil'
    )
    isResetModalOpen.value = false
    userToReset.value = null
  } catch (err: any) {
    showError(err.message || 'Gagal mereset kata sandi.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingReset.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <!-- Header Halaman -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Manajemen Pengguna (PG-06)</h1>
        <p class="page-subtitle">
          Kelola hak akses pangkalan: akun warung pengecer resmi dan staf karyawan operasional.
        </p>
      </div>

      <div class="header-actions">
        <BaseButton variant="primary" size="md" @click="openAddModal">
          <span class="btn-icon">➕</span> Tambah Pengguna Baru
        </BaseButton>
      </div>
    </div>

    <!-- Banner Notifikasi jika ada Pengecer Pending -->
    <div v-if="pendingCount > 0" class="pending-notice-card mb-6">
      <div class="notice-icon">⏳</div>
      <div class="notice-content">
        <h4 class="notice-title">Ada {{ pendingCount }} Pendaftaran Pengecer Menunggu Persetujuan</h4>
        <p class="notice-desc">
          Calon pengecer telah mendaftar mandiri dan membutuhkan persetujuan Admin sebelum dapat masuk & bertransaksi.
        </p>
      </div>
      <div class="notice-action">
        <NuxtLink to="/admin/users/pending" class="notice-btn">
          Tinjau Pendaftaran ({{ pendingCount }}) →
        </NuxtLink>
      </div>
    </div>

    <!-- Tab Navigasi Role: Pengecer vs Karyawan -->
    <div class="tabs-nav-bar mb-6">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'pengecer' }"
        @click="activeTab = 'pengecer'"
      >
        <span class="tab-icon">🏪</span>
        <span class="tab-text">Pengecer B2B</span>
        <span class="tab-badge">{{ retailerCount }}</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'karyawan' }"
        @click="activeTab = 'karyawan'"
      >
        <span class="tab-icon">👷</span>
        <span class="tab-text">Karyawan Operasional</span>
        <span class="tab-badge">{{ staffCount }}</span>
      </button>
    </div>

    <!-- Toolbar: Search & Status Filter -->
    <div class="toolbar-card mb-6">
      <div class="toolbar-search">
        <BaseInput
          v-model="searchQuery"
          :placeholder="activeTab === 'pengecer' ? 'Cari nama warung, pemilik, username, atau kontak...' : 'Cari nama karyawan, username, atau kontak...'"
          size="md"
        />
      </div>

      <div class="toolbar-filter">
        <label for="status-filter-select" class="filter-label">Filter Status:</label>
        <select id="status-filter-select" v-model="statusFilter" class="filter-select">
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Hanya Aktif</option>
          <option value="INACTIVE">Hanya Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- Konten Tabel / List Data -->
    <div class="table-card">
      <div v-if="paginatedUsers.length > 0">
        <!-- Desktop Table -->
        <div class="table-responsive hide-mobile">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ activeTab === 'pengecer' ? 'Usaha & Pemilik' : 'Nama Lengkap' }}</th>
                <th>Username</th>
                <th>Kontak & Email</th>
                <th>Tanggal Dibuat</th>
                <th>Status</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>
                  <div class="user-cell">
                    <strong class="user-main-title">
                      {{ activeTab === 'pengecer' ? (user.business_name || user.name) : user.name }}
                    </strong>
                    <span v-if="activeTab === 'pengecer' && user.business_name" class="user-sub-title">
                      Penanggung Jawab: {{ user.name }}
                    </span>
                  </div>
                </td>
                <td>
                  <code class="username-code">@{{ user.username }}</code>
                </td>
                <td>
                  <div class="contact-cell">
                    <span>📞 {{ user.contact }}</span>
                    <span v-if="user.email" class="contact-email">✉️ {{ user.email }}</span>
                    <span v-else class="text-muted text-xs">-</span>
                  </div>
                </td>
                <td>
                  <span class="date-text">{{ formatDate(user.created_at) }}</span>
                </td>
                <td>
                  <StatusBadge :status="user.status" />
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      title="Edit informasi akun"
                      @click="openEditModal(user)"
                    >
                      Edit
                    </BaseButton>

                    <BaseButton
                      variant="ghost"
                      size="sm"
                      title="Reset Kata Sandi"
                      @click="promptResetPassword(user)"
                    >
                      Reset Sandi
                    </BaseButton>

                    <BaseButton
                      :variant="user.status === 'ACTIVE' ? 'secondary' : 'success'"
                      size="sm"
                      :title="user.status === 'ACTIVE' ? 'Nonaktifkan akun' : 'Aktifkan kembali akun'"
                      @click="promptToggleStatus(user)"
                    >
                      {{ user.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan' }}
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div class="mobile-card-list hide-desktop">
          <div v-for="user in paginatedUsers" :key="user.id" class="user-mobile-card">
            <div class="card-header-row">
              <div>
                <h3 class="m-card-title">{{ activeTab === 'pengecer' ? (user.business_name || user.name) : user.name }}</h3>
                <span class="m-card-subtitle">
                  <span v-if="activeTab === 'pengecer' && user.business_name">{{ user.name }} • </span>
                  <code class="text-xs">@{{ user.username }}</code>
                </span>
              </div>
              <StatusBadge :status="user.status" size="sm" />
            </div>

            <div class="card-body-row">
              <div class="m-info-item">
                <span class="m-info-label">Kontak:</span>
                <span class="m-info-value">📞 {{ user.contact }}</span>
              </div>
              <div v-if="user.email" class="m-info-item">
                <span class="m-info-label">Email:</span>
                <span class="m-info-value">✉️ {{ user.email }}</span>
              </div>
              <div class="m-info-item">
                <span class="m-info-label">Dibuat:</span>
                <span class="m-info-value">{{ formatDate(user.created_at) }}</span>
              </div>
            </div>

            <div class="card-actions-row">
              <BaseButton
                variant="secondary"
                size="sm"
                block
                @click="openEditModal(user)"
              >
                Edit Data
              </BaseButton>

              <BaseButton
                variant="ghost"
                size="sm"
                block
                @click="promptResetPassword(user)"
              >
                Reset Sandi
              </BaseButton>

              <BaseButton
                :variant="user.status === 'ACTIVE' ? 'secondary' : 'success'"
                size="sm"
                block
                @click="promptToggleStatus(user)"
              >
                {{ user.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-footer">
          <PaginationNav
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="filteredUsers.length"
            :page-size="pageSize"
            @update:page="currentPage = $event"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="p-8">
        <EmptyState
          v-if="searchQuery || statusFilter !== 'ALL'"
          title="Pengguna Tidak Ditemukan"
          description="Tidak ada pengguna yang cocok dengan filter pencarian Anda."
          action-label="Reset Filter"
          @action="searchQuery = ''; statusFilter = 'ALL'"
        />
        <EmptyState
          v-else
          :title="`Belum Ada Data ${activeTab === 'pengecer' ? 'Pengecer' : 'Karyawan'}`"
          :description="`Tambahkan akun ${activeTab === 'pengecer' ? 'pengecer' : 'karyawan'} pertama untuk memulai operasi.`"
          action-label="+ Tambah Pengguna Baru"
          @action="openAddModal"
        />
      </div>
    </div>

    <!-- MODAL 1: Tambah Pengguna Baru -->
    <BaseModal
      :is-open="isAddModalOpen"
      :title="`Tambah Akun ${addForm.role === 'pengecer' ? 'Pengecer B2B' : 'Karyawan Operasional'}`"
      max-width="560px"
      @close="isAddModalOpen = false"
    >
      <form class="user-modal-form" @submit.prevent="handleAddUser">
        <!-- Pilihan Role -->
        <div class="role-selector-row mb-4">
          <label class="form-label mb-1">Peran Akun (Role) <span class="required-star">*</span></label>
          <div class="role-radio-group">
            <label class="role-pill" :class="{ 'is-selected': addForm.role === 'pengecer' }">
              <input v-model="addForm.role" type="radio" value="pengecer" class="sr-only">
              <span>🏪 Pengecer (Warung B2B)</span>
            </label>
            <label class="role-pill" :class="{ 'is-selected': addForm.role === 'karyawan' }">
              <input v-model="addForm.role" type="radio" value="karyawan" class="sr-only">
              <span>👷 Karyawan (Operasional)</span>
            </label>
          </div>
        </div>

        <div class="form-grid">
          <BaseInput
            v-model="addForm.username"
            label="Username"
            placeholder="misal: warung_berkah"
            :error-text="addErrors.username"
            helper-text="Digunakan untuk masuk ke sistem (huruf kecil & angka)."
            required
          />

          <BaseInput
            v-model="addForm.password"
            type="password"
            label="Kata Sandi Awal"
            placeholder="Minimal 10 karakter..."
            :error-text="addErrors.password"
            helper-text="Sesuai PRD, minimal 10 karakter."
            required
          />
        </div>

        <div class="form-grid mt-3">
          <BaseInput
            v-model="addForm.name"
            :label="addForm.role === 'pengecer' ? 'Nama Pemilik / Penanggung Jawab' : 'Nama Lengkap Karyawan'"
            placeholder="Nama lengkap..."
            :error-text="addErrors.name"
            required
          />

          <BaseInput
            v-if="addForm.role === 'pengecer'"
            v-model="addForm.business_name"
            label="Nama Toko / Usaha (Opsional)"
            placeholder="misal: Toko Kelontong Berkah"
            helper-text="Kosongkan jika sama dengan nama pemilik"
          />
        </div>

        <div class="form-grid mt-3">
          <BaseInput
            v-model="addForm.contact"
            label="Nomor Kontak WhatsApp / HP"
            placeholder="08xxxxxxxxxx"
            :error-text="addErrors.contact"
            required
          />

          <BaseInput
            v-model="addForm.email"
            type="email"
            label="Alamat Email (Opsional)"
            placeholder="nama@email.com"
            :error-text="addErrors.email"
          />
        </div>

        <div class="admin-notice mt-4">
          <span class="notice-icon-sm">🛡️</span>
          <span>Akun yang dibuat langsung oleh Admin otomatis berstatus <strong>AKTIF</strong> dan siap digunakan login.</span>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingAdd" @click="isAddModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton variant="primary" :loading="isSubmittingAdd" @click="handleAddUser">
            Simpan Akun
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 2: Edit Informasi Pengguna -->
    <BaseModal
      :is-open="isEditModalOpen"
      :title="`Edit Data ${editForm.role === 'pengecer' ? 'Pengecer' : 'Karyawan'}`"
      max-width="540px"
      @close="isEditModalOpen = false"
    >
      <form class="user-modal-form" @submit.prevent="handleUpdateUser">
        <div class="readonly-badge-box mb-4">
          <div>
            <span class="text-xs text-muted">Username (Tidak dapat diubah):</span>
            <div class="font-bold text-navy">@{{ editForm.username }}</div>
          </div>
          <span class="badge badge-info badge-sm">{{ editForm.role.toUpperCase() }}</span>
        </div>

        <div class="form-grid">
          <BaseInput
            v-model="editForm.name"
            :label="editForm.role === 'pengecer' ? 'Nama Pemilik / Penanggung Jawab' : 'Nama Lengkap'"
            :error-text="editErrors.name"
            required
          />

          <BaseInput
            v-if="editForm.role === 'pengecer'"
            v-model="editForm.business_name"
            label="Nama Usaha / Warung"
            placeholder="Nama usaha..."
          />
        </div>

        <div class="form-grid mt-3">
          <BaseInput
            v-model="editForm.contact"
            label="Nomor Kontak WhatsApp / Telepon"
            :error-text="editErrors.contact"
            required
          />

          <BaseInput
            v-model="editForm.email"
            type="email"
            label="Alamat Email"
            placeholder="nama@email.com"
            :error-text="editErrors.email"
          />
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingEdit" @click="isEditModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton variant="primary" :loading="isSubmittingEdit" @click="handleUpdateUser">
            Simpan Perubahan
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 3: Konfirmasi Aktifkan / Nonaktifkan -->
    <BaseModal
      :is-open="isToggleStatusModalOpen"
      :title="userToToggle?.status === 'ACTIVE' ? 'Konfirmasi Penonaktifan Akun' : 'Konfirmasi Pengaktifan Akun'"
      max-width="480px"
      @close="isToggleStatusModalOpen = false"
    >
      <div v-if="userToToggle" class="confirm-content">
        <div
          class="confirm-icon-box"
          :class="userToToggle.status === 'ACTIVE' ? 'danger-icon-box' : 'success-icon-box'"
        >
          {{ userToToggle.status === 'ACTIVE' ? '⏸️' : '▶️' }}
        </div>

        <h4 class="confirm-title">
          {{ userToToggle.status === 'ACTIVE' ? 'Nonaktifkan Akun Pengguna?' : 'Aktifkan Kembali Akun Pengguna?' }}
        </h4>

        <p class="confirm-desc">
          Akun <strong>{{ userToToggle.business_name || userToToggle.name }}</strong> (<code>@{{ userToToggle.username }}</code>) akan {{ userToToggle.status === 'ACTIVE' ? 'dinonaktifkan' : 'diaktifkan kembali' }}.
        </p>

        <div class="status-warning-box text-sm">
          <template v-if="userToToggle.status === 'ACTIVE'">
            ⚠️ <strong>Perhatian:</strong> Pengguna tidak akan dapat masuk ke sistem. Seluruh data historis transaksi dan pesanan tetap aman tersimpan.
          </template>
          <template v-else>
            ✅ <strong>Informasi:</strong> Pengguna akan dapat segera masuk kembali ke sistem menggunakan kredensial yang tersimpan.
          </template>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingToggle" @click="isToggleStatusModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton
            :variant="userToToggle?.status === 'ACTIVE' ? 'danger' : 'success'"
            :loading="isSubmittingToggle"
            @click="handleConfirmToggleStatus"
          >
            {{ userToToggle?.status === 'ACTIVE' ? 'Ya, Nonaktifkan Akun' : 'Ya, Aktifkan Akun' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 4: Reset Password Pengguna -->
    <BaseModal
      :is-open="isResetModalOpen"
      title="Reset Kata Sandi Pengguna"
      max-width="480px"
      @close="isResetModalOpen = false"
    >
      <div v-if="userToReset" class="reset-content">
        <p class="text-sm text-muted mb-4">
          Masukkan kata sandi baru untuk akun <strong>{{ userToReset.name }}</strong> (<code>@{{ userToReset.username }}</code>).
        </p>

        <div v-if="resetError" class="reset-error-banner mb-3">
          {{ resetError }}
        </div>

        <div class="reset-form-fields">
          <BaseInput
            v-model="resetNewPass"
            type="password"
            label="Kata Sandi Baru"
            placeholder="Minimal 10 karakter..."
            helper-text="Sesuai PRD, minimal 10 karakter."
            required
          />

          <div class="mt-3">
            <BaseInput
              v-model="resetConfirmPass"
              type="password"
              label="Konfirmasi Kata Sandi Baru"
              placeholder="Ulangi kata sandi baru..."
              required
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingReset" @click="isResetModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="isSubmittingReset"
            @click="handleConfirmResetPassword"
          >
            Simpan Kata Sandi Baru
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-container {
  padding-bottom: var(--space-8);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-navy);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: var(--space-1);
}

.btn-icon {
  margin-right: 4px;
}

/* Notice Card */
.pending-notice-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .pending-notice-card {
    flex-direction: row;
    align-items: center;
  }
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: #92400e;
  margin: 0 0 2px 0;
}

.notice-desc {
  font-size: var(--font-size-xs);
  color: #b45309;
  margin: 0;
}

.notice-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background-color: #f59e0b;
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-md);
  text-decoration: none;
  white-space: nowrap;
}

.notice-btn:hover {
  background-color: #d97706;
}

/* Tab Bar */
.tabs-nav-bar {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 2px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -4px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn:hover {
  color: var(--color-navy);
}

.tab-btn.is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-badge {
  background-color: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.tab-btn.is-active .tab-badge {
  background-color: #e0f2fe;
  color: var(--color-primary);
}

/* Toolbar */
.toolbar-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .toolbar-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .toolbar-search {
    flex: 1;
    max-width: 480px;
  }
}

.toolbar-filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-muted);
  white-space: nowrap;
}

.filter-select {
  height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-navy);
}

/* Table Card */
.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--font-size-sm);
}

.data-table th {
  background-color: #f8fafc;
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background-color: #f1f5f9;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-main-title {
  color: var(--color-navy);
  font-size: var(--font-size-sm);
}

.user-sub-title {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.username-code {
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-size-xs);
}

.date-text {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* Mobile Card List */
.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.user-mobile-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.m-card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-navy);
  margin: 0;
}

.m-card-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.card-body-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: var(--space-3);
  border-bottom: 1px dashed var(--color-border);
  font-size: var(--font-size-xs);
}

.m-info-item {
  display: flex;
  justify-content: space-between;
}

.m-info-label {
  color: var(--color-muted);
}

.card-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.pagination-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Modals */
.user-modal-form {
  display: flex;
  flex-direction: column;
}

.role-radio-group {
  display: flex;
  gap: var(--space-3);
}

.role-pill {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.role-pill.is-selected {
  border-color: var(--color-primary);
  background-color: #e0f2fe;
  color: var(--color-primary);
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.admin-notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: #166534;
}

.readonly-badge-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.confirm-content, .reset-content {
  text-align: center;
  padding: var(--space-2) 0;
}

.confirm-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto var(--space-3);
}

.success-icon-box {
  background-color: #dcfce7;
  color: #15803d;
}

.danger-icon-box {
  background-color: #fee2e2;
  color: #b91c1c;
}

.confirm-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: var(--space-1);
}

.confirm-desc {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-bottom: var(--space-3);
}

.status-warning-box {
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  text-align: left;
}

.reset-error-banner {
  padding: var(--space-2) var(--space-3);
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-md);
  text-align: left;
}

.reset-form-fields {
  text-align: left;
}

.modal-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}
</style>

