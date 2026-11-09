<script setup lang="ts">
import type { Product } from '~/types/models'

definePageMeta({
  layout: 'admin'
})

const { showSuccess, showInfo } = useNotification()
const { api } = useApi()
const dashboard = ref<any>(null)
const orders = ref<any[]>([])
async function refreshDashboard() {
  dashboard.value = await api('/dashboard')
  const queue = await api<{ items: any[] }>('/orders?limit=8')
  orders.value = queue.items
}
onMounted(() => refreshDashboard())

// Ringkasan KPI dummy sesuai spesifikasi PRD PG-04
const kpiStats = computed(() => [
  {
    title: 'Stok Tersedia Dipesan',
    value: `${dashboard.value?.inventory?.reduce((sum: number, p: Product) => sum + (p.available_qty || 0), 0) ?? 0} tabung`,
    sub: `Total fisik ${dashboard.value?.inventory?.reduce((sum: number, p: Product) => sum + (p.full_qty || 0), 0) ?? 0} - reserved ${dashboard.value?.inventory?.reduce((sum: number, p: Product) => sum + (p.reserved_qty || 0), 0) ?? 0}`,
    icon: '📦',
    variant: 'info'
  },
  {
    title: 'Pesanan Menunggu',
    value: `${dashboard.value?.pending_orders ?? 0} pesanan`,
    sub: 'Memerlukan konfirmasi segera',
    icon: '⏳',
    variant: 'warning'
  },
  {
    title: 'Penjualan Hari Ini',
    value: formatRupiah(Number(dashboard.value?.sales_today || 0)),
    sub: 'Omzet penjualan (Tunai & Bon)',
    icon: '💰',
    variant: 'success'
  },
  {
    title: 'Total Piutang Usaha',
    value: formatRupiah(Number(dashboard.value?.total_receivables || 0)),
    sub: 'Saldo bon belum lunas',
    icon: '📑',
    variant: 'danger'
  }
])
</script>

<template>
  <div class="admin-preview">
    <!-- Page Header -->
    <div class="page-top-bar">
      <div>
        <h1 class="page-heading">Dashboard Admin / Pemilik (Preview)</h1>
        <p class="page-subheading">Ringkasan kondisi usaha, ketersediaan stok, pesanan aktif, dan piutang pangkalan.</p>
      </div>

      <div class="top-actions">
        <BaseButton variant="secondary" size="sm" @click="navigateTo('/preview-components')">
          🎨 Galeri Komponen
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="refreshDashboard().then(() => showSuccess('Data dashboard disinkronkan!'))">
          🔄 Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Alert Stok Minimum jika ada produk menipis -->
    <div v-if="dashboard?.inventory?.some((p: Product) => p.low_stock)" class="alert-banner">
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <strong>Peringatan Stok Minimum:</strong>
        <span>{{ dashboard.inventory.filter((p: Product) => p.low_stock).map((p: Product) => `${p.name}: ${p.available_qty} tabung`).join(', ') }}</span>
      </div>
    </div>

    <!-- KPI Stat Cards -->
    <div class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-4 mb-6">
      <div v-for="stat in kpiStats" :key="stat.title" class="stat-card">
        <div class="stat-top">
          <span class="stat-title">{{ stat.title }}</span>
          <span class="stat-icon">{{ stat.icon }}</span>
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-sub">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- Quick Actions Banner -->
    <BaseCard title="Aksi Cepat Operasional" subtitle="Jalan pintas ke alur tugas penting pangkalan" class="mb-6">
      <div class="flex flex-wrap gap-3">
        <BaseButton variant="primary" size="sm" @click="navigateTo('/admin/inventory/receipts')">
          🚚 Catat Pasokan Agen
        </BaseButton>
        <BaseButton v-if="false" variant="secondary" size="sm" @click="showInfo('Simulasi navigasi ke Penjualan Langsung')">
          ⚡ Penjualan Langsung Tunai
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="navigateTo('/admin/inventory/adjustments')">
          ⚙️ Koreksi Stok Fisik
        </BaseButton>
        <BaseButton v-if="false" variant="secondary" size="sm" @click="showInfo('Simulasi navigasi ke Pembayaran Bon')">
          💰 Catat Pembayaran Bon
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Table Preview: Pesanan Terbaru -->
    <BaseCard title="Pesanan Terbaru Membutuhkan Tindakan" subtitle="Daftar pengajuan pesanan masuk dari pengecer mitra">
      <BaseTable>
        <template #head>
          <tr>
            <th>Nomor Order</th>
            <th>Pengecer</th>
            <th>Waktu Pengajuan</th>
            <th class="text-right">Total Nota</th>
            <th>Status</th>
            <th class="text-right">Aksi</th>
          </tr>
        </template>

        <tr v-for="ord in orders" :key="ord.id">
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
              @click="navigateTo(`/admin/orders/${ord.id}`)"
            >
              Proses Order
            </BaseButton>
            <BaseButton
              v-else
              variant="ghost"
              size="sm"
              @click="navigateTo(`/admin/orders/${ord.id}`)"
            >
              Rincian
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

/* Alert banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-sm);
  color: #7c4404;
}

.alert-icon {
  font-size: 20px;
}

/* Stat Card */
.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.stat-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary-900);
  line-height: 1.1;
  margin-bottom: var(--space-1);
}

.stat-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>

