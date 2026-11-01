<script setup lang="ts">
import { formatRupiah, formatDateTime } from '~/composables/useFormatters'
import type { MockOrder } from '~/data/mockOrders'

definePageMeta({
  layout: 'retailer'
})

const { orders } = useMockOrders()
const { currentUser } = useMockAuth()

// ─── Filter & Search States ───────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref<string>('ALL')
const currentPage = ref(1)
const pageSize = 6

// Pengecer HANYA boleh melihat pesanan miliknya sendiri (PRD Rule)
const myOrders = computed(() => {
  const currentRetailerId = currentUser.value?.id ?? 'usr-ret-01'
  return orders.value.filter(o => o.retailer_id === currentRetailerId)
})

const filteredOrders = computed(() => {
  return myOrders.value.filter(order => {
    // Filter status
    if (statusFilter.value !== 'ALL' && order.status !== statusFilter.value) {
      return false
    }
    // Search nomor order
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchNum = order.number.toLowerCase().includes(q)
      const matchItem = order.items.some(it => it.product_name.toLowerCase().includes(q))
      return matchNum || matchItem
    }
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / pageSize) || 1)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

function formatProductSummary(items: MockOrder['items']): string {
  if (items.length === 0) return '0 item'
  const first = items[0]
  if (!first) return '0 item'
  if (items.length === 1) {
    return `${first.quantity}x ${first.product_name}`
  }
  return `${first.quantity}x ${first.product_name} (+${items.length - 1} produk lain)`
}
</script>

<template>
  <div class="retailer-orders-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">📦 Riwayat Pesanan Saya</h1>
        <p class="page-desc">
          Pantau status pengajuan pesanan tabung gas LPG Anda ke pangkalan secara real-time.
        </p>
      </div>

      <NuxtLink to="/retailer/catalog">
        <BaseButton variant="primary" size="sm">+ Buat Pesanan Baru</BaseButton>
      </NuxtLink>
    </div>

    <!-- Filter Bar & Search -->
    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari nomor pesanan (ORD-...) atau nama produk..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-search-btn"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="status-chips">
        <button
          v-for="opt in [
            { key: 'ALL', label: 'Semua' },
            { key: 'MENUNGGU_KONFIRMASI', label: 'Menunggu' },
            { key: 'DIKONFIRMASI', label: 'Dikonfirmasi' },
            { key: 'SELESAI', label: 'Selesai' },
            { key: 'DITOLAK', label: 'Ditolak' }
          ]"
          :key="opt.key"
          :class="['status-chip', { active: statusFilter === opt.key }]"
          type="button"
          @click="statusFilter = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="empty-state-card">
      <EmptyState
        title="Tidak Ada Pesanan Ditemukan"
        :description="
          myOrders.length === 0
            ? 'Anda belum pernah membuat pesanan tabung gas. Silakan mulai belanja dari katalog produk.'
            : 'Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.'
        "
      >
        <template #actions>
          <NuxtLink v-if="myOrders.length === 0" to="/retailer/catalog">
            <BaseButton variant="primary">Mulai Pesan Tabung Gas</BaseButton>
          </NuxtLink>
          <BaseButton
            v-else
            variant="secondary"
            size="sm"
            @click="searchQuery = ''; statusFilter = 'ALL'"
          >
            Reset Filter
          </BaseButton>
        </template>
      </EmptyState>
    </div>

    <!-- Orders List (Mobile-First Cards) -->
    <div v-else class="orders-list">
      <div
        v-for="order in paginatedOrders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-card-header">
          <div class="order-number-date">
            <span class="order-number">{{ order.number }}</span>
            <span class="order-date">{{ formatDateTime(order.created_at) }}</span>
          </div>

          <StatusBadge :status="order.status" size="sm" />
        </div>

        <div class="order-card-body">
          <div class="order-items-preview">
            <span class="items-icon">🏷️</span>
            <div class="items-text">
              <span class="items-title">{{ formatProductSummary(order.items) }}</span>
              <span class="items-total-qty">
                Total: {{ order.items.reduce((s, it) => s + it.quantity, 0) }} tabung
              </span>
            </div>
          </div>

          <div v-if="order.status === 'DITOLAK' && order.rejection_reason" class="rejection-note">
            <strong>Alasan penolakan:</strong> {{ order.rejection_reason }}
          </div>
        </div>

        <div class="order-card-footer">
          <div class="total-price-block">
            <span class="total-label">Total Pesanan</span>
            <span class="total-amount">{{ formatRupiah(order.total) }}</span>
          </div>

          <NuxtLink :to="`/retailer/orders/${order.id}`">
            <BaseButton variant="secondary" size="sm">
              Lihat Rincian →
            </BaseButton>
          </NuxtLink>
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
  </div>
</template>

<style scoped>
.retailer-orders-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (min-width: 640px) {
  .page-header {
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

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .filter-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 260px;
  max-width: 420px;
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
  padding: 10px 38px 10px 38px;
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

.clear-search-btn {
  position: absolute;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--color-surface-subtle);
  border: none;
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.status-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.status-chip {
  padding: 6px 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.status-chip:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-800);
}

.status-chip.active {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-900);
  color: #ffffff;
}

/* Empty State Card */
.empty-state-card {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-4);
}

/* Order Cards List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.order-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: all var(--transition-fast);
}

.order-card:hover {
  border-color: var(--color-primary-600);
  box-shadow: var(--shadow-sm);
}

.order-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.order-number-date {
  display: flex;
  flex-direction: column;
}

.order-number {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary-900);
}

.order-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.order-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.order-items-preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.items-icon {
  font-size: 18px;
}

.items-text {
  display: flex;
  flex-direction: column;
}

.items-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.items-total-qty {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.rejection-note {
  font-size: var(--font-size-xs);
  color: #991b1b;
  background-color: #fee2e2;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  margin-top: 2px;
}

.order-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.total-price-block {
  display: flex;
  flex-direction: column;
}

.total-label {
  font-size: 11px;
  color: var(--color-text-subtle);
  text-transform: uppercase;
}

.total-amount {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-primary-700);
}
</style>
