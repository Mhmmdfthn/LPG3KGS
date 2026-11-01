<script setup lang="ts">
import { formatRupiah, formatQuantity, formatDateTime } from '~/composables/useFormatters'

definePageMeta({
  layout: 'retailer'
})

const route = useRoute()
const orderId = computed(() => String(route.params.id))

const { getOrderById } = useMockOrders()
const { currentUser } = useMockAuth()

// Ambil data order berdasarkan ID atau number
const order = computed(() => getOrderById(orderId.value))

// Validasi hak akses kepemilikan pesanan (PRD Rule)
const isAuthorized = computed(() => {
  if (!order.value) return false
  const currentRetailerId = currentUser.value?.id ?? 'usr-ret-01'
  return order.value.retailer_id === currentRetailerId
})

// Timeline Status helper
const statusSteps = [
  { key: 'MENUNGGU_KONFIRMASI', label: 'Pengajuan', icon: '📝' },
  { key: 'DIKONFIRMASI', label: 'Dikonfirmasi', icon: '👍' },
  { key: 'SELESAI', label: 'Selesai', icon: '🎉' }
]

function getStepState(stepKey: string, currentStatus: string) {
  if (currentStatus === 'DITOLAK' || currentStatus === 'DIBATALKAN') {
    if (stepKey === 'MENUNGGU_KONFIRMASI') return 'completed'
    return 'disabled'
  }

  const orderFlow = ['MENUNGGU_KONFIRMASI', 'DIKONFIRMASI', 'SELESAI']
  const currentIndex = orderFlow.indexOf(currentStatus)
  const stepIndex = orderFlow.indexOf(stepKey)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}
</script>

