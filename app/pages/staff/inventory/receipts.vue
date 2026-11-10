<script setup lang="ts">
import { formatQuantity } from '~/composables/useFormatters'
import type { ReceiptPayload } from '~/composables/useInventory'

definePageMeta({ layout: 'staff' })

const { products } = useProducts()
const { recordReceipt, getBalance } = useInventory()
const { showSuccess, showError } = useNotification()
const { currentUser } = useAuth()

const activeProducts = computed(() => products.value.filter(p => p.active))

const selectedProductId = ref('')
const fullReceived = ref(0)
const emptySent = ref(0)
const reason = ref('')

const formErrors = reactive({
  product: '',
  fullReceived: '',
  emptySent: '',
})

function clearErrors() {
  formErrors.product = ''
  formErrors.fullReceived = ''
  formErrors.emptySent = ''
}

const selectedBalance = computed(() => {
  if (!selectedProductId.value) return null
  return getBalance(selectedProductId.value)
})

const selectedProduct = computed(() =>
  products.value.find(p => p.id === selectedProductId.value) ?? null
)

const previewFull = computed(() => selectedBalance.value ? selectedBalance.value.full_qty + (fullReceived.value || 0) : null)
const previewEmpty = computed(() => selectedBalance.value ? selectedBalance.value.empty_qty - (emptySent.value || 0) : null)
const previewAvailable = computed(() => {
  if (previewFull.value === null || !selectedBalance.value) return null
  return Math.max(0, previewFull.value - selectedBalance.value.reserved_qty)
})

function validate(): boolean {
  clearErrors()
  let ok = true
  if (!selectedProductId.value) { formErrors.product = 'Pilih produk terlebih dahulu.'; ok = false }
  if (!Number.isInteger(fullReceived.value) || fullReceived.value < 0) { formErrors.fullReceived = 'Jumlah harus bilangan bulat ≥ 0.'; ok = false }
  if (!Number.isInteger(emptySent.value) || emptySent.value < 0) { formErrors.emptySent = 'Jumlah harus bilangan bulat ≥ 0.'; ok = false }
  if (fullReceived.value === 0 && emptySent.value === 0) { formErrors.fullReceived = 'Minimal salah satu nilai harus > 0.'; ok = false }
  if (selectedBalance.value && emptySent.value > selectedBalance.value.empty_qty) {
    formErrors.emptySent = `Melebihi stok kosong (${selectedBalance.value.empty_qty} tabung tersedia).`
    ok = false
  }
  return ok
}

const isConfirmOpen = ref(false)
const isSubmitting = ref(false)

