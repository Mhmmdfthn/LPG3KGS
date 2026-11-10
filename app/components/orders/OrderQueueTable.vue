<script setup lang="ts">
import { formatRupiah, formatQuantity, formatDateTime } from '~/composables/useFormatters'
import type { Order } from '~/types/orders'

interface Props {
  role: 'admin' | 'staff'
}

const props = defineProps<Props>()

const { orders, confirmOrder, rejectOrder } = useOrders()
const { getBalance } = useInventory()
const { currentUser } = useAuth()
const { showSuccess, showError } = useNotification()

const basePath = computed(() => (props.role === 'admin' ? '/admin/orders' : '/staff/orders'))

// ─── Filter & Search States ───────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref<string>('ALL')
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = 8

// Counter Pesanan Menunggu Konfirmasi
const pendingCount = computed(() =>
  orders.value.filter(o => o.status === 'MENUNGGU_KONFIRMASI').length
)

const confirmedCount = computed(() =>
  orders.value.filter(o => o.status === 'DIKONFIRMASI').length
)

const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    // Status Filter
    if (statusFilter.value !== 'ALL' && order.status !== statusFilter.value) {
      return false
    }

    // Date Range Filter
    if (dateFrom.value) {
      const from = new Date(dateFrom.value)
      from.setHours(0, 0, 0, 0)
      if (new Date(order.created_at) < from) return false
    }
    if (dateTo.value) {
      const to = new Date(dateTo.value)
      to.setHours(23, 59, 59, 999)
      if (new Date(order.created_at) > to) return false
    }

    // Search Query (Nomor pesanan, nama pengecer, nama usaha)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchNum = order.number.toLowerCase().includes(q)
      const matchName = order.retailer_name.toLowerCase().includes(q)
      const matchBiz = order.business_name ? order.business_name.toLowerCase().includes(q) : false
      return matchNum || matchName || matchBiz
    }

    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / pageSize) || 1)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

watch([searchQuery, statusFilter, dateFrom, dateTo], () => {
  currentPage.value = 1
})

interface StatusTabItem {
  key: string
  label: string
  count?: number
}

const statusTabs = computed<StatusTabItem[]>(() => [
  { key: 'ALL', label: 'Semua Pesanan' },
  { key: 'MENUNGGU_KONFIRMASI', label: 'Menunggu', count: pendingCount.value },
  { key: 'DIKONFIRMASI', label: 'Dikonfirmasi', count: confirmedCount.value },
  { key: 'SELESAI', label: 'Selesai' },
  { key: 'DITOLAK', label: 'Ditolak' }
])

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  dateFrom.value = ''
  dateTo.value = ''
}

function formatProductSummary(items: Order['items']): string {
  if (items.length === 0) return '0 tabung'
  const first = items[0]
  if (!first) return '0 tabung'
  if (items.length === 1) {
    return `${first.quantity}x ${first.product_name}`
  }
  return `${first.quantity}x ${first.product_name} (+${items.length - 1} jenis lain)`
}

// ─── Modal Konfirmasi Cepat dari Antrean ───────────────────────────
const selectedOrderForAction = ref<Order | null>(null)
const isConfirmModalOpen = ref(false)
const isSubmittingConfirm = ref(false)

function openConfirmModal(order: Order) {
  selectedOrderForAction.value = order
  isConfirmModalOpen.value = true
}

async function handleConfirmSubmit() {
  if (!selectedOrderForAction.value) return
  isSubmittingConfirm.value = true
  try {
    const actor = currentUser.value?.username || (props.role === 'admin' ? 'admin' : 'petugas_ops')
    await confirmOrder(selectedOrderForAction.value.id, actor)
    showSuccess(
      `Pesanan ${selectedOrderForAction.value.number} berhasil dikonfirmasi! Stok berhasil dialokasikan.`,
      'Pesanan Dikonfirmasi'
    )
    isConfirmModalOpen.value = false
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal mengonfirmasi pesanan.')
  } finally {
    isSubmittingConfirm.value = false
  }
}
</script>

