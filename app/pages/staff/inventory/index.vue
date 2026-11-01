<script setup lang="ts">
import { formatQuantity, formatDate } from '~/composables/useFormatters'

definePageMeta({ layout: 'staff' })

const { products } = useMockProducts()
const { balances } = useMockInventory()

// ─── Filter & Pencarian ───────────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'LOW_STOCK'>('ALL')

interface InventoryRow {
  product_id: string
  name: string
  size_kg: number
  active: boolean
  minimum_stock: number
  full_qty: number
  empty_qty: number
  reserved_qty: number
  available_qty: number
  low_stock: boolean
}

const inventoryRows = computed((): InventoryRow[] => {
  return products.value
    .filter(p => p.active) // Karyawan hanya melihat produk aktif
    .map(p => {
      const bal = balances.value.find(b => b.product_id === p.id)
      const full_qty = bal?.full_qty ?? p.full_qty
      const empty_qty = bal?.empty_qty ?? p.empty_qty
      const reserved_qty = bal?.reserved_qty ?? p.reserved_qty
      const available_qty = Math.max(0, full_qty - reserved_qty)
      return {
        product_id: p.id,
        name: p.name,
        size_kg: p.size_kg,
        active: p.active,
        minimum_stock: p.minimum_stock,
        full_qty,
        empty_qty,
        reserved_qty,
        available_qty,
        low_stock: available_qty < p.minimum_stock,
      }
    })
})

const filteredRows = computed(() => {
  return inventoryRows.value.filter(row => {
    if (statusFilter.value === 'LOW_STOCK' && !row.low_stock) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      return row.name.toLowerCase().includes(q)
    }
    return true
  })
})

const totalFull = computed(() => inventoryRows.value.reduce((s, r) => s + r.full_qty, 0))
const totalEmpty = computed(() => inventoryRows.value.reduce((s, r) => s + r.empty_qty, 0))
const totalAvailable = computed(() => inventoryRows.value.reduce((s, r) => s + r.available_qty, 0))
const lowStockCount = computed(() => inventoryRows.value.filter(r => r.low_stock).length)
const today = computed(() => formatDate(new Date().toISOString()))
</script>

