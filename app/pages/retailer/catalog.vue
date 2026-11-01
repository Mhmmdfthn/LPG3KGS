<script setup lang="ts">
import { formatRupiah, formatQuantity } from '~/composables/useFormatters'
import type { MockProduct } from '~/data/mockProducts'

definePageMeta({
  layout: 'retailer'
})

const { products } = useMockProducts()
const { balances } = useMockInventory()
const { cartCount, cartTotal, addToCart, getProductAvailableQty } = useMockOrders()
const { showSuccess, showError } = useNotification()

// ─── Filter & Search ──────────────────────────────────────────────
const searchQuery = ref('')
const sizeFilter = ref<'ALL' | '3' | '5.5' | '12'>('ALL')

// Hanya tampilkan produk aktif di katalog Pengecer (PRD Rule)
const catalogProducts = computed(() => {
  return products.value
    .filter(p => p.active)
    .map(p => {
      const available = getProductAvailableQty(p.id)
      return {
        ...p,
        available_qty: available,
        is_out_of_stock: available <= 0,
        is_low: available > 0 && available < p.minimum_stock
      }
    })
    .filter(p => {
      if (sizeFilter.value !== 'ALL' && String(p.size_kg) !== sizeFilter.value) {
        return false
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase()
        return p.name.toLowerCase().includes(q) || String(p.size_kg).includes(q)
      }
      return true
    })
})

// State kuantitas per produk
const quantities = reactive<Record<string, number>>({})

// Inisialisasi kuantitas default 1
watchEffect(() => {
  products.value.forEach(p => {
    if (!quantities[p.id]) {
      quantities[p.id] = 1
    }
  })
})

function updateQty(productId: string, delta: number, maxAvailable: number) {
  const current = quantities[productId] || 1
  const updated = Math.max(1, Math.min(maxAvailable, current + delta))
  quantities[productId] = updated
}

function handleAddToCart(product: MockProduct & { available_qty: number }) {
  const qty = quantities[product.id] || 1
  try {
    addToCart(product, qty)
    showSuccess(
      `${qty} tabung ${product.name} berhasil ditambahkan ke keranjang.`,
      'Ditambahkan ke Keranjang'
    )
    // Kembalikan input quantity ke 1
    quantities[product.id] = 1
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal menambahkan ke keranjang.')
  }
}
</script>

<template>
  <div class="retailer-catalog-page">
    <!-- Header Hero Banner -->
    <div class="catalog-hero">
      <div class="hero-content">
        <h1 class="hero-title">Katalog Pemesanan LPG</h1>
        <p class="hero-subtitle">
          Pesan tabung gas LPG resmi pangkalan. Stok yang ditampilkan adalah
          <strong>stok penuh fisik yang siap dipesan</strong> saat ini.
        </p>
      </div>

      <NuxtLink to="/retailer/cart" class="cart-pill-link">
        <span class="cart-icon">🛍️</span>
        <div class="cart-info">
          <span class="cart-count-text">Keranjang ({{ cartCount }})</span>
          <span class="cart-total-text">{{ formatRupiah(cartTotal) }}</span>
        </div>
        <span class="cart-arrow">→</span>
      </NuxtLink>
    </div>

    <!-- Search & Filter Controls -->
    <div class="catalog-controls">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari tabung gas (3 kg, Bright Gas)..."
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

      <div class="filter-chips">
        <button
          v-for="opt in [
            { key: 'ALL', label: 'Semua Produk' },
            { key: '3', label: '3 kg (Melon)' },
            { key: '5.5', label: '5.5 kg' },
            { key: '12', label: '12 kg' }
          ]"
          :key="opt.key"
          :class="['filter-chip', { active: sizeFilter === opt.key }]"
          type="button"
          @click="sizeFilter = opt.key as typeof sizeFilter"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="catalogProducts.length === 0" class="empty-state-wrapper">
      <EmptyState
        title="Produk Tidak Ditemukan"
        description="Tidak ada tabung gas aktif yang cocok dengan pencarian atau filter Anda."
      >
        <template #actions>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="searchQuery = ''; sizeFilter = 'ALL'"
          >
            Reset Pencarian
          </BaseButton>
        </template>
      </EmptyState>
    </div>

    <!-- Product Grid -->
    <div v-else class="product-grid">
      <div
        v-for="prod in catalogProducts"
        :key="prod.id"
        :class="['product-card', { 'is-out-of-stock': prod.is_out_of_stock }]"
      >
        <!-- Card Top Bar: Size & Availability Badge -->
        <div class="card-badge-row">
          <span class="size-pill">{{ prod.size_kg }} kg</span>
          <StatusBadge
            v-if="prod.is_out_of_stock"
            status="DITOLAK"
            label="Stok Habis"
            size="sm"
          />
          <StatusBadge
            v-else-if="prod.is_low"
            status="LOW_STOCK"
            label="Stok Terbatas"
            size="sm"
          />
          <StatusBadge
            v-else
            status="ACTIVE"
            label="Tersedia"
            size="sm"
          />
        </div>

        <!-- Product Details -->
        <div class="card-body">
          <h2 class="product-name">{{ prod.name }}</h2>
          <div class="product-price">
            <span class="price-val">{{ formatRupiah(prod.price) }}</span>
            <span class="price-unit">/ tabung</span>
          </div>

          <div class="stock-pill-row">
            <span class="stock-label">Stok Tersedia:</span>
            <strong :class="['stock-qty', { 'text-danger': prod.is_out_of_stock }]">
              {{ formatQuantity(prod.available_qty) }}
            </strong>
          </div>
          <p class="stock-note">
            *Stok penuh fisik yang belum dialokasikan untuk order lain.
          </p>
        </div>

        <!-- Card Footer: Quantity Counter & Add to Cart -->
        <div class="card-footer">
          <div v-if="!prod.is_out_of_stock" class="order-controls">
            <div class="qty-control">
              <button
                type="button"
                class="qty-btn"
                :disabled="(quantities[prod.id] || 1) <= 1"
                title="Kurangi"
                @click="updateQty(prod.id, -1, prod.available_qty)"
              >
                −
              </button>
              <input
                type="number"
                class="qty-field"
                :value="quantities[prod.id] || 1"
                min="1"
                :max="prod.available_qty"
                readonly
              />
              <button
                type="button"
                class="qty-btn"
                :disabled="(quantities[prod.id] || 1) >= prod.available_qty"
                title="Tambah"
                @click="updateQty(prod.id, 1, prod.available_qty)"
              >
                +
              </button>
            </div>

            <BaseButton
              variant="primary"
              size="md"
              class="add-to-cart-btn"
              @click="handleAddToCart(prod)"
            >
              + Keranjang
            </BaseButton>
          </div>

          <div v-else class="out-of-stock-alert">
            <span class="alert-icon">⚠️</span>
            <span>Stok saat ini kosong. Harap tunggu pasokan agen berikutnya.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retailer-catalog-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Hero Section */
