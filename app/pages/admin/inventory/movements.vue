<script setup lang="ts">
import { formatQuantity, formatDateTime } from '~/composables/useFormatters'
import type { StockMovement, MovementType } from '~/composables/useInventory'

definePageMeta({ layout: 'admin' })

const { movements, balances } = useInventory()
const { products } = useProducts()
const { showSuccess, showError } = useNotification()

// ─── Filter & Pencarian ───────────────────────────────────────────
const searchQuery = ref('')
const productFilter = ref('ALL')
const typeFilter = ref<'ALL' | MovementType>('ALL')
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = 15

const movementTypeLabels: Record<MovementType, string> = {
  PENERIMAAN_PASOKAN: 'Penerimaan Pasokan',
  KOREKSI_STOK: 'Koreksi Stok',
  ALOKASI_ORDER: 'Alokasi Order',
  PELEPASAN_ALOKASI: 'Pelepasan Alokasi',
  SERAH_TERIMA: 'Serah Terima',
  PENJUALAN_LANGSUNG: 'Penjualan Langsung',
}

const movementTypeBadge: Record<MovementType, string> = {
  PENERIMAAN_PASOKAN: 'badge-success',
  KOREKSI_STOK: 'badge-warning',
  ALOKASI_ORDER: 'badge-info',
  PELEPASAN_ALOKASI: 'badge-secondary',
  SERAH_TERIMA: 'badge-primary',
  PENJUALAN_LANGSUNG: 'badge-danger',
}

function getProductName(productId: string): string {
  return products.value.find(p => p.id === productId)?.name ?? productId
}