function handlePreview() {
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
      actor: currentUser.value?.username ?? 'karyawan',
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
    <div class="page-header">
      <div>
        <h1 class="page-title">🚚 Catat Penerimaan Pasokan</h1>
        <p class="page-desc">Catat tabung penuh yang diterima dan tabung kosong yang dikirim ke agen.</p>
      </div>
      <NuxtLink to="/staff/inventory">
        <BaseButton variant="ghost">← Ringkasan Stok</BaseButton>
      </NuxtLink>
    </div>

    <div class="form-layout">
      <div class="form-panel">
        <h2 class="panel-title">Data Penerimaan</h2>

        <div class="field-group">
          <label class="field-label required-mark">Produk</label>
          <select v-model="selectedProductId" :class="['field-select', { 'has-error': formErrors.product }]">
            <option value="">-- Pilih Produk --</option>
            <option v-for="p in activeProducts" :key="p.id" :value="p.id">{{ p.name }} ({{ p.size_kg }} kg)</option>
          </select>
          <p v-if="formErrors.product" class="error-msg">{{ formErrors.product }}</p>
        </div>

        <div v-if="selectedBalance && selectedProduct" class="current-balance">
          <p class="balance-title">Saldo Saat Ini</p>
          <div class="balance-row">
            <div class="balance-item"><span class="bal-label">Penuh</span><span class="bal-val qty-full">{{ formatQuantity(selectedBalance.full_qty) }}</span></div>
            <div class="balance-item"><span class="bal-label">Kosong</span><span class="bal-val qty-empty">{{ formatQuantity(selectedBalance.empty_qty) }}</span></div>
            <div class="balance-item"><span class="bal-label">Tersedia</span><span class="bal-val qty-available">{{ formatQuantity(selectedBalance.available_qty) }}</span></div>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label required-mark">Tabung Penuh Diterima</label>
          <input :value="fullReceived" type="number" min="0" step="1" :class="['field-input', { 'has-error': formErrors.fullReceived }]" placeholder="0" @change="fullReceived = parsePosInt($event)" @input="fullReceived = parsePosInt($event)" />
          <p v-if="formErrors.fullReceived" class="error-msg">{{ formErrors.fullReceived }}</p>
        </div>

        <div class="field-group">
          <label class="field-label">Tabung Kosong Dikirim ke Agen</label>
          <input :value="emptySent" type="number" min="0" step="1" :class="['field-input', { 'has-error': formErrors.emptySent }]" placeholder="0" @change="emptySent = parsePosInt($event)" @input="emptySent = parsePosInt($event)" />
          <p class="field-hint" v-if="selectedBalance">Tersedia: <strong>{{ formatQuantity(selectedBalance.empty_qty) }}</strong></p>
          <p v-if="formErrors.emptySent" class="error-msg">{{ formErrors.emptySent }}</p>
        </div>

        <div class="field-group">
          <label class="field-label">Keterangan</label>
          <textarea v-model="reason" class="field-textarea" :rows="3" placeholder="Nomor surat jalan, atau keterangan lainnya (opsional)..." />
        </div>

        <div class="form-actions">
          <BaseButton variant="ghost" @click="resetForm">Reset</BaseButton>
          <BaseButton variant="primary" :disabled="!selectedProductId" @click="handlePreview">
            Tinjau & Konfirmasi
          </BaseButton>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="selectedBalance && selectedProduct" class="preview-panel">
        <h2 class="panel-title">Simulasi Perubahan</h2>
        <div class="preview-rows">
          <div class="preview-item">
            <span class="pi-label">Stok Penuh Sesudah</span>
            <span class="pi-val qty-full">{{ formatQuantity(previewFull ?? 0) }}</span>
          </div>
          <div class="preview-item">
            <span class="pi-label">Stok Kosong Sesudah</span>
            <span :class="['pi-val', (previewEmpty ?? 0) < 0 ? 'qty-low' : 'qty-empty']">{{ formatQuantity(previewEmpty ?? 0) }}</span>
          </div>
          <div class="preview-item preview-highlight">
            <span class="pi-label">Tersedia Sesudah</span>
            <span class="pi-val qty-available">{{ formatQuantity(previewAvailable ?? 0) }}</span>
          </div>
        </div>
        <div v-if="(previewEmpty ?? 0) < 0" class="preview-warning">
          ⚠️ Tabung kosong dikirim melebihi saldo. Kurangi jumlah.
        </div>
        <p class="preview-note">Tersedia = Penuh − Dialokasikan (min. 0). Tabung kosong bukan stok jual.</p>
      </div>
    </div>

    <BaseModal :is-open="isConfirmOpen" title="Konfirmasi Penerimaan Pasokan" size="md" @close="isConfirmOpen = false">
      <template #body>
        <div v-if="selectedProduct && selectedBalance" class="confirm-body">
          <p class="confirm-intro">Tinjau data berikut sebelum dikonfirmasi. Perubahan tidak dapat dibatalkan.</p>
          <div class="confirm-grid">
            <div class="confirm-row"><span class="confirm-label">Produk</span><span class="confirm-val fw-bold">{{ selectedProduct.name }}</span></div>
            <div class="confirm-row"><span class="confirm-label">Tabung Penuh Diterima</span><span class="confirm-val qty-full fw-bold">+{{ formatQuantity(fullReceived) }}</span></div>
            <div class="confirm-row"><span class="confirm-label">Tabung Kosong Dikirim</span><span class="confirm-val qty-empty fw-bold">-{{ formatQuantity(emptySent) }}</span></div>
            <div class="confirm-row"><span class="confirm-label">Keterangan</span><span class="confirm-val">{{ reason.trim() || 'Penerimaan pasokan dari agen' }}</span></div>
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="secondary" :disabled="isSubmitting" @click="isConfirmOpen = false">Batal</BaseButton>
        <BaseButton variant="primary" :loading="isSubmitting" @click="handleConfirm">✅ Konfirmasi & Simpan</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-receipts { display: flex; flex-direction: column; gap: var(--space-5); }
.page-header { display: flex; flex-direction: column; gap: var(--space-3); }
@media (min-width: 640px) { .page-header { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.page-title { font-size: var(--font-size-xl); font-weight: 700; margin: 0; }
.page-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
.form-layout { display: flex; flex-direction: column; gap: var(--space-5); }
@media (min-width: 900px) { .form-layout { flex-direction: row; align-items: flex-start; } }
.form-panel, .preview-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); flex: 1 1 0; }
.panel-title { font-size: var(--font-size-md); font-weight: 700; margin: 0 0 var(--space-4); }
.field-group { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
.field-label { font-size: var(--font-size-sm); font-weight: 600; }
.required-mark::after { content: ' *'; color: var(--color-danger); }
.field-select, .field-input, .field-textarea { padding: 9px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); background: var(--color-surface); width: 100%; box-sizing: border-box; }
.field-select:focus, .field-input:focus, .field-textarea:focus { border-color: var(--color-primary-700); outline: none; }
.has-error { border-color: var(--color-danger) !important; }
.field-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }
.error-msg { font-size: var(--font-size-xs); color: var(--color-danger); font-weight: 600; margin: 0; }
.current-balance { background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); }
.balance-title { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 var(--space-2); }
.balance-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.balance-item { display: flex; flex-direction: column; gap: 2px; }
.bal-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.bal-val { font-size: var(--font-size-sm); font-weight: 700; }
.form-actions { display: flex; gap: var(--space-2); justify-content: flex-end; border-top: 1px solid var(--color-border); padding-top: var(--space-3); }
.qty-full { color: var(--color-success); }
.qty-empty { color: var(--color-text-subtle); }
.qty-available { color: var(--color-primary-700); }
.qty-low { color: var(--color-danger) !important; }
.preview-rows { display: flex; flex-direction: column; gap: var(--space-3); }
.preview-item { display: flex; justify-content: space-between; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
.preview-item:hover { background: var(--color-surface-subtle); }
.preview-highlight { background: var(--color-primary-100); font-weight: 700; }
.pi-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.pi-val { font-size: var(--font-size-sm); font-weight: 700; }
.preview-warning { background: #fef3c7; border: 1px solid var(--color-warning); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--font-size-sm); color: #92400e; margin-top: var(--space-3); }
.preview-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.confirm-body { display: flex; flex-direction: column; gap: var(--space-3); }
.confirm-intro { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
.confirm-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.confirm-row { display: flex; justify-content: space-between; gap: var(--space-4); }
.confirm-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.confirm-val { font-size: var(--font-size-sm); text-align: right; }
.fw-bold { font-weight: 700; }
</style>