.catalog-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-5);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-100) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xs);
}

.hero-content {
  flex: 1 1 320px;
}

.hero-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin: 0 0 var(--space-1);
}

@media (min-width: 640px) {
  .hero-title {
    font-size: var(--font-size-2xl);
  }
}

.hero-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 580px;
}

.cart-pill-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 18px;
  background-color: var(--color-surface);
  border: 1.5px solid var(--color-primary-700);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.cart-pill-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background-color: var(--color-primary-100);
}

.cart-icon {
  font-size: 20px;
}

.cart-info {
  display: flex;
  flex-direction: column;
}

.cart-count-text {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary-900);
}

.cart-total-text {
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-primary-700);
}

.cart-arrow {
  color: var(--color-primary-700);
  font-weight: 700;
  font-size: var(--font-size-sm);
}

/* Controls: Search & Chips */
.catalog-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .catalog-controls {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 280px;
  max-width: 450px;
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
  box-shadow: 0 0 0 3px rgba(18, 48, 71, 0.1);
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

.filter-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-chip {
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

.filter-chip:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-800);
}

.filter-chip.active {
  background-color: var(--color-primary-900);
  border-color: var(--color-primary-900);
  color: #ffffff;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.product-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-fast);
}

.product-card:hover {
  border-color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.product-card.is-out-of-stock {
  opacity: 0.75;
  background-color: #fafbfc;
}

.card-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.size-pill {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
}

.card-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-1);
}

.product-price {
  margin-bottom: var(--space-3);
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-val {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-700);
}

.price-unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.stock-pill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--color-surface-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-1);
}

.stock-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.stock-qty {
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.stock-note {
  font-size: 11px;
  color: var(--color-text-subtle);
  margin: 0 0 var(--space-4);
  line-height: 1.3;
}

/* Card Footer Controls */
.card-footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.order-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.qty-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface);
}

.qty-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  background-color: var(--color-surface-subtle);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--color-primary-100);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-field {
  width: 44px;
  height: 38px;
  border: none;
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  background: transparent;
  outline: none;
}

.add-to-cart-btn {
  flex: 1 1 0;
}

.out-of-stock-alert {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 12px;
  background-color: #fee2e2;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: #991b1b;
  font-weight: 600;
  line-height: 1.3;
}

.empty-state-wrapper {
  padding: var(--space-8) var(--space-4);
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}
</style>