<template>
  <div class="order-queue-page">
    <!-- Header -->
    <div class="queue-header">
      <div>
        <h1 class="page-title">📥 Pesanan Masuk (Antrean Operasional)</h1>
        <p class="page-desc">
          Kelola pesanan dari seluruh pengecer resmi. Konfirmasi ketersediaan stok fisik dan lakukan serah-terima.
        </p>
      </div>

      <!-- Counter Badges -->
      <div class="header-badges">
        <div v-if="pendingCount > 0" class="counter-badge badge-pending">
          <span class="badge-icon">⏳</span>
          <div>
            <span class="badge-num">{{ pendingCount }}</span>
            <span class="badge-lbl">Menunggu Konfirmasi</span>
          </div>
        </div>
        <div v-if="confirmedCount > 0" class="counter-badge badge-confirmed">
          <span class="badge-icon">📦</span>
          <div>
            <span class="badge-num">{{ confirmedCount }}</span>
            <span class="badge-lbl">Siap Serah-Terima</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="filter-panel">
      <!-- Search & Status Tabs -->
      <div class="filter-top-row">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari nomor order (ORD-...), nama pengecer, atau nama warung..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-btn"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>

        <div class="status-tab-group">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            :class="['status-tab', { active: statusFilter === tab.key }]"
            type="button"
            @click="statusFilter = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count && tab.count > 0" class="tab-badge">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- Date Filters -->
      <div class="filter-bottom-row">
        <div class="date-field">
          <label class="field-label">Dari Tanggal:</label>
          <input v-model="dateFrom" type="date" class="date-input" />
        </div>
        <div class="date-field">
          <label class="field-label">Sampai Tanggal:</label>
          <input v-model="dateTo" type="date" class="date-input" />
        </div>
        <BaseButton
          v-if="searchQuery || statusFilter !== 'ALL' || dateFrom || dateTo"
          variant="ghost"
          size="sm"
          class="reset-btn"
          @click="resetFilters"
        >
          Reset Filter
        </BaseButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="empty-state-wrapper">
      <EmptyState
        title="Tidak Ada Pesanan Ditemukan"
        description="Belum ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda."
      >
        <template #actions>
          <BaseButton variant="secondary" size="sm" @click="resetFilters">
            Tampilkan Semua Pesanan
          </BaseButton>
        </template>
      </EmptyState>
    </div>

    <!-- Desktop Table View -->
    <div v-else class="table-card hide-mobile">
      <table class="queue-table">
        <thead>
          <tr>
            <th>Nomor Pesanan</th>
            <th>Waktu Diajukan</th>
            <th>Pengecer & Usaha</th>
            <th class="text-center">Jumlah Jenis</th>
            <th>Ringkasan Produk</th>
            <th class="text-right">Total Nilai</th>
            <th class="text-center">Status</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in paginatedOrders"
            :key="order.id"
            :class="{ 'row-highlight': order.status === 'MENUNGGU_KONFIRMASI' }"
          >
            <td>
              <NuxtLink :to="`${basePath}/${order.id}`" class="order-link">
                {{ order.number }}
              </NuxtLink>
            </td>
            <td class="text-xs text-muted">
              {{ formatDateTime(order.created_at) }}
            </td>
            <td>
              <div class="retailer-cell">
                <strong class="retailer-name">{{ order.retailer_name }}</strong>
                <span v-if="order.business_name" class="biz-name">{{ order.business_name }}</span>
              </div>
            </td>
            <td class="text-center">
              <span class="type-count-badge">{{ order.items.length }} jenis</span>
            </td>
            <td>
              <div class="items-summary-cell">
                <span class="summary-text">{{ formatProductSummary(order.items) }}</span>
                <span class="total-qty-sub text-muted">
                  (Total: {{ formatQuantity(order.items.reduce((s, it) => s + it.quantity, 0)) }})
                </span>
              </div>
            </td>
            <td class="text-right font-bold text-primary">
              {{ formatRupiah(order.total) }}
            </td>
            <td class="text-center">
              <StatusBadge :status="order.status" size="sm" />
            </td>
            <td class="text-right">
              <div class="actions-cell">
                <!-- Aksi Cepat Konfirmasi jika Menunggu -->
                <BaseButton
                  v-if="order.status === 'MENUNGGU_KONFIRMASI'"
                  variant="primary"
                  size="sm"
                  title="Konfirmasi Pesanan"
                  @click="openConfirmModal(order)"
                >
                  ✓ Konfirmasi
                </BaseButton>

                <NuxtLink :to="`${basePath}/${order.id}`">
                  <BaseButton variant="secondary" size="sm">
                    Detail →
                  </BaseButton>
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card List View -->
    <div class="mobile-queue-list hide-desktop">
      <div
        v-for="order in paginatedOrders"
        :key="order.id"
        :class="['mobile-order-card', { 'card-pending': order.status === 'MENUNGGU_KONFIRMASI' }]"
      >
        <div class="card-head">
          <div>
            <span class="m-order-num">{{ order.number }}</span>
            <span class="m-order-time">{{ formatDateTime(order.created_at) }}</span>
          </div>
          <StatusBadge :status="order.status" size="sm" />
        </div>

        <div class="card-body">
          <div class="m-retailer-info">
            <span class="m-icon">👤</span>
            <div>
              <strong>{{ order.retailer_name }}</strong>
              <small v-if="order.business_name"> ({{ order.business_name }})</small>
            </div>
          </div>

          <div class="m-items-info">
            <span class="m-icon">🏷️</span>
            <div>
              <span class="m-type-count">{{ order.items.length }} jenis:</span>
              <span class="m-summary-text">{{ formatProductSummary(order.items) }}</span>
              <span class="m-qty-badge">
                Total {{ order.items.reduce((s, it) => s + it.quantity, 0) }} tabung
              </span>
            </div>
          </div>
        </div>

        <div class="card-foot">
          <div class="m-total-col">
            <span class="m-total-lbl">Total Nilai</span>
            <strong class="m-total-val text-primary">{{ formatRupiah(order.total) }}</strong>
          </div>

          <div class="m-actions">
            <BaseButton
              v-if="order.status === 'MENUNGGU_KONFIRMASI'"
              variant="primary"
              size="sm"
              @click="openConfirmModal(order)"
            >
              ✓ Konfirmasi
            </BaseButton>

            <NuxtLink :to="`${basePath}/${order.id}`">
              <BaseButton variant="secondary" size="sm">
                Detail →
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationNav
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="(p: number) => currentPage = p"
    />

    <!-- Modal Konfirmasi Cepat Pesanan -->
    <BaseModal
      :is-open="isConfirmModalOpen"
      title="Konfirmasi Pesanan Pengecer"
      size="md"
      @close="isConfirmModalOpen = false"
    >
      <template #body>
        <div v-if="selectedOrderForAction" class="modal-confirm-body">
          <p class="modal-intro">
            Apakah Anda ingin mengonfirmasi pesanan <strong>{{ selectedOrderForAction.number }}</strong>
            dari <strong>{{ selectedOrderForAction.retailer_name }}</strong>?
          </p>

          <div class="items-check-box">
            <h4 class="box-title">Pemeriksaan Ketersediaan Stok Fisik:</h4>
            <div
              v-for="item in selectedOrderForAction.items"
              :key="item.product_id"
              class="item-stock-check"
            >
              <div class="stock-check-name">
                <strong>{{ item.quantity }}x {{ item.product_name }}</strong>
              </div>
              <div class="stock-check-avail">
                <span class="avail-badge">
                  Tersedia: {{ getBalance(item.product_id)?.available_qty ?? 0 }} tabung
                </span>
              </div>
            </div>
          </div>

          <div class="rule-reminder">
            ⚠️ <strong>Dampak Operasional:</strong> Konfirmasi ini akan menambah kuantitas tabung ke
            saldo <em>reserved_qty</em> (dialokasikan). Stok fisik belum dipotong sampai serah-terima
            selesai dilakukan.
          </div>
        </div>
      </template>

      <template #footer>
        <BaseButton
          variant="secondary"
          :disabled="isSubmittingConfirm"
          @click="isConfirmModalOpen = false"
        >
          Batal
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="isSubmittingConfirm"
          @click="handleConfirmSubmit"
        >
          ✓ Ya, Konfirmasi Pesanan
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.order-queue-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.queue-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .queue-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-text);
  margin: 0;
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.header-badges {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.counter-badge {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.badge-pending {
  background-color: #fffbeb;
  border-color: #fde68a;
}

.badge-confirmed {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.badge-icon {
  font-size: 20px;
}

.badge-num {
  font-size: var(--font-size-md);
  font-weight: 800;
  display: block;
  line-height: 1;
}

.badge-pending .badge-num {
  color: #92400e;
}
.badge-confirmed .badge-num {
  color: #1e40af;
}

.badge-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Filter Panel */
.filter-panel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: var(--shadow-xs);
}

.filter-top-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 900px) {
  .filter-top-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 300px;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 14px;
  color: var(--color-text-subtle);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 38px 9px 38px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary-700);
}

