<script setup lang="ts">

definePageMeta({
  layout: 'staff'
})

const { showSuccess, showInfo } = useNotification()
const { api } = useApi()
const allOrders = ref<any[]>([])
onMounted(async () => { allOrders.value = (await api<{ items: any[] }>('/orders?limit=100')).items })

// Filter pesanan yang butuh tindakan operasional
const pendingOrders = computed(() => allOrders.value.filter(o => o.status === 'MENUNGGU_KONFIRMASI' || o.status === 'DIKONFIRMASI'))
</script>

<template>
  <div class="staff-preview">
    <!-- Page Header -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Dashboard Karyawan Operasional (Preview)</h1>
        <p class="page-subheading">Menu tugas harian pencatatan pesanan, penerimaan pasokan, dan serah-terima fisik.</p>
      </div>

      <div class="top-actions">
        <BaseButton variant="secondary" size="sm" @click="navigateTo('/preview-components')">
          🎨 Galeri Komponen
        </BaseButton>
      </div>
    </div>

    <!-- Role Scope Banner -->
    <div class="info-scope-banner">
      <div class="scope-icon">ℹ️</div>
      <div class="scope-text">
        <strong>Hak Akses Terbatas Karyawan:</strong>
        Anda dapat memproses pesanan masuk, mencatat pasokan agen, dan membuat penjualan langsung. Pengaturan harga, akun, koreksi stok, dan laporan keuangan agregat hanya dapat diakses oleh Admin.
      </div>
    </div>

    <!-- Operational Task Cards -->
    <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-4 mb-6">
      <div class="action-card" @click="navigateTo('/staff/orders')">
        <div class="action-icon">📥</div>
        <h3 class="action-title">Pesanan Masuk</h3>
        <p class="action-desc">Konfirmasi atau selesaikan serah terima barang pesanan pengecer.</p>
        <span class="action-link">Buka Antrean →</span>
      </div>

      <div v-if="false" class="action-card" @click="showInfo('Buka form penjualan langsung')">
        <div class="action-icon">⚡</div>
        <h3 class="action-title">Penjualan Langsung</h3>
        <p class="action-desc">Catat pembelian tunai oleh masyarakat umum tanpa akun pengecer.</p>
        <span class="action-link">Buka Form Kasir →</span>
      </div>

      <div class="action-card" @click="navigateTo('/staff/inventory/receipts')">
        <div class="action-icon">🚚</div>
        <h3 class="action-title">Catat Pasokan Agen</h3>
        <p class="action-desc">Catat tabung isi masuk dan tabung kosong yang dikembalikan ke truk agen.</p>
        <span class="action-link">Input Pasokan →</span>
      </div>

      <div v-if="false" class="action-card" @click="showInfo('Buka pencarian tagihan bon')">
        <div class="action-icon">💰</div>
        <h3 class="action-title">Pencatatan Bon</h3>
        <p class="action-desc">Cari nomor transaksi atau nama pengecer untuk mencatat cicilan/pelunasan.</p>
        <span class="action-link">Cari Tagihan →</span>
      </div>
    </div>

    <!-- Operational Queue: Active Orders -->
    <BaseCard title="Antrean Pesanan Aktif Hari Ini" subtitle="Daftar order yang membutuhkan serah-terima fisik atau konfirmasi">
      <BaseTable>
        <template #head>
          <tr>
            <th>Nomor Order</th>
            <th>Pengecer</th>
            <th>Waktu</th>
            <th class="text-right">Total</th>
            <th>Status</th>
            <th class="text-right">Aksi Operasional</th>
          </tr>
        </template>

        <tr v-for="ord in pendingOrders" :key="ord.id">
          <td><strong>{{ ord.number }}</strong></td>
          <td>
            <div>{{ ord.business_name }}</div>
            <small class="text-muted">{{ ord.retailer_name }}</small>
          </td>
          <td>{{ formatDateTime(ord.created_at) }}</td>
          <td class="text-right font-semibold">{{ formatRupiah(ord.total) }}</td>
          <td><StatusBadge :status="ord.status" /></td>
          <td class="text-right">
            <BaseButton
              v-if="ord.status === 'MENUNGGU_KONFIRMASI'"
              variant="primary"
              size="sm"
              @click="navigateTo(`/staff/orders/${ord.id}`)"
            >
              Konfirmasi
            </BaseButton>
            <BaseButton
              v-else-if="ord.status === 'DIKONFIRMASI'"
              variant="success"
              size="sm"
              @click="navigateTo(`/staff/orders/${ord.id}`)"
            >
              Serah-Terima
            </BaseButton>
          </td>
        </tr>
      </BaseTable>
    </BaseCard>
  </div>
</template>

<style scoped>
.page-top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
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

.top-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Info banner */
.info-scope-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-sm);
  color: #174275;
  line-height: var(--line-height-normal);
}

.scope-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* Action Cards */
.action-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.action-card:hover {
  border-color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: var(--space-3);
}

.action-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.action-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-normal);
  flex: 1 1 auto;
  margin-bottom: var(--space-4);
}

.action-link {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary-700);
}
</style>