<template>
  <div class="page-inventory">
    <div class="page-header">
      <div>
        <h1 class="page-title">📦 Stok Terkini</h1>
        <p class="page-desc">Saldo stok produk aktif. Baca-saja. Data per {{ today }}.</p>
      </div>
      <NuxtLink to="/staff/inventory/receipts">
        <BaseButton variant="primary">🚚 Catat Pasokan</BaseButton>
      </NuxtLink>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card summary-full">
        <div class="summary-icon">🟢</div>
        <div class="summary-body">
          <p class="summary-label">Stok Penuh</p>
          <p class="summary-value">{{ formatQuantity(totalFull) }}</p>
        </div>
      </div>
      <div class="summary-card summary-empty">
        <div class="summary-icon">⚪</div>
        <div class="summary-body">
          <p class="summary-label">Stok Kosong</p>
          <p class="summary-value">{{ formatQuantity(totalEmpty) }}</p>
        </div>
      </div>
      <div class="summary-card summary-available">
        <div class="summary-icon">✅</div>
        <div class="summary-body">
          <p class="summary-label">Tersedia</p>
          <p class="summary-value">{{ formatQuantity(totalAvailable) }}</p>
        </div>
      </div>
      <div :class="['summary-card', lowStockCount > 0 ? 'summary-warning' : 'summary-ok']">
        <div class="summary-icon">{{ lowStockCount > 0 ? '⚠️' : '👍' }}</div>
        <div class="summary-body">
          <p class="summary-label">Stok Rendah</p>
          <p class="summary-value">{{ lowStockCount }} produk</p>
        </div>
      </div>
    </div>

    <div v-if="lowStockCount > 0" class="alert-low-stock">
      ⚠️ <strong>{{ lowStockCount }} produk</strong> di bawah stok minimum. Laporkan ke Admin atau catat pasokan segera.
    </div>

    <!-- PRD note -->
    <div class="rule-note">
      <strong>Catatan:</strong> Stok penuh dan kosong adalah saldo berbeda. Tersedia = Penuh − Dialokasikan.
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <div class="search-wrap">
        <input v-model="searchQuery" type="search" placeholder="Cari produk..." class="search-input" />
      </div>
      <div class="filter-group">
        <button
          v-for="opt in [{ val: 'ALL', label: 'Semua' }, { val: 'LOW_STOCK', label: '⚠️ Stok Rendah' }]"
          :key="opt.val"
          :class="['filter-btn', { active: statusFilter === opt.val }]"
          type="button"
          @click="statusFilter = opt.val as typeof statusFilter"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="table-wrap hide-mobile">
      <table class="inv-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th class="text-right">Stok Penuh</th>
            <th class="text-right">Stok Kosong</th>
            <th class="text-right">Dialokasikan</th>
            <th class="text-right">Tersedia</th>
            <th class="text-right">Min. Stok</th>
            <th>Kondisi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" class="empty-row">
              <EmptyState title="Tidak ada data" description="Tidak ada produk aktif yang cocok." />
            </td>
          </tr>
          <tr
            v-for="row in filteredRows"
            :key="row.product_id"
            :class="{ 'row-low-stock': row.low_stock }"
          >
            <td>
              <div class="product-cell">
                <span class="product-name">{{ row.name }}</span>
                <span class="product-size">{{ row.size_kg }} kg</span>
              </div>
            </td>
            <td class="text-right qty-full">{{ formatQuantity(row.full_qty) }}</td>
            <td class="text-right qty-empty">{{ formatQuantity(row.empty_qty) }}</td>
            <td class="text-right qty-reserved">{{ formatQuantity(row.reserved_qty) }}</td>
            <td class="text-right">
              <span :class="['qty-available', { 'qty-low': row.low_stock }]">
                {{ formatQuantity(row.available_qty) }}
              </span>
            </td>
            <td class="text-right qty-min">{{ formatQuantity(row.minimum_stock) }}</td>
            <td>
              <span v-if="row.low_stock" class="condition-low">⚠️ Rendah</span>
              <span v-else class="condition-ok">✅ Normal</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="mobile-cards hide-desktop">
      <EmptyState v-if="filteredRows.length === 0" title="Tidak ada data" description="Tidak ada produk aktif." />
      <div
        v-for="row in filteredRows"
        :key="row.product_id"
        :class="['inv-card', { 'card-low-stock': row.low_stock }]"
      >
        <div class="inv-card-header">
          <div>
            <p class="inv-card-name">{{ row.name }}</p>
            <p class="inv-card-size">{{ row.size_kg }} kg</p>
          </div>
          <span v-if="row.low_stock" class="condition-low">⚠️ Rendah</span>
          <span v-else class="condition-ok">✅ Normal</span>
        </div>
        <div class="inv-card-body">
          <div class="inv-card-row">
            <span class="inv-label">Stok Penuh</span>
            <span class="inv-val qty-full">{{ formatQuantity(row.full_qty) }}</span>
          </div>
          <div class="inv-card-row">
            <span class="inv-label">Stok Kosong</span>
            <span class="inv-val qty-empty">{{ formatQuantity(row.empty_qty) }}</span>
          </div>
          <div class="inv-card-row">
            <span class="inv-label">Dialokasikan</span>
            <span class="inv-val qty-reserved">{{ formatQuantity(row.reserved_qty) }}</span>
          </div>
          <div class="inv-card-row">
            <span class="inv-label">Tersedia</span>
            <span :class="['inv-val', 'qty-available', { 'qty-low': row.low_stock }]">
              {{ formatQuantity(row.available_qty) }}
            </span>
          </div>
        </div>
        <div v-if="row.low_stock" class="inv-card-alert">
          ⚠️ Di bawah minimum ({{ formatQuantity(row.minimum_stock) }}). Segera catat pasokan.
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <NuxtLink to="/staff/inventory/movements" class="quick-link">📜 Riwayat Pergerakan Stok</NuxtLink>
      <NuxtLink to="/staff/inventory/receipts" class="quick-link">🚚 Catat Pasokan Agen</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.page-inventory { display: flex; flex-direction: column; gap: var(--space-5); }