.clear-btn {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-surface-subtle);
  border: none;
  font-size: 10px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-tab-group {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.status-tab {
  padding: 6px 14px;
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-fast);
}

.status-tab:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-800);
}

.status-tab.active {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-900);
  color: #ffffff;
}

.tab-badge {
  background-color: var(--color-danger);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  line-height: 1.2;
}

.filter-bottom-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
}

.date-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
}

.date-input {
  padding: 5px 10px;
  font-size: var(--font-size-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.reset-btn {
  margin-left: auto;
}

/* Empty State */
.empty-state-wrapper {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-4);
}

/* Desktop Table */
.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.queue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.queue-table th {
  background-color: var(--color-surface-subtle);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
}

.queue-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.queue-table tr.row-highlight {
  background-color: #fffdf5;
}

.queue-table tr:hover {
  background-color: var(--color-surface-subtle);
}

.order-link {
  font-weight: 700;
  color: var(--color-primary-900);
  text-decoration: none;
}

.order-link:hover {
  text-decoration: underline;
}

.retailer-cell {
  display: flex;
  flex-direction: column;
}

.retailer-name {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.biz-name {
  font-size: 11px;
  color: var(--color-text-muted);
}

.type-count-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-subtle);
}

.items-summary-cell {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.summary-text {
  font-size: var(--font-size-xs);
  color: var(--color-text);
  font-weight: 500;
}

.total-qty-sub {
  font-size: 11px;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* Mobile Cards */
.mobile-queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mobile-order-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mobile-order-card.card-pending {
  border-left: 4px solid var(--color-warning);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.m-order-num {
  font-weight: 800;
  font-size: var(--font-size-sm);
  color: var(--color-primary-900);
  display: block;
}

.m-order-time {
  font-size: 11px;
  color: var(--color-text-muted);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
}

.m-retailer-info,
.m-items-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.m-icon {
  font-size: 14px;
}

.m-type-count {
  font-weight: 700;
  color: var(--color-primary-900);
  margin-right: 4px;
}

.m-qty-badge {
  background-color: var(--color-surface-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  margin-left: 4px;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
}

.m-total-col {
  display: flex;
  flex-direction: column;
}

.m-total-lbl {
  font-size: 10px;
  color: var(--color-text-subtle);
  text-transform: uppercase;
}

.m-total-val {
  font-size: var(--font-size-sm);
  font-weight: 800;
}

.m-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Modal Bodies */
.modal-confirm-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.modal-intro {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin: 0;
}

.items-check-box {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.box-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  margin: 0 0 2px;
  text-transform: uppercase;
}

.item-stock-check {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.avail-badge {
  color: var(--color-primary-700);
  font-weight: 700;
}

.rule-reminder {
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-xs);
  color: #92400e;
  line-height: 1.4;
}

.hide-mobile {
  display: none;
}
.hide-desktop {
  display: flex;
}

@media (min-width: 768px) {
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
.text-xs {
  font-size: 11px;
}
.font-bold {
  font-weight: 700;
}
.text-primary {
  color: var(--color-primary-700);
}
</style>
