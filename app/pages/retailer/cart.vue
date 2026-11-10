<script setup lang="ts">
import { formatRupiah, formatQuantity } from '~/composables/useFormatters'

definePageMeta({
  layout: 'retailer'
})

const {
  cart,
  cartCount,
  cartTotal,
  updateCartQty,
  removeFromCart,
  clearCart,
  createOrder,
  syncCartWithProducts
} = useOrders()

const { products, loaded: productsLoaded, ensureLoaded } = useProducts()

// Stok pengecer berasal dari master produk; muat sekali sebelum validasi.
onMounted(async () => {
  await ensureLoaded().catch(() => {})
  syncCartWithProducts()
})

const { currentUser } = useAuth()
const { showSuccess, showError, showWarning } = useNotification()

// ─── Modal States ─────────────────────────────────────────────────
const isConfirmSubmitOpen = ref(false)
const isConfirmClearOpen = ref(false)
const isSubmittingOrder = ref(false)

// Item keranjang dengan validasi stok terkini
const cartItemsWithStock = computed(() => {
  return cart.value.map(item => {
    const product = products.value.find(p => p.id === item.product_id)
    const available = product ? Number(product.available_qty ?? 0) : 0
    return {
      ...item,
      available_qty: available,
      stock_known: !!product,
      is_missing: productsLoaded.value && !product,
      subtotal: item.price * item.quantity,
      is_exceeded: !!product && item.quantity > available,
      is_out_of_stock: !!product && available <= 0
    }
  })
})

// Apakah ada item yang kuantitasnya melebihi stok yang tersedia saat ini
const hasStockConflict = computed(() => {
  return cartItemsWithStock.value.some(item => item.is_exceeded || item.is_out_of_stock || item.is_missing)
})

function handleQtyChange(productId: string, newQty: number, maxAvailable: number) {
  const row = cartItemsWithStock.value.find(item => item.product_id === productId)
  if (!row?.stock_known) {
    showWarning('Stok produk masih dimuat. Coba lagi sebentar.')
    return
  }
  if (newQty < 1) {
    removeFromCart(productId)
    showWarning('Produk dihapus dari keranjang.')
    return
  }
  if (newQty > maxAvailable) {
    showError(`Kuantitas melebihi stok tersedia (${maxAvailable} tabung).`)
    return
  }
  try {
    updateCartQty(productId, newQty)
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal memperbarui kuantitas.')
  }
}

function handleRemoveItem(productId: string, productName: string) {
  removeFromCart(productId)
  showSuccess(`${productName} dihapus dari keranjang.`)
}

function handleClearCartConfirm() {
  clearCart()
  isConfirmClearOpen.value = false
  showSuccess('Keranjang belanja berhasil dikosongkan.')
}

function openOrderConfirmation() {
  if (cart.value.length === 0) {
    showError('Keranjang Anda masih kosong.')
    return
  }
  if (hasStockConflict.value) {
    showError('Terdapat produk yang melebihi stok tersedia. Sesuaikan kuantitas terlebih dahulu.')
    return
  }
  isConfirmSubmitOpen.value = true
}

async function handleSubmitOrder() {
  isSubmittingOrder.value = true
  try {
    const newOrder = await createOrder()
    isConfirmSubmitOpen.value = false

    showSuccess(
      `Pesanan ${newOrder.number} berhasil diajukan! Status saat ini: MENUNGGU KONFIRMASI.`,
      'Pesanan Berhasil Diajukan'
    )

    // Arahkan ke halaman riwayat pesanan saya
    await navigateTo('/retailer/orders')
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal mengajukan pesanan.')
  } finally {
    isSubmittingOrder.value = false
  }
}
</script>

