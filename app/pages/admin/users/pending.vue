<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { users, approveRetailer, rejectRetailer } = useMockAuth()
const { showSuccess, showError } = useNotification()

// State Filter & Pencarian
const searchQuery = ref('')
const selectedStatusFilter = ref('PENDING')
const currentPage = ref(1)
const pageSize = 8

// State Modal Detail
const isDetailOpen = ref(false)
const selectedUser = ref<any>(null)

// State Modal Konfirmasi Persetujuan
const isApproveModalOpen = ref(false)
const userToApprove = ref<any>(null)
const isSubmittingApprove = ref(false)

// State Modal Penolakan
const isRejectModalOpen = ref(false)
const userToReject = ref<any>(null)
const rejectReason = ref('')
const rejectError = ref('')
const isSubmittingReject = ref(false)

// Computed List Pengguna Pengecer Pending
const pendingRetailers = computed(() => {
  return users.value.filter(u => {
    // Hanya tampilkan role pengecer
    if (u.role !== 'pengecer') return false

    // Filter status
    if (selectedStatusFilter.value !== 'ALL') {
      if (u.status !== selectedStatusFilter.value) return false
    }

    // Filter pencarian
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchName = u.name.toLowerCase().includes(q)
      const matchBusiness = u.business_name ? u.business_name.toLowerCase().includes(q) : false
      const matchUsername = u.username.toLowerCase().includes(q)
      const matchContact = u.contact.includes(q)
      if (!matchName && !matchBusiness && !matchUsername && !matchContact) return false
    }

    return true
  })
})

// Total Pendaftaran Menunggu Persetujuan (seluruh database)
const totalPendingCount = computed(() => {
  return users.value.filter(u => u.role === 'pengecer' && u.status === 'PENDING').length
})

// Pagination
const totalPages = computed(() => Math.ceil(pendingRetailers.value.length / pageSize) || 1)
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return pendingRetailers.value.slice(start, start + pageSize)
})

// Reset page jika filter berubah
watch([searchQuery, selectedStatusFilter], () => {
  currentPage.value = 1
})

// Aksi Buka Detail
function openDetail(user: any) {
  selectedUser.value = user
  isDetailOpen.value = true
}

// Aksi Dialog Persetujuan
function promptApprove(user: any) {
  userToApprove.value = user
  isApproveModalOpen.value = true
}