.page-header { display: flex; flex-direction: column; gap: var(--space-3); }
@media (min-width: 640px) { .page-header { flex-direction: row; align-items: flex-start; justify-content: space-between; } }
.page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }
.page-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
@media (min-width: 768px) { .summary-grid { grid-template-columns: repeat(4, 1fr); } }
.summary-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; align-items: flex-start; gap: var(--space-3); }
.summary-full { border-left: 3px solid var(--color-success); }
.summary-empty { border-left: 3px solid var(--color-text-subtle); }
.summary-available { border-left: 3px solid var(--color-primary-700); }
.summary-warning { border-left: 3px solid var(--color-warning); background: #fffbeb; }
.summary-ok { border-left: 3px solid var(--color-success); }
.summary-icon { font-size: 20px; }
.summary-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; margin: 0 0 2px; }
.summary-value { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); margin: 0; }

.alert-low-stock { background: #fffbeb; border: 1px solid var(--color-warning); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--font-size-sm); color: #92400e; }
.rule-note { background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--font-size-xs); color: var(--color-text-muted); }

.filter-bar { display: flex; flex-direction: column; gap: var(--space-2); }
@media (min-width: 640px) { .filter-bar { flex-direction: row; align-items: center; justify-content: space-between; } }
.search-wrap { flex: 1 1 auto; max-width: 320px; }
.search-input { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-surface); }
.search-input:focus { border-color: var(--color-primary-700); outline: none; }
.filter-group { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.filter-btn { padding: 6px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 500; cursor: pointer; background: var(--color-surface); color: var(--color-text-muted); }
.filter-btn.active { background: var(--color-primary-900); color: #fff; border-color: var(--color-primary-900); }

.table-wrap { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.inv-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.inv-table th { background: var(--color-surface-subtle); padding: var(--space-3) var(--space-4); text-align: left; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--color-border); }
.inv-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.inv-table tr:last-child td { border-bottom: none; }
.row-low-stock { background: #fffbeb; }
.inv-table tr:hover { background: var(--color-surface-subtle); }
.text-right { text-align: right; }
.product-cell { display: flex; flex-direction: column; gap: 2px; }
.product-name { font-weight: 600; }
.product-size { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.qty-full { color: var(--color-success); font-weight: 600; }
.qty-empty { color: var(--color-text-subtle); }
.qty-reserved { color: var(--color-warning); }
.qty-available { font-weight: 700; color: var(--color-primary-700); }
.qty-low { color: var(--color-danger) !important; }
.qty-min { color: var(--color-text-muted); }
.empty-row { padding: 0 !important; }

.condition-low { font-size: var(--font-size-xs); color: #92400e; font-weight: 600; }
.condition-ok { font-size: var(--font-size-xs); color: var(--color-success); font-weight: 600; }

.mobile-cards { display: flex; flex-direction: column; gap: var(--space-3); }
.hide-mobile { display: none; }
.hide-desktop { display: flex; flex-direction: column; }
@media (min-width: 768px) { .hide-mobile { display: block; } .hide-desktop { display: none; } }
.inv-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.card-low-stock { border-left: 3px solid var(--color-warning); }
.inv-card-header { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface-subtle); }
.inv-card-name { font-weight: 700; font-size: var(--font-size-sm); margin: 0; }
.inv-card-size { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 2px 0 0; }
.inv-card-body { padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.inv-card-row { display: flex; justify-content: space-between; }
.inv-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.inv-val { font-size: var(--font-size-sm); font-weight: 600; }
.inv-card-alert { background: #fffbeb; padding: var(--space-2) var(--space-4); font-size: var(--font-size-xs); color: #92400e; border-top: 1px solid #fde68a; }

.quick-links { display: flex; gap: var(--space-3); flex-wrap: wrap; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }
.quick-link { font-size: var(--font-size-sm); color: var(--color-primary-700); text-decoration: none; font-weight: 500; }
.quick-link:hover { text-decoration: underline; }
</style>