<template>
  <div class="retailer-cart-page">
    <!-- Header -->
    <div class="cart-header">
      <div>
        <h1 class="page-title">🛍️ Keranjang Pesanan</h1>
        <p class="page-desc">
          Periksa kembali rincian tabung gas sebelum mengajukan pesanan ke pangkalan.
        </p>
      </div>

      <NuxtLink to="/retailer/catalog">
        <BaseButton variant="ghost" size="sm">← Tambah Produk Lain</BaseButton>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div v-if="cart.length === 0" class="empty-cart-card">
      <EmptyState
        title="Keranjang Belanja Masih Kosong"
        description="Anda belum menambahkan tabung gas ke dalam keranjang belanja."
      >
        <template #actions>
          <NuxtLink to="/retailer/catalog">
            <BaseButton variant="primary">Jelajahi Katalog Produk</BaseButton>
          </NuxtLink>
        </template>
      </EmptyState>
    </div>

    <!-- Cart Layout with Items & Summary -->
    <div v-else class="cart-layout">
      <!-- Item List Section -->
      <div class="cart-items-section">
        <!-- Stock Conflict Warning Banner -->
        <div v-if="hasStockConflict" class="conflict-alert">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Peringatan Ketersediaan Stok:</strong> Beberapa item di keranjang melebihi stok
            tersedia di pangkalan. Harap kurangi kuantitas agar dapat mengajukan pesanan.
          </div>
        </div>

        <div class="items-card">
          <div class="card-header-row">
            <h2 class="section-title">Daftar Produk ({{ cartItemsWithStock.length }} jenis)</h2>
            <button
              type="button"
              class="clear-btn"
              @click="isConfirmClearOpen = true"
            >
              Kosongkan Keranjang
            </button>
          </div>

          <div class="cart-items-list">
            <div
              v-for="item in cartItemsWithStock"
              :key="item.product_id"
              :class="['cart-item-row', { 'has-error': item.is_exceeded || item.is_out_of_stock || item.is_missing }]"
            >
              <div class="item-info">
                <div class="item-badge-title">
                  <span class="size-pill">{{ item.size_kg }} kg</span>
                  <h3 class="item-name">{{ item.product_name }}</h3>
                </div>
                <div class="item-price-unit">
                  {{ formatRupiah(item.price) }} / tabung
                </div>
                <div class="item-stock-notice">
                  Stok pangkalan tersedia:
                  <strong v-if="!item.stock_known && !item.is_missing" class="text-muted">memuat…</strong>
                  <strong v-else :class="{ 'text-danger': item.is_out_of_stock || item.is_missing }">
                    {{ item.is_missing ? 'tidak tersedia' : formatQuantity(item.available_qty) }}
                  </strong>
                </div>
                <div v-if="item.is_exceeded" class="item-error-msg">
                  ⚠️ Kuantitas dipesan ({{ item.quantity }}) melebihi stok tersedia ({{ item.available_qty }}).
                </div>
                <div v-else-if="item.is_missing" class="item-error-msg">
                  ⚠️ Produk ini sudah tidak tersedia di katalog. Hapus dari keranjang untuk melanjutkan.
                </div>
              </div>

              <div class="item-actions">
                <div class="qty-counter">
                  <button
                    type="button"
                    class="qty-btn"
                    title="Kurangi"
                    @click="handleQtyChange(item.product_id, item.quantity - 1, item.available_qty)"
                  >
                    −
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="!item.stock_known || item.quantity >= item.available_qty"
                    title="Tambah"
                    @click="handleQtyChange(item.product_id, item.quantity + 1, item.available_qty)"
                  >
                    +
                  </button>
                </div>

                <div class="subtotal-cell">
                  <span class="subtotal-label">Subtotal</span>
                  <span class="subtotal-value">{{ formatRupiah(item.subtotal) }}</span>
                </div>

                <button
                  type="button"
                  class="delete-btn"
                  title="Hapus item"
                  @click="handleRemoveItem(item.product_id, item.product_name)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary & Checkout Section -->
      <div class="cart-summary-section">
        <div class="summary-card">
          <h2 class="summary-title">Ringkasan Pesanan</h2>

          <div class="summary-rows">
            <div class="summary-row">
              <span class="row-label">Total Kuantitas</span>
              <span class="row-value">{{ formatQuantity(cartCount) }}</span>
            </div>
            <div class="summary-row">
              <span class="row-label">Jumlah Jenis Produk</span>
              <span class="row-value">{{ cart.length }} jenis</span>
            </div>
            <div class="summary-row">
              <span class="row-label">Pemesan (Pengecer)</span>
              <span class="row-value text-right">
                {{ currentUser?.business_name || currentUser?.name || 'Pengecer Aktif' }}
              </span>
            </div>
            <hr class="summary-divider" />
            <div class="summary-row total-row">
              <span class="total-label">Total Pembayaran</span>
              <span class="total-value">{{ formatRupiah(cartTotal) }}</span>
            </div>
          </div>

          <!-- PRD Business Rules Note -->
          <div class="rule-box">
            <p class="rule-title">ℹ️ Aturan Pemesanan:</p>
            <ul class="rule-list">
              <li>Pesanan yang diajukan berstatus <strong>MENUNGGU KONFIRMASI</strong>.</li>
              <li>Stok fisik tabung baru dialokasikan setelah disetujui Admin/Petugas pangkalan.</li>
              <li>Pengajuan pesanan ini tidak langsung mengurangi saldo stok pangkalan.</li>
            </ul>
          </div>

          <BaseButton
            variant="primary"
            size="lg"
            class="submit-order-btn"
            :disabled="hasStockConflict || cart.length === 0"
            @click="openOrderConfirmation"
          >
            Ajukan Pesanan Sekarang
          </BaseButton>

          <NuxtLink to="/retailer/catalog" class="back-link">
            ← Tambah Tabung Lain
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Pengajuan Pesanan -->
    <BaseModal
      :is-open="isConfirmSubmitOpen"
      title="Konfirmasi Pengajuan Pesanan"
      size="md"
      @close="isConfirmSubmitOpen = false"
    >
      <template #body>
        <div class="confirm-content">
          <p class="confirm-intro">
            Apakah Anda yakin ingin mengajukan pesanan ini ke pangkalan LPG?
          </p>

          <div class="confirm-items-box">
            <div
              v-for="item in cart"
              :key="item.product_id"
              class="confirm-item-line"
            >
              <span>{{ item.quantity }}x {{ item.product_name }}</span>
              <span class="fw-bold">{{ formatRupiah(item.price * item.quantity) }}</span>
            </div>
            <hr />
            <div class="confirm-total-line">
              <span>Total Pesanan</span>
              <span class="text-primary fw-800">{{ formatRupiah(cartTotal) }}</span>
            </div>
          </div>

          <p class="confirm-note">
            Setelah diajukan, status pesanan menjadi <strong>MENUNGGU KONFIRMASI</strong>.
            Admin atau petugas pangkalan akan memverifikasi ketersediaan stok fisik sebelum menyetujui.
          </p>
        </div>
      </template>

      <template #footer>
        <BaseButton
          variant="secondary"
          :disabled="isSubmittingOrder"
          @click="isConfirmSubmitOpen = false"
        >
          Periksa Kembali
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="isSubmittingOrder"
          @click="handleSubmitOrder"
        >
          ✅ Ya, Ajukan Pesanan
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal Konfirmasi Kosongkan Keranjang -->
    <BaseModal
      :is-open="isConfirmClearOpen"
      title="Kosongkan Keranjang"
      size="sm"
      @close="isConfirmClearOpen = false"
    >
      <template #body>
        <p class="text-sm text-muted">
          Apakah Anda yakin ingin menghapus seluruh produk dari keranjang belanja?
        </p>
      </template>
      <template #footer>
        <BaseButton variant="secondary" @click="isConfirmClearOpen = false">Batal</BaseButton>
        <BaseButton variant="danger" @click="handleClearCartConfirm">Ya, Kosongkan</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.retailer-cart-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.cart-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (min-width: 640px) {
  .cart-header {
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

.empty-cart-card {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-4);
}

/* Cart Layout */
.cart-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 900px) {
  .cart-layout {
    flex-direction: row;
    align-items: flex-start;
  }
}