async function handleConfirmApprove() {
  if (!userToApprove.value) return
  isSubmittingApprove.value = true

  try {
    // Simulasi delay realistis
    await new Promise(resolve => setTimeout(resolve, 400))
    await approveRetailer(userToApprove.value.id)
    showSuccess(
      `Akun pengecer "${userToApprove.value.business_name || userToApprove.value.name}" telah disetujui dan kini AKTIF.`,
      'Persetujuan Berhasil'
    )
    isApproveModalOpen.value = false
    if (isDetailOpen.value && selectedUser.value?.id === userToApprove.value.id) {
      isDetailOpen.value = false
    }
    userToApprove.value = null
  } catch (err: any) {
    showError(err.message || 'Gagal menyetujui akun pengecer.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingApprove.value = false
  }
}

// Aksi Dialog Penolakan
function promptReject(user: any) {
  userToReject.value = user
  rejectReason.value = ''
  rejectError.value = ''
  isRejectModalOpen.value = true
}

async function handleConfirmReject() {
  if (!userToReject.value) return

  const reason = rejectReason.value.trim()
  if (!reason) {
    rejectError.value = 'Alasan penolakan wajib diisi agar pendaftar memahami kendala pendaftaran.'
    return
  }

  isSubmittingReject.value = true
  rejectError.value = ''

  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    await rejectRetailer(userToReject.value.id, reason)
    showSuccess(
      `Permohonan pendaftaran akun "${userToReject.value.business_name || userToReject.value.name}" telah ditolak.`,
      'Penolakan Berhasil'
    )
    isRejectModalOpen.value = false
    if (isDetailOpen.value && selectedUser.value?.id === userToReject.value.id) {
      isDetailOpen.value = false
    }
    userToReject.value = null
  } catch (err: any) {
    showError(err.message || 'Gagal memproses penolakan pendaftaran.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingReject.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <!-- Header Halaman -->
    <div class="page-header">
      <div class="header-left">
        <div class="breadcrumb-nav mb-1">
          <NuxtLink to="/admin/users" class="breadcrumb-link">← Kembali ke Manajemen Pengguna</NuxtLink>
        </div>
        <h1 class="page-title">Persetujuan Pengecer (PG-07)</h1>
        <p class="page-subtitle">
          Verifikasi calon pendaftar warung/pengecer LPG 3kg sebelum diberikan akses pemesanan.
        </p>
      </div>

      <div class="header-actions">
        <div class="counter-badge" :class="{ 'has-pending': totalPendingCount > 0 }">
          <span class="counter-dot"></span>
          <span class="counter-text">
            <strong>{{ totalPendingCount }}</strong> Pendaftaran Menunggu
          </span>
        </div>
      </div>
    </div>

    <!-- Alert Edukasi PRD -->
    <div class="info-callout mb-6">
      <div class="callout-icon">💡</div>
      <div class="callout-text">
        <strong>Aturan Bisnis PRD:</strong> Akun pengecer baru mandiri berstatus <code>PENDING</code> dan belum dapat melakukan pemesanan sampai diverifikasi dan disetujui Admin. Sesuai regulasi, sistem <em>tidak meminta atau menyimpan NIK/KTP</em>.
      </div>
    </div>

    <!-- Toolbar: Search & Filter -->
    <div class="toolbar-card mb-6">
      <div class="toolbar-search">
        <BaseInput
          v-model="searchQuery"
          placeholder="Cari nama warung, nama penanggung jawab, atau username..."
          size="md"
        />
      </div>

      <div class="toolbar-filter">
        <label for="status-filter" class="filter-label">Filter Status:</label>
        <select id="status-filter" v-model="selectedStatusFilter" class="filter-select">
          <option value="PENDING">Hanya Menunggu Persetujuan</option>
          <option value="REJECTED">Ditolak Sebelumnya</option>
          <option value="ALL">Semua Riwayat Registrasi</option>
        </select>
      </div>
    </div>

    <!-- Konten Utama: Tabel Desktop & Kartu Mobile -->
    <div class="table-card">
      <div v-if="paginatedList.length > 0">
        <!-- Desktop Table -->
        <div class="table-responsive hide-mobile">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usaha & Penanggung Jawab</th>
                <th>Username</th>
                <th>Kontak & Email</th>
                <th>Waktu Pendaftaran</th>
                <th>Status</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedList" :key="user.id">
                <td>
                  <div class="user-cell">
                    <strong class="business-title">{{ user.business_name || 'Tanpa Nama Usaha' }}</strong>
                    <span class="person-name">{{ user.name }}</span>
                  </div>
                </td>
                <td>
                  <code class="username-code">@{{ user.username }}</code>
                </td>
                <td>
                  <div class="contact-cell">
                    <span class="contact-phone">📞 {{ user.contact }}</span>
                    <span v-if="user.email" class="contact-email">✉️ {{ user.email }}</span>
                    <span v-else class="text-muted text-xs">-</span>
                  </div>
                </td>
                <td>
                  <span class="date-text">{{ formatDateTime(user.created_at) }}</span>
                </td>
                <td>
                  <StatusBadge :status="user.status" />
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      title="Lihat Detail Pendaftar"
                      @click="openDetail(user)"
                    >
                      Detail
                    </BaseButton>

                    <template v-if="user.status === 'PENDING'">
                      <BaseButton
                        variant="primary"
                        size="sm"
                        title="Setujui pendaftaran"
                        @click="promptApprove(user)"
                      >
                        Setujui
                      </BaseButton>
                      <BaseButton
                        variant="secondary"
                        size="sm"
                        title="Tolak pendaftaran"
                        @click="promptReject(user)"
                      >
                        Tolak
                      </BaseButton>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div class="mobile-card-list hide-desktop">
          <div v-for="user in paginatedList" :key="user.id" class="retailer-mobile-card">
            <div class="card-header-row">
              <div>
                <h3 class="m-card-title">{{ user.business_name || user.name }}</h3>
                <span class="m-card-subtitle">{{ user.name }} • <code class="text-xs">@{{ user.username }}</code></span>
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
                <span class="m-info-label">Terdaftar:</span>
                <span class="m-info-value">{{ formatDateTime(user.created_at) }}</span>
              </div>
              <div v-if="user.rejection_reason" class="m-info-item text-danger">
                <span class="m-info-label">Alasan Tolak:</span>
                <span class="m-info-value">{{ user.rejection_reason }}</span>
              </div>
            </div>

            <div class="card-actions-row">
              <BaseButton
                variant="secondary"
                size="sm"
                block
                @click="openDetail(user)"
              >
                Detail
              </BaseButton>

              <template v-if="user.status === 'PENDING'">
                <BaseButton
                  variant="primary"
                  size="sm"
                  block
                  @click="promptApprove(user)"
                >
                  Setujui
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  block
                  class="btn-danger-ghost"
                  @click="promptReject(user)"
                >
                  Tolak
                </BaseButton>
              </template>
            </div>
          </div>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-footer">
          <PaginationNav
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="pendingRetailers.length"
            :page-size="pageSize"
            @update:page="currentPage = $event"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="p-8">
        <EmptyState
          v-if="searchQuery"
          title="Pendaftar Tidak Ditemukan"
          :description="`Tidak ada pendaftar dengan kata kunci &quot;${searchQuery}&quot;.`"
          action-label="Reset Pencarian"
          @action="searchQuery = ''; selectedStatusFilter = 'PENDING'"
        />
        <EmptyState
          v-else
          title="Tidak Ada Pendaftaran Menunggu"
          description="Semua permohonan pendaftaran akun pengecer baru telah selesai diverifikasi."
        />
      </div>
    </div>

    <!-- MODAL 1: Detail Pendaftar -->
    <BaseModal
      :is-open="isDetailOpen"
      title="Detail Calon Pengecer"
      max-width="560px"
      @close="isDetailOpen = false"
    >
      <div v-if="selectedUser" class="detail-body">
        <div class="detail-header-card">
          <div class="detail-avatar">🏪</div>
          <div>
            <h3 class="detail-business-name">{{ selectedUser.business_name || 'Tanpa Nama Usaha' }}</h3>
            <p class="detail-owner-name">Penanggung Jawab: {{ selectedUser.name }}</p>
          </div>
          <div class="ml-auto">
            <StatusBadge :status="selectedUser.status" />
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID Akun</span>
            <span class="detail-val"><code>{{ selectedUser.id }}</code></span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Username Sistem</span>
            <span class="detail-val"><code>@{{ selectedUser.username }}</code></span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Nomor WhatsApp / HP</span>
            <span class="detail-val">📞 {{ selectedUser.contact }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Alamat Email</span>
            <span class="detail-val">{{ selectedUser.email ? '✉️ ' + selectedUser.email : 'Tidak dicantumkan' }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Waktu Pengajuan</span>
            <span class="detail-val">{{ formatDateTime(selectedUser.created_at) }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Hak Akses</span>
            <span class="detail-val">Pengecer B2B (Order Gas LPG 3kg)</span>
          </div>
        </div>

        <div v-if="selectedUser.rejection_reason" class="rejection-box mt-4">
          <strong class="text-danger">Catatan Alasan Penolakan:</strong>
          <p class="mt-1 text-sm">{{ selectedUser.rejection_reason }}</p>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" @click="isDetailOpen = false">
            Tutup
          </BaseButton>

          <template v-if="selectedUser && selectedUser.status === 'PENDING'">
            <BaseButton
              variant="secondary"
              class="btn-danger-ghost"
              @click="promptReject(selectedUser)"
            >
              Tolak Pendaftaran
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="promptApprove(selectedUser)"
            >
              Setujui Akun
            </BaseButton>
          </template>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 2: Konfirmasi Persetujuan -->
    <BaseModal
      :is-open="isApproveModalOpen"
      title="Konfirmasi Persetujuan Pengecer"
      max-width="480px"
      @close="isApproveModalOpen = false"
    >
      <div v-if="userToApprove" class="confirm-content">
        <div class="confirm-icon-box success-icon-box">✓</div>
        <h4 class="confirm-title">Setujui Pendaftaran Akun Pengecer?</h4>
        <p class="confirm-desc">
          Anda akan menyetujui akun pengecer berikut:
        </p>

        <div class="summary-card">
          <div class="summary-row">
            <span class="s-label">Nama Usaha:</span>
            <strong class="s-val">{{ userToApprove.business_name || '-' }}</strong>
          </div>
          <div class="summary-row">
            <span class="s-label">Pemilik:</span>
            <span class="s-val">{{ userToApprove.name }}</span>
          </div>
          <div class="summary-row">
            <span class="s-label">Username:</span>
            <code class="s-val">@{{ userToApprove.username }}</code>
          </div>
          <div class="summary-row">
            <span class="s-label">Kontak:</span>
            <span class="s-val">{{ userToApprove.contact }}</span>
          </div>
        </div>

        <p class="confirm-note text-sm text-muted mt-3">
          Setelah disetujui, akun pengecer akan langsung berstatus <strong>AKTIF</strong> dan dapat segera masuk ke aplikasi untuk memesan kuota LPG 3kg.
        </p>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingApprove" @click="isApproveModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="isSubmittingApprove"
            @click="handleConfirmApprove"
          >
            Ya, Setujui Akun
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 3: Konfirmasi Penolakan dengan Alasan Wajib -->
    <BaseModal
      :is-open="isRejectModalOpen"
      title="Konfirmasi Penolakan Pendaftaran"
      max-width="500px"
      @close="isRejectModalOpen = false"
    >
      <div v-if="userToReject" class="confirm-content">
        <div class="confirm-icon-box danger-icon-box">⚠️</div>
        <h4 class="confirm-title">Tolak Pendaftaran Pengecer?</h4>
        <p class="confirm-desc">
          Akun <strong>{{ userToReject.business_name || userToReject.name }}</strong> (<code>@{{ userToReject.username }}</code>) akan ditolak dan tidak diizinkan masuk ke sistem pemesanan.
        </p>

        <div class="mt-4">
          <BaseTextarea
            v-model="rejectReason"
            label="Alasan Penolakan Pendaftaran"
            placeholder="Contoh: Lokasi warung di luar jangkauan wilayah distribusi pangkalan, atau kontak tidak dapat dihubungi saat verifikasi..."
            :rows="3"
            :error-text="rejectError"
            helper-text="Alasan wajib diisi sebagai catatan audit internal dan informasi bagi pendaftar."
            required
          />
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingReject" @click="isRejectModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton
            variant="danger"
            :loading="isSubmittingReject"
            @click="handleConfirmReject"
          >
            Tolak Pendaftaran
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
    align-items: flex-end;
    justify-content: space-between;
  }
}

.breadcrumb-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
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

.counter-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.counter-badge.has-pending {
  border-color: #f59e0b;
  background-color: #fffbeb;
  color: #b45309;
}

.counter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #94a3b8;
}

.counter-badge.has-pending .counter-dot {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.info-callout {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #1e40af;
}

.callout-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
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

.business-title {
  color: var(--color-navy);
  font-size: var(--font-size-sm);
}

.person-name {
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

.retailer-mobile-card {
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
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.btn-danger-ghost {
  color: #dc2626 !important;
  border-color: #fecaca !important;
}

.btn-danger-ghost:hover {
  background-color: #fef2f2 !important;
}

.pagination-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Modals */
.detail-header-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: #f8fafc;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.detail-avatar {
  font-size: 28px;
}

.detail-business-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-navy);
  margin: 0;
}

.detail-owner-name {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.detail-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-bottom: 2px;
}

.detail-val {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-navy);
}

.rejection-box {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.confirm-content {
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
  margin-bottom: var(--space-4);
}

.summary-card {
  text-align: left;
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
}

.s-label {
  color: var(--color-muted);
}

.modal-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}
</style>