<template>
  <div class="retailer-order-detail-page">
    <!-- Breadcrumb / Back Navigation -->
    <div class="nav-back-row">
      <NuxtLink to="/retailer/orders" class="back-link">
        ← Kembali ke Daftar Pesanan
      </NuxtLink>
    </div>

    <!-- Error State: Order Not Found or Unauthorized -->
    <div v-if="!order || !isAuthorized" class="error-wrapper">
      <ErrorState
        title="Pesanan Tidak Ditemukan"
        description="Pesanan tidak ditemukan atau Anda tidak memiliki hak akses untuk melihat rincian pesanan ini."
      >
        <template #actions>
          <NuxtLink to="/retailer/orders">
            <BaseButton variant="primary">Kembali ke Riwayat Pesanan Saya</BaseButton>
          </NuxtLink>
        </template>
      </ErrorState>
    </div>

    <!-- Order Detail Content -->
    <div v-else class="order-detail-layout">
      <!-- Main Content Area -->
      <div class="detail-main-col">
        <!-- Order Header Card -->
        <div class="order-header-card">
          <div class="header-top-row">
            <div>
              <span class="order-badge">PESANAN PENGECER</span>
              <h1 class="order-number-title">{{ order.number }}</h1>
              <span class="order-timestamp">
                Diajukan pada: {{ formatDateTime(order.created_at) }}
              </span>
            </div>

            <StatusBadge :status="order.status" size="md" />
          </div>

          <!-- Alert Khusus Status Ditolak / Dibatalkan -->
          <div v-if="order.status === 'DITOLAK'" class="rejection-alert">
            <div class="alert-title">❌ Pesanan Ditolak oleh Pangkalan</div>
            <p class="alert-reason">
              <strong>Alasan:</strong> {{ order.rejection_reason || 'Tidak ada alasan khusus yang dicantumkan.' }}
            </p>
          </div>

          <div v-if="order.status === 'DIBATALKAN'" class="cancellation-alert">
            <div class="alert-title">⚠️ Pesanan Dibatalkan</div>
            <p class="alert-reason">
              <strong>Alasan:</strong> {{ order.cancellation_reason || 'Pesanan dibatalkan oleh pihak pangkalan.' }}
            </p>
          </div>

          <div v-if="order.status === 'SELESAI' && order.sale_number" class="sale-completed-banner">
            <span class="sale-icon">🧾</span>
            <div>
              <div class="sale-lbl">Nomor Penjualan Resmi:</div>
              <strong class="sale-val">{{ order.sale_number }}</strong>
            </div>
          </div>

          <!-- Timeline Stepper (Visual Progress) -->
          <div class="stepper-wrap">
            <div
              v-for="step in statusSteps"
              :key="step.key"
              :class="['stepper-item', getStepState(step.key, order.status)]"
            >
              <div class="step-circle">
                <span v-if="getStepState(step.key, order.status) === 'completed'">✓</span>
                <span v-else>{{ step.icon }}</span>
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <!-- Products Table Card -->
        <div class="items-card">
          <h2 class="card-section-title">Rincian Tabung Gas yang Dipesan</h2>

          <!-- Desktop & Tablet Table -->
          <div class="table-wrap hide-mobile">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th class="text-right">Harga Satuan</th>
                  <th class="text-center">Kuantitas</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.product_id">
                  <td>
                    <div class="item-name-cell">
                      <span class="size-pill">{{ item.size_kg }} kg</span>
                      <strong class="item-title">{{ item.product_name }}</strong>
                    </div>
                  </td>
                  <td class="text-right">{{ formatRupiah(item.unit_price) }}</td>
                  <td class="text-center font-bold">{{ formatQuantity(item.quantity) }}</td>
                  <td class="text-right text-primary font-bold">
                    {{ formatRupiah(item.subtotal) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-items-list hide-desktop">
            <div
              v-for="item in order.items"
              :key="item.product_id"
              class="mobile-item-card"
            >
              <div class="mobile-item-header">
                <span class="size-pill">{{ item.size_kg }} kg</span>
                <span class="mobile-item-name">{{ item.product_name }}</span>
              </div>
              <div class="mobile-item-body">
                <div class="detail-kv">
                  <span>Harga Satuan:</span>
                  <strong>{{ formatRupiah(item.unit_price) }}</strong>
                </div>
                <div class="detail-kv">
                  <span>Kuantitas:</span>
                  <strong>{{ formatQuantity(item.quantity) }}</strong>
                </div>
                <div class="detail-kv subtotal-kv">
                  <span>Subtotal:</span>
                  <strong class="text-primary">{{ formatRupiah(item.subtotal) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status History Log Card -->
        <div class="history-card">
          <h2 class="card-section-title">Riwayat Perjalanan Pesanan</h2>

          <div v-if="order.history && order.history.length > 0" class="history-timeline">
            <div
              v-for="(hist, idx) in order.history"
              :key="idx"
              class="timeline-event"
            >
              <div class="timeline-dot" />
              <div class="timeline-body">
                <div class="timeline-header">
                  <StatusBadge :status="hist.status" size="sm" />
                  <span class="timeline-time">{{ formatDateTime(hist.timestamp) }}</span>
                </div>
                <p class="timeline-note">{{ hist.note || 'Status pesanan diperbarui.' }}</p>
                <span v-if="hist.actor" class="timeline-actor">Petugas: {{ hist.actor }}</span>
              </div>
            </div>
          </div>

          <div v-else class="text-sm text-muted">
            Belum ada riwayat aktivitas lanjutan.
          </div>
        </div>
      </div>

      <!-- Sidebar Column: Summary & Info -->
      <div class="detail-sidebar-col">
        <div class="summary-card">
          <h2 class="card-section-title">Ringkasan Pembayaran</h2>

          <div class="summary-lines">
            <div class="summary-line">
              <span class="lbl">Total Kuantitas</span>
              <span class="val">
                {{ formatQuantity(order.items.reduce((s, it) => s + it.quantity, 0)) }}
              </span>
            </div>
            <div class="summary-line">
              <span class="lbl">Jenis Produk</span>
              <span class="val">{{ order.items.length }} macam</span>
            </div>
            <hr class="summary-hr" />
            <div class="summary-line total-line">
              <span class="lbl-total">Total Tagihan</span>
              <span class="val-total">{{ formatRupiah(order.total) }}</span>
            </div>
          </div>

          <!-- Retailer Info Box -->
          <div class="info-box">
            <h3 class="info-box-title">Identitas Pemesan:</h3>
            <div class="info-row">
              <span class="info-k">Nama Usaha:</span>
              <span class="info-v">{{ order.business_name || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-k">Penanggung Jawab:</span>
              <span class="info-v">{{ order.retailer_name }}</span>
            </div>
          </div>

          <!-- Guidance Note -->
          <div class="guidance-box">
            <p class="guidance-title">ℹ️ Catatan Pengambilan Tabung:</p>
            <p class="guidance-text">
              Serah-terima tabung gas dilakukan langsung di pangkalan resmi. Pastikan membawa tabung
              kosong dalam jumlah yang cukup saat pengambilan barang.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retailer-order-detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.nav-back-row {
  margin-bottom: var(--space-1);
}

.back-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary-700);
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  text-decoration: underline;
}

.error-wrapper {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-4);
}

/* Layout Grid */
.order-detail-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 960px) {
  .order-detail-layout {
    flex-direction: row;
    align-items: flex-start;
  }
}

.detail-main-col {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detail-sidebar-col {
  width: 100%;
}

@media (min-width: 960px) {
  .detail-sidebar-col {
    width: 330px;
    flex-shrink: 0;
  }
}

/* Header Card */
.order-header-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.order-badge {
  font-size: 10px;
  font-weight: 800;
  color: var(--color-text-subtle);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.order-number-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin: 2px 0 4px;
}

.order-timestamp {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Stepper Progress Bar */
.stepper-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: var(--space-3) 0 var(--space-1);
}

.stepper-wrap::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 30px;
  right: 30px;
  height: 2px;
  background-color: var(--color-border);
  z-index: 1;
}

.stepper-item {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface-subtle);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.step-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
}

.stepper-item.completed .step-circle {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: #ffffff;
}

.stepper-item.completed .step-label {
  color: var(--color-success);
}

.stepper-item.current .step-circle {
  background-color: var(--color-primary-700);
  border-color: var(--color-primary-700);
  color: #ffffff;
}

.stepper-item.current .step-label {
  color: var(--color-primary-900);
  font-weight: 800;
}

.stepper-item.disabled {
  opacity: 0.4;
}

/* Alerts */
.rejection-alert {
  background-color: #fee2e2;
  border-left: 4px solid var(--color-danger);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: #991b1b;
}

.cancellation-alert {
  background-color: #f3f4f6;
  border-left: 4px solid var(--color-text-subtle);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.sale-completed-banner {
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-left: 4px solid var(--color-success);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sale-icon {
  font-size: 20px;
}

.sale-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 700;
}

.sale-val {
  font-size: var(--font-size-sm);
  color: #065f46;
}

.alert-title {
  font-weight: 700;
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.alert-reason {
  font-size: var(--font-size-xs);
  margin: 0;
}

/* Cards Common */
.items-card,
.history-card,
.summary-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
}

.card-section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

/* Table */
.table-wrap {
  overflow-x: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.detail-table th {
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
}

.detail-table td {
  padding: var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.item-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.size-pill {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.item-title {
  color: var(--color-text);
}

/* Mobile Item Cards */
.mobile-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mobile-item-card {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.mobile-item-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.mobile-item-name {
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.mobile-item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-kv {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.subtotal-kv {
  padding-top: 4px;
  border-top: 1px dashed var(--color-border);
}

/* Timeline */
.history-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: relative;
  padding-left: var(--space-4);
}

.history-timeline::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 7px;
  width: 2px;
  background-color: var(--color-border);
}

.timeline-event {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  position: relative;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-700);
  border: 2px solid var(--color-surface);
  position: absolute;
  left: -13px;
  top: 4px;
}

.timeline-body {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  flex: 1 1 auto;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 11px;
  color: var(--color-text-muted);
}

.timeline-note {
  font-size: var(--font-size-xs);
  color: var(--color-text);
  margin: 0 0 2px;
}

.timeline-actor {
  font-size: 10px;
  color: var(--color-text-subtle);
  font-style: italic;
}

/* Summary Card */
.summary-lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.summary-hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.total-line {
  padding-top: var(--space-1);
}

.lbl-total {
  font-weight: 700;
  font-size: var(--font-size-md);
}

.val-total {
  font-weight: 800;
  font-size: var(--font-size-xl);
  color: var(--color-primary-700);
}

.info-box {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--font-size-xs);
  margin-top: var(--space-4);
}

.info-box-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin: 0 0 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-k {
  color: var(--color-text-muted);
}

.info-v {
  font-weight: 600;
}

.guidance-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-4);
}

.guidance-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 4px;
}

.guidance-text {
  font-size: 11px;
  color: #1e3a8a;
  line-height: 1.4;
  margin: 0;
}

.hide-mobile {
  display: none;
}
.hide-desktop {
  display: block;
}

@media (min-width: 640px) {
  .hide-mobile {
    display: block;
  }
  .hide-desktop {
    display: none;
  }
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.font-bold {
  font-weight: 700;
}
.text-primary {
  color: var(--color-primary-700);
}
</style>

