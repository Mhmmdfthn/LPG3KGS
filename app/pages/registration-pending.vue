<script setup lang="ts">
import type { User } from '~/types/models'

definePageMeta({
  layout: 'default'
})

const { lastRegisteredUser } = useAuth()

// Ambil akun pendaftar terbaru atau fallback ke sampel akun pending
const pendingUser = computed<User>(() => {
  return lastRegisteredUser.value || {
    id: '',
    username: '',
    name: '',
    business_name: '',
    contact: '',
    role: 'pengecer',
    status: 'PENDING',
    created_at: new Date().toISOString()
  }
})

function tryLoginPending() {
  navigateTo('/login')
}
</script>

<template>
  <div class="pending-wrapper container">
    <div class="pending-card">
      <div class="pending-icon" aria-hidden="true">⏳</div>

      <div class="status-badge-wrap">
        <StatusBadge status="PENDING" label="STATUS: MENUNGGU PERSETUJUAN" size="md" />
      </div>

      <h2 class="pending-title">Pengajuan Pendaftaran Diterima</h2>
      <p class="pending-message">
        Data akun usaha Anda telah berhasil dikirim ke antrean sistem. Saat ini akun berstatus <strong>Menunggu Persetujuan</strong> dari Admin Pangkalan.
      </p>

      <!-- Ringkasan Akun yang Didaftarkan -->
      <div class="account-summary-card">
        <h4 class="summary-card-title">Rincian Data Pendaftaran:</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Nama Penanggung Jawab:</span>
            <span class="summary-val">{{ pendingUser.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Nama Usaha / Warung:</span>
            <span class="summary-val">{{ pendingUser.business_name || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Username Akun:</span>
            <span class="summary-val font-mono font-bold">{{ pendingUser.username }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Nomor Kontak / WhatsApp:</span>
            <span class="summary-val">{{ pendingUser.contact }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Alamat Email:</span>
            <span class="summary-val">{{ pendingUser.email || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Waktu Pengajuan:</span>
            <span class="summary-val">{{ formatDateTime(pendingUser.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Informasi Aturan Operasional PRD -->
      <div class="info-box">
        <h4 class="info-box-title">Ketentuan Akun Pengecer Baru:</h4>
        <ul class="info-list">
          <li>Admin pangkalan akan meninjau dan memverifikasi kontak usaha Anda.</li>
          <li><strong>Akun pending belum dapat melakukan pemesanan gas LPG</strong> atau melihat alokasi stok sampai disetujui oleh Admin.</li>
          <li>Setelah disetujui, status akun otomatis berubah menjadi <strong>AKTIF</strong> dan Anda dapat masuk ke katalog pemesanan menggunakan username dan kata sandi yang telah didaftarkan.</li>
        </ul>
      </div>

      <div class="pending-actions">
        <NuxtLink to="/login">
          <BaseButton variant="primary">
            Kembali ke Halaman Masuk
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/">
          <BaseButton variant="secondary">
            Halaman Utama
          </BaseButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  min-height: calc(100vh - var(--header-height) - 100px);
}

.pending-card {
  width: 100%;
  max-width: 580px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  text-align: center;
}

@media (min-width: 640px) {
  .pending-card {
    padding: var(--space-8);
  }
}

.pending-icon {
  font-size: 48px;
  margin-bottom: var(--space-2);
}

.status-badge-wrap {
  margin-bottom: var(--space-3);
}

.pending-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin-bottom: var(--space-2);
}

.pending-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-5);
}

/* Account summary */
.account-summary-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: left;
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-xs);
}

.summary-card-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary-900);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
  gap: var(--space-1);
}

.summary-label {
  color: var(--color-text-muted);
}

.summary-val {
  color: var(--color-text);
}

/* Info box */
.info-box {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: left;
  margin-bottom: var(--space-6);
}

.info-box-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.info-list {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-left: var(--space-4);
  line-height: var(--line-height-normal);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pending-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
</style>