.cart-items-section {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.conflict-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: #fee2e2;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #991b1b;
}

.items-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.clear-btn:hover {
  background-color: var(--color-danger-bg);
}

/* Item Rows */
.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cart-item-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  transition: all var(--transition-fast);
}

@media (min-width: 640px) {
  .cart-item-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.cart-item-row.has-error {
  border-color: var(--color-danger);
  background-color: #fffaf0;
}

.item-info {
  flex: 1 1 auto;
}

.item-badge-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 4px;
}

.size-pill {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.item-name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.item-price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-primary-700);
  font-weight: 600;
  margin-bottom: 2px;
}

.item-stock-notice {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.item-error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  font-weight: 600;
  margin-top: 4px;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .item-actions {
    justify-content: flex-end;
  }
}

/* Qty Counter */
.qty-counter {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-surface);
}

.qty-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  background-color: var(--color-surface-subtle);
  border: none;
  cursor: pointer;
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--color-primary-100);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-num {
  width: 36px;
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.subtotal-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 100px;
}

.subtotal-label {
  font-size: 10px;
  color: var(--color-text-subtle);
  text-transform: uppercase;
}

.subtotal-value {
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-primary-900);
}

.delete-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background-color: var(--color-danger-bg);
  border-color: var(--color-danger);
}

/* Summary Section */
.cart-summary-section {
  width: 100%;
}

@media (min-width: 900px) {
  .cart-summary-section {
    width: 340px;
    flex-shrink: 0;
  }
}

.summary-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.summary-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.row-label {
  color: var(--color-text-muted);
}

.row-value {
  font-weight: 600;
  color: var(--color-text);
}

.summary-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.total-row {
  padding-top: var(--space-1);
}

.total-label {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.total-value {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-700);
}

.rule-box {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.rule-title {
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--color-text);
}

.rule-list {
  padding-left: var(--space-4);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.submit-order-btn {
  width: 100%;
}

.back-link {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-primary-700);
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

/* Modal Content */
.confirm-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.confirm-intro {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin: 0;
}

.confirm-items-box {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.confirm-item-line,
.confirm-total-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.confirm-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
  margin: 0;
}

.text-right {
  text-align: right;
}
.fw-bold {
  font-weight: 700;
}
.fw-800 {
  font-weight: 800;
}
.text-primary {
  color: var(--color-primary-700);
}
</style>

