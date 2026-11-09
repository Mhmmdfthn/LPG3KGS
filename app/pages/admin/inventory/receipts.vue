<script setup lang="ts">
import { formatQuantity } from '~/composables/useFormatters'
import type { ReceiptPayload } from '~/composables/useInventory'

definePageMeta({ layout: 'admin' })

const { products } = useProducts()
const { balances, recordReceipt, getBalance } = useInventory()
const { showSuccess, showError } = useNotification()
const { currentUser } = useAuth()

// Hanya produk aktif yang dapat dipilih
const activeProducts = computed(() => products.value.filter(p => p.active))

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Form State ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const selectedProductId = ref('')
const fullReceived = ref(0)
const emptySent = ref(0)
const reason = ref('')

const formErrors = reactive({
  product: '',
  fullReceived: '',
  emptySent: '',
  reason: '',
})

function clearErrors() {
  formErrors.product = ''
  formErrors.fullReceived = ''
  formErrors.emptySent = ''
  formErrors.reason = ''
}

// Saldo produk yang dipilih
const selectedBalance = computed(() => {
  if (!selectedProductId.value) return null
  return getBalance(selectedProductId.value)
})

const selectedProduct = computed(() => {
  return products.value.find(p => p.id === selectedProductId.value) ?? null
})

// Simulasi saldo setelah penerimaan (preview)
const previewFull = computed(() => {
  if (!selectedBalance.value) return null
  return selectedBalance.value.full_qty + (fullReceived.value || 0)
})
const previewEmpty = computed(() => {
  if (!selectedBalance.value) return null
  return selectedBalance.value.empty_qty - (emptySent.value || 0)
})
const previewAvailable = computed(() => {
  if (previewFull.value === null || !selectedBalance.value) return null
  return Math.max(0, previewFull.value - selectedBalance.value.reserved_qty)
})

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Validasi ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function validate(): boolean {
  clearErrors()
  let ok = true

  if (!selectedProductId.value) {
    formErrors.product = 'Pilih produk terlebih dahulu.'
    ok = false
  }
  if (!Number.isInteger(fullReceived.value) || fullReceived.value < 0) {
    formErrors.fullReceived = 'Jumlah tabung penuh harus bilangan bulat ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 0.'
    ok = false
  }
  if (!Number.isInteger(emptySent.value) || emptySent.value < 0) {
    formErrors.emptySent = 'Jumlah tabung kosong harus bilangan bulat ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 0.'
    ok = false
  }
  if (fullReceived.value === 0 && emptySent.value === 0) {
    formErrors.fullReceived = 'Minimal salah satu nilai harus lebih dari 0.'
    ok = false
  }
  if (selectedBalance.value && emptySent.value > selectedBalance.value.empty_qty) {
    formErrors.emptySent = `Melebihi stok kosong tersedia (${selectedBalance.value.empty_qty} tabung).`
    ok = false
  }

  return ok
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Modal Konfirmasi ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const isConfirmOpen = ref(false)
const isSubmitting = ref(false)

function handlePreviewSubmit() {
  if (!validate()) return
  isConfirmOpen.value = true
}

async function handleConfirm() {
  isSubmitting.value = true
  try {
    const payload: ReceiptPayload = {
      product_id: selectedProductId.value,
      full_received: fullReceived.value,
      empty_sent: emptySent.value,
      reason: reason.value.trim() || 'Penerimaan pasokan dari agen',
      actor: currentUser.value?.username ?? 'admin',
    }
    await recordReceipt(payload)
    isConfirmOpen.value = false
    showSuccess(`Pasokan berhasil dicatat untuk ${selectedProduct.value?.name}.`)
    resetForm()
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal mencatat pasokan.')
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  selectedProductId.value = ''
  fullReceived.value = 0
  emptySent.value = 0
  reason.value = ''
  clearErrors()
}

function parsePosInt(e: Event): number {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  return isNaN(val) || val < 0 ? 0 : val
}
</script>

<template>
  <div class="page-receipts">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ÃƒÂ°Ã…Â¸Ã…Â¡Ã…Â¡ Catat Penerimaan Pasokan Agen</h1>
        <p class="page-desc">Catat tabung penuh yang diterima dan tabung kosong yang dikirim kembali ke agen.</p>
      </div>
      <NuxtLink to="/admin/inventory">
        <BaseButton variant="ghost">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Ringkasan Stok</BaseButton>
      </NuxtLink>
    </div>

    <div class="form-layout">
      <!-- Form Panel -->
      <div class="form-panel">
        <h2 class="panel-title">Data Penerimaan</h2>

        <!-- Pilih Produk -->
        <div class="field-group">
          <label class="field-label required-mark">Produk</label>
          <select
            v-model="selectedProductId"
            :class="['field-select', { 'has-error': formErrors.product }]"
          >
            <option value="">-- Pilih Produk --</option>
            <option v-for="p in activeProducts" :key="p.id" :value="p.id">
              {{ p.name }} ({{ p.size_kg }} kg)
            </option>
          </select>
          <p v-if="formErrors.product" class="error-msg">{{ formErrors.product }}</p>
        </div>

        <!-- Saldo Sekarang (jika produk dipilih) -->
        <div v-if="selectedBalance && selectedProduct" class="current-balance">
          <p class="balance-title">Saldo Saat Ini ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {{ selectedProduct.name }}</p>
          <div class="balance-row">
            <div class="balance-item">
              <span class="bal-label">Stok Penuh</span>
              <span class="bal-val qty-full">{{ formatQuantity(selectedBalance.full_qty) }}</span>
            </div>
            <div class="balance-item">
              <span class="bal-label">Stok Kosong</span>
              <span class="bal-val qty-empty">{{ formatQuantity(selectedBalance.empty_qty) }}</span>
            </div>
            <div class="balance-item">
              <span class="bal-label">Dialokasikan</span>
              <span class="bal-val qty-reserved">{{ formatQuantity(selectedBalance.reserved_qty) }}</span>
            </div>
            <div class="balance-item">
              <span class="bal-label">Tersedia</span>
              <span class="bal-val qty-available">{{ formatQuantity(selectedBalance.available_qty) }}</span>
            </div>
          </div>
        </div>

        <!-- Jumlah Tabung Penuh Diterima -->
        <div class="field-group">
          <label class="field-label required-mark">Tabung Penuh Diterima dari Agen</label>
          <input
            :value="fullReceived"
            type="number"
            min="0"
            step="1"
            :class="['field-input', { 'has-error': formErrors.fullReceived }]"
            placeholder="0"
            @change="fullReceived = parsePosInt($event)"
            @input="fullReceived = parsePosInt($event)"
          />
          <p class="field-hint">Jumlah tabung LPG penuh yang baru diterima dari agen distributor.</p>
          <p v-if="formErrors.fullReceived" class="error-msg">{{ formErrors.fullReceived }}</p>
        </div>

        <!-- Jumlah Tabung Kosong Dikirim -->
        <div class="field-group">
          <label class="field-label">Tabung Kosong Dikirim ke Agen</label>
          <input
            :value="emptySent"
            type="number"
            min="0"
            step="1"
            :class="['field-input', { 'has-error': formErrors.emptySent }]"
            placeholder="0"
            @change="emptySent = parsePosInt($event)"
            @input="emptySent = parsePosInt($event)"
          />
          <p class="field-hint">
            Jumlah tabung kosong yang dikembalikan ke agen.
            <template v-if="selectedBalance">
              Tersedia: <strong>{{ formatQuantity(selectedBalance.empty_qty) }}</strong>.
            </template>
          </p>
          <p v-if="formErrors.emptySent" class="error-msg">{{ formErrors.emptySent }}</p>
        </div>

        <!-- Keterangan -->
        <div class="field-group">
          <label class="field-label">Keterangan</label>
          <textarea
            v-model="reason"
            class="field-textarea"
            rows="3"
            placeholder="Keterangan pengiriman, nomor surat jalan, atau informasi relevan lainnya (opsional)..."
          />
        </div>

        <!-- Tombol -->
        <div class="form-actions">
          <BaseButton variant="ghost" type="button" @click="resetForm">Reset</BaseButton>
          <BaseButton
            variant="primary"
            type="button"
            :disabled="!selectedProductId"
            @click="handlePreviewSubmit"
          >
            Tinjau & Konfirmasi
          </BaseButton>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="selectedBalance && selectedProduct" class="preview-panel">
        <h2 class="panel-title">Simulasi Perubahan Saldo</h2>
        <p class="preview-note">
          Perubahan yang akan terjadi setelah pasokan dikonfirmasi:
        </p>
        <div class="preview-table">
          <div class="preview-header">
            <span>Saldo</span>
            <span>Sebelum</span>
            <span>Perubahan</span>
            <span>Sesudah</span>
          </div>
          <div class="preview-row">
            <span class="preview-item-label">Stok Penuh</span>
            <span>{{ formatQuantity(selectedBalance.full_qty) }}</span>
            <span :class="fullReceived > 0 ? 'delta-pos' : 'delta-zero'">
              {{ fullReceived > 0 ? `+${formatQuantity(fullReceived)}` : 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â' }}
            </span>
            <span class="preview-after qty-full">{{ formatQuantity(previewFull ?? 0) }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-item-label">Stok Kosong</span>
            <span>{{ formatQuantity(selectedBalance.empty_qty) }}</span>
            <span :class="emptySent > 0 ? 'delta-neg' : 'delta-zero'">
              {{ emptySent > 0 ? `-${formatQuantity(emptySent)}` : 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â' }}
            </span>
            <span :class="['preview-after', (previewEmpty ?? 0) < 0 ? 'qty-low' : 'qty-empty']">
              {{ formatQuantity(previewEmpty ?? 0) }}
            </span>
          </div>
          <div class="preview-row preview-row-divider">
            <span class="preview-item-label">Dialokasikan</span>
            <span>{{ formatQuantity(selectedBalance.reserved_qty) }}</span>
            <span class="delta-zero">tidak berubah</span>
            <span>{{ formatQuantity(selectedBalance.reserved_qty) }}</span>
          </div>
          <div class="preview-row preview-highlight">
            <span class="preview-item-label">Tersedia</span>
            <span>{{ formatQuantity(selectedBalance.available_qty) }}</span>
            <span>ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</span>
            <span class="preview-after qty-available">{{ formatQuantity(previewAvailable ?? 0) }}</span>
          </div>
        </div>
        <p class="preview-rule-note">
          Stok tersedia = Stok Penuh ÃƒÂ¢Ã‹â€ Ã¢â‚¬â„¢ Dialokasikan (min. 0).
          Tabung kosong bukan stok jual.
        </p>

        <!-- Peringatan saldo negatif -->
        <div v-if="(previewEmpty ?? 0) < 0" class="preview-warning">
          ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Jumlah tabung kosong yang dikirim melebihi saldo kosong saat ini. Kurangi jumlah pengiriman.
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi -->
    <BaseModal
      :is-open="isConfirmOpen"
      title="Konfirmasi Penerimaan Pasokan"
      size="md"
      @close="isConfirmOpen = false"
    >
      <template #body>
        <div v-if="selectedProduct && selectedBalance" class="confirm-body">
          <p class="confirm-intro">
            Tinjau kembali data penerimaan pasokan berikut sebelum dikonfirmasi.
            Perubahan tidak dapat dibatalkan setelah dikonfirmasi.
          </p>
          <div class="confirm-grid">
            <div class="confirm-row">
              <span class="confirm-label">Produk</span>
              <span class="confirm-val fw-bold">{{ selectedProduct.name }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Tabung Penuh Diterima</span>
              <span class="confirm-val qty-full fw-bold">+{{ formatQuantity(fullReceived) }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Tabung Kosong Dikirim</span>
              <span class="confirm-val qty-empty fw-bold">-{{ formatQuantity(emptySent) }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Keterangan</span>
              <span class="confirm-val">{{ reason.trim() || 'Penerimaan pasokan dari agen' }}</span>
            </div>
            <hr />
            <div class="confirm-row">
              <span class="confirm-label">Saldo Penuh Sesudah</span>
              <span class="confirm-val qty-full fw-bold">{{ formatQuantity(previewFull ?? 0) }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Saldo Kosong Sesudah</span>
              <span class="confirm-val qty-empty fw-bold">{{ formatQuantity(previewEmpty ?? 0) }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Tersedia Sesudah</span>
              <span class="confirm-val qty-available fw-bold">{{ formatQuantity(previewAvailable ?? 0) }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="secondary" :disabled="isSubmitting" @click="isConfirmOpen = false">
          Batal
        </BaseButton>
        <BaseButton variant="primary" :loading="isSubmitting" @click="handleConfirm">
          ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Konfirmasi & Simpan
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-receipts { display: flex; flex-direction: column; gap: var(--space-5); }
.page-header { display: flex; flex-direction: column; gap: var(--space-3); }
@media (min-width: 640px) { .page-header { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }
.page-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

.form-layout { display: flex; flex-direction: column; gap: var(--space-5); }
@media (min-width: 900px) { .form-layout { flex-direction: row; align-items: flex-start; } }

/* Form Panel */
.form-panel, .preview-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  flex: 1 1 0;
}
.panel-title { font-size: var(--font-size-md); font-weight: 700; color: var(--color-text); margin: 0 0 var(--space-4); }

.field-group { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
.field-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.required-mark::after { content: ' *'; color: var(--color-danger); }
.field-select, .field-input, .field-textarea {
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  width: 100%;
  box-sizing: border-box;
}
.field-select:focus, .field-input:focus, .field-textarea:focus { border-color: var(--color-primary-700); outline: none; }
.has-error { border-color: var(--color-danger) !important; }
.field-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }
.error-msg { font-size: var(--font-size-xs); color: var(--color-danger); font-weight: 600; margin: 0; }

/* Current Balance */
.current-balance {
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.balance-title { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 var(--space-2); }
.balance-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
@media (min-width: 480px) { .balance-row { grid-template-columns: repeat(4, 1fr); } }
.balance-item { display: flex; flex-direction: column; gap: 2px; }
.bal-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.bal-val { font-size: var(--font-size-sm); font-weight: 700; }
.qty-full { color: var(--color-success); }
.qty-empty { color: var(--color-text-subtle); }
.qty-reserved { color: var(--color-warning); }
.qty-available { color: var(--color-primary-700); }
.qty-low { color: var(--color-danger) !important; }

.form-actions { display: flex; gap: var(--space-2); justify-content: flex-end; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }

/* Preview Panel */
.preview-note { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-3); }
.preview-table { display: flex; flex-direction: column; gap: 2px; }
.preview-header {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
  font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; padding: var(--space-2) var(--space-3);
  background: var(--color-surface-subtle); border-radius: var(--radius-sm);
}
.preview-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  align-items: center;
}
.preview-row:hover { background: var(--color-surface-subtle); }
.preview-row-divider { border-top: 1px dashed var(--color-border); margin-top: var(--space-1); padding-top: var(--space-2); }
.preview-highlight { background: var(--color-primary-100); border-radius: var(--radius-sm); font-weight: 700; }
.preview-item-label { font-weight: 600; color: var(--color-text); }
.preview-after { font-weight: 700; }
.preview-rule-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: var(--space-3) 0 0; padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.preview-warning { background: #fef3c7; border: 1px solid var(--color-warning); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--font-size-sm); color: #92400e; margin-top: var(--space-3); }
.delta-pos { color: var(--color-success); font-weight: 600; }
.delta-neg { color: var(--color-danger); font-weight: 600; }
.delta-zero { color: var(--color-text-muted); font-size: var(--font-size-xs); }

/* Confirm Modal */
.confirm-body { display: flex; flex-direction: column; gap: var(--space-3); }
.confirm-intro { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
.confirm-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.confirm-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); }
.confirm-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 500; }
.confirm-val { font-size: var(--font-size-sm); color: var(--color-text); text-align: right; }
.fw-bold { font-weight: 700; }
hr { border: none; border-top: 1px solid var(--color-border); }
</style>