const filteredMovements = computed(() => {
  return movements.value.filter(m => {
    if (productFilter.value !== 'ALL' && m.product_id !== productFilter.value) return false
    if (typeFilter.value !== 'ALL' && m.type !== typeFilter.value) return false
    if (dateFrom.value) {
      const from = new Date(dateFrom.value)
      from.setHours(0, 0, 0, 0)
      if (new Date(m.created_at) < from) return false
    }
    if (dateTo.value) {
      const to = new Date(dateTo.value)
      to.setHours(23, 59, 59, 999)
      if (new Date(m.created_at) > to) return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      return (
        getProductName(m.product_id).toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.actor.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredMovements.value.length / pageSize) || 1)
const paginatedMovements = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMovements.value.slice(start, start + pageSize)
})

watch([searchQuery, productFilter, typeFilter, dateFrom, dateTo], () => {
  currentPage.value = 1
})

// ─── Detail Modal ─────────────────────────────────────────────────
const selectedMovement = ref<StockMovement | null>(null)
const isDetailOpen = ref(false)

function openDetail(m: StockMovement) {
  selectedMovement.value = m
  isDetailOpen.value = true
}

function formatDelta(val: number): string {
  if (val > 0) return `+${formatQuantity(val)}`
  if (val < 0) return `${formatQuantity(val)}`
  return '0 tabung'
}

function deltaCls(val: number): string {
  if (val > 0) return 'delta-pos'
  if (val < 0) return 'delta-neg'
  return 'delta-zero'
}

function resetFilters() {
  searchQuery.value = ''
  productFilter.value = 'ALL'
  typeFilter.value = 'ALL'
  dateFrom.value = ''
  dateTo.value = ''
}
</script>

<template>
  <div class="page-movements">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">📜 Riwayat Pergerakan Stok</h1>
        <p class="page-desc">Catatan seluruh perubahan saldo inventaris. Baca-saja.</p>
      </div>
      <div class="page-actions">
        <NuxtLink to="/admin/inventory">
          <BaseButton variant="ghost">← Ringkasan Stok</BaseButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="search-wrap">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari produk, alasan, atau pelaku..."
            class="search-input"
          />
        </div>
        <BaseButton variant="ghost" @click="resetFilters">Reset Filter</BaseButton>
      </div>
      <div class="filter-row">
        <div class="filter-field">
          <label class="filter-label">Produk</label>
          <select v-model="productFilter" class="filter-select">
            <option value="ALL">Semua Produk</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="filter-field">
          <label class="filter-label">Jenis Pergerakan</label>
          <select v-model="typeFilter" class="filter-select">
            <option value="ALL">Semua Jenis</option>
            <option v-for="(label, key) in movementTypeLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="filter-field">
          <label class="filter-label">Dari Tanggal</label>
          <input v-model="dateFrom" type="date" class="filter-select" />
        </div>
        <div class="filter-field">
          <label class="filter-label">Sampai Tanggal</label>
          <input v-model="dateTo" type="date" class="filter-select" />
        </div>
      </div>
    </div>

    <!-- Result Count -->
    <p class="result-count">
      Menampilkan {{ filteredMovements.length }} pergerakan
      <span v-if="filteredMovements.length !== movements.length">(dari {{ movements.length }} total)</span>
    </p>

    <!-- Desktop Table -->
    <div class="table-wrap hide-mobile">
      <table class="mov-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Produk</th>
            <th>Jenis</th>
            <th class="text-right">Δ Penuh</th>
            <th class="text-right">Δ Kosong</th>
            <th class="text-right">Saldo Penuh</th>
            <th>Keterangan</th>
            <th>Pelaku</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedMovements.length === 0">
            <td colspan="8" class="empty-row">
              <EmptyState
                title="Tidak ada riwayat"
                description="Belum ada pergerakan stok yang sesuai filter."
              />
            </td>
          </tr>
          <tr
            v-for="m in paginatedMovements"
            :key="m.id"
            class="mov-row"
            @click="openDetail(m)"
          >
            <td class="td-time">{{ formatDateTime(m.created_at) }}</td>
            <td class="td-product">{{ getProductName(m.product_id) }}</td>
            <td>
              <span :class="['type-badge', movementTypeBadge[m.type]]">
                {{ movementTypeLabels[m.type] }}
              </span>
            </td>
            <td class="text-right">
              <span :class="deltaCls(m.full_delta)">{{ formatDelta(m.full_delta) }}</span>
            </td>
            <td class="text-right">
              <span :class="deltaCls(m.empty_delta)">{{ formatDelta(m.empty_delta) }}</span>
            </td>
            <td class="text-right td-balance">
              <span class="bal-before">{{ formatQuantity(m.full_before) }}</span>
              <span class="bal-arrow"> → </span>
              <span class="bal-after">{{ formatQuantity(m.full_after) }}</span>
            </td>
            <td class="td-reason">{{ m.reason }}</td>
            <td class="td-actor">{{ m.actor }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="mobile-cards hide-desktop">
      <EmptyState
        v-if="paginatedMovements.length === 0"
        title="Tidak ada riwayat"
        description="Belum ada pergerakan stok yang sesuai filter."
      />
      <div
        v-for="m in paginatedMovements"
        :key="m.id"
        class="mov-card"
        @click="openDetail(m)"
      >
        <div class="mov-card-header">
          <span :class="['type-badge', movementTypeBadge[m.type]]">{{ movementTypeLabels[m.type] }}</span>
          <span class="mov-time">{{ formatDateTime(m.created_at) }}</span>
        </div>
        <p class="mov-product">{{ getProductName(m.product_id) }}</p>
        <div class="mov-deltas">
          <div class="mov-delta-row">
            <span class="delta-label">Δ Stok Penuh:</span>
            <span :class="deltaCls(m.full_delta)">{{ formatDelta(m.full_delta) }}</span>
          </div>
          <div class="mov-delta-row">
            <span class="delta-label">Δ Stok Kosong:</span>
            <span :class="deltaCls(m.empty_delta)">{{ formatDelta(m.empty_delta) }}</span>
          </div>
        </div>
        <p class="mov-reason">{{ m.reason }}</p>
        <p class="mov-actor">Oleh: {{ m.actor }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationNav
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="(p: number) => currentPage = p"
    />

    <!-- Detail Modal -->
    <BaseModal
      :is-open="isDetailOpen"
      title="Detail Pergerakan Stok"
      size="md"
      @close="isDetailOpen = false"
    >
      <template #body>
        <div v-if="selectedMovement" class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Waktu</span>
            <span class="detail-val">{{ formatDateTime(selectedMovement.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Produk</span>
            <span class="detail-val">{{ getProductName(selectedMovement.product_id) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Jenis</span>
            <span :class="['type-badge', movementTypeBadge[selectedMovement.type]]">
              {{ movementTypeLabels[selectedMovement.type] }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Δ Stok Penuh</span>
            <span :class="deltaCls(selectedMovement.full_delta)">{{ formatDelta(selectedMovement.full_delta) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Δ Stok Kosong</span>
            <span :class="deltaCls(selectedMovement.empty_delta)">{{ formatDelta(selectedMovement.empty_delta) }}</span>
          </div>
          <hr />
          <div class="detail-row">
            <span class="detail-label">Penuh Sebelum</span>
            <span class="detail-val">{{ formatQuantity(selectedMovement.full_before) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Penuh Sesudah</span>
            <span class="detail-val fw-bold">{{ formatQuantity(selectedMovement.full_after) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Kosong Sebelum</span>
            <span class="detail-val">{{ formatQuantity(selectedMovement.empty_before) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Kosong Sesudah</span>
            <span class="detail-val fw-bold">{{ formatQuantity(selectedMovement.empty_after) }}</span>
          </div>
          <hr />
          <div class="detail-row">
            <span class="detail-label">Keterangan</span>
            <span class="detail-val">{{ selectedMovement.reason }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pelaku</span>
            <span class="detail-val">{{ selectedMovement.actor }}</span>
          </div>
          <div v-if="selectedMovement.reference_id" class="detail-row">
            <span class="detail-label">Referensi</span>
            <span class="detail-val">{{ selectedMovement.reference_id }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="secondary" @click="isDetailOpen = false">Tutup</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-movements { display: flex; flex-direction: column; gap: var(--space-4); }
.page-header { display: flex; flex-direction: column; gap: var(--space-3); }
@media (min-width: 640px) { .page-header { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }
.page-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
.page-actions { display: flex; gap: var(--space-2); }

/* Filter */
.filter-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
.filter-row { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: flex-end; }
.search-wrap { flex: 1 1 220px; }
.search-input { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-surface); }
.search-input:focus { border-color: var(--color-primary-700); outline: none; }
.filter-field { display: flex; flex-direction: column; gap: 4px; flex: 1 1 150px; }
.filter-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.filter-select { padding: 7px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-surface); }

.result-count { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

/* Table */
.table-wrap { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.mov-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.mov-table th { background: var(--color-surface-subtle); padding: var(--space-3) var(--space-4); text-align: left; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--color-border); }
.mov-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.mov-table tr:last-child td { border-bottom: none; }
.mov-row { cursor: pointer; }
.mov-row:hover { background: var(--color-surface-subtle); }
.text-right { text-align: right; }
.td-time { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }
.td-product { font-weight: 600; }
.td-reason { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-size-xs); color: var(--color-text-muted); }
.td-actor { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.td-balance { font-size: var(--font-size-xs); white-space: nowrap; }
.bal-before { color: var(--color-text-muted); }
.bal-arrow { color: var(--color-text-subtle); }
.bal-after { font-weight: 700; color: var(--color-text); }
.empty-row { padding: 0 !important; }

/* Type Badge */
.type-badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; white-space: nowrap; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-secondary { background: #f3f4f6; color: #374151; }
.badge-primary { background: #ede9fe; color: #5b21b6; }
.badge-danger { background: #fee2e2; color: #991b1b; }

/* Delta */
.delta-pos { color: var(--color-success); font-weight: 700; }
.delta-neg { color: var(--color-danger); font-weight: 700; }
.delta-zero { color: var(--color-text-muted); }

/* Mobile Cards */
.mobile-cards { display: flex; flex-direction: column; gap: var(--space-3); }
.hide-mobile { display: none; }
.hide-desktop { display: flex; flex-direction: column; }
@media (min-width: 768px) { .hide-mobile { display: block; } .hide-desktop { display: none; } }

.mov-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); cursor: pointer; }
.mov-card:hover { border-color: var(--color-primary-700); }
.mov-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); gap: var(--space-2); flex-wrap: wrap; }
.mov-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.mov-product { font-weight: 700; font-size: var(--font-size-sm); color: var(--color-text); margin: 0 0 var(--space-2); }
.mov-deltas { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--space-2); }
.mov-delta-row { display: flex; justify-content: space-between; }
.delta-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.mov-reason { font-size: var(--font-size-xs); color: var(--color-text-subtle); margin: 0 0 4px; }
.mov-actor { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }

/* Detail Modal */
.detail-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.detail-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); }
.detail-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; flex-shrink: 0; min-width: 120px; }
.detail-val { font-size: var(--font-size-sm); color: var(--color-text); text-align: right; }
.fw-bold { font-weight: 700; }
hr { border: none; border-top: 1px solid var(--color-border); }
</style>
