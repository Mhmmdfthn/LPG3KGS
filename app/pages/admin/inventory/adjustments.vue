<script setup lang="ts">
import { formatQuantity } from '~/composables/useFormatters'
import type { AdjustmentPayload } from '~/composables/useInventory'

definePageMeta({ layout: 'admin' })

const { products } = useProducts()
const { balances, recordAdjustment, getBalance } = useInventory()
const { showSuccess, showError } = useNotification()
const { currentUser } = useAuth()

const activeProducts = computed(() => products.value.filter(p => p.active))

// ─── Form State ───────────────────────────────────────────────────
const selectedProductId = ref('')
const fullDelta = ref(0)
const emptyDelta = ref(0)
const reason = ref('')

const formErrors = reactive({
  product: '',
  fullDelta: '',
  emptyDelta: '',
  reason: '',
  general: '',
})

function clearErrors() {
  formErrors.product = ''
  formErrors.fullDelta = ''
  formErrors.emptyDelta = ''
  formErrors.reason = ''
  formErrors.general = ''
}

const selectedBalance = computed(() => {
  if (!selectedProductId.value) return null
  return getBalance(selectedProductId.value)
})

const selectedProduct = computed(() => {
  return products.value.find(p => p.id === selectedProductId.value) ?? null
})

// Preview sesudah koreksi
const previewFull = computed(() => {
  if (!selectedBalance.value) return null
  return selectedBalance.value.full_qty + (fullDelta.value || 0)
})
const previewEmpty = computed(() => {
  if (!selectedBalance.value) return null
  return selectedBalance.value.empty_qty + (emptyDelta.value || 0)
})
const previewAvailable = computed(() => {
  if (previewFull.value === null || !selectedBalance.value) return null
  return Math.max(0, previewFull.value - selectedBalance.value.reserved_qty)
})

const isPreviewNegative = computed(() => {
  return (previewFull.value !== null && previewFull.value < 0) ||
         (previewEmpty.value !== null && previewEmpty.value < 0)
})

// ─── Validasi ─────────────────────────────────────────────────────
function validate(): boolean {
  clearErrors()
  let ok = true

  if (!selectedProductId.value) {
    formErrors.product = 'Pilih produk terlebih dahulu.'
    ok = false
  }
  if (!reason.value.trim()) {
    formErrors.reason = 'Alasan koreksi wajib diisi.'
    ok = false
  }
  if (fullDelta.value === 0 && emptyDelta.value === 0) {
    formErrors.fullDelta = 'Minimal satu delta harus berbeda dari nol.'
    ok = false
  }
  if (!Number.isInteger(fullDelta.value)) {
    formErrors.fullDelta = 'Delta stok penuh harus bilangan bulat.'
    ok = false
  }
  if (!Number.isInteger(emptyDelta.value)) {
    formErrors.emptyDelta = 'Delta stok kosong harus bilangan bulat.'
    ok = false
  }
  if (selectedBalance.value) {
    if (selectedBalance.value.full_qty + fullDelta.value < 0) {
      formErrors.fullDelta = `Saldo penuh tidak boleh negatif. Saldo saat ini: ${selectedBalance.value.full_qty} tabung.`
      ok = false
    }
    if (selectedBalance.value.empty_qty + emptyDelta.value < 0) {
      formErrors.emptyDelta = `Saldo kosong tidak boleh negatif. Saldo saat ini: ${selectedBalance.value.empty_qty} tabung.`
      ok = false
    }
  }

  return ok
}

// ─── Modal Konfirmasi ─────────────────────────────────────────────
const isConfirmOpen = ref(false)
const isSubmitting = ref(false)

function handlePreviewSubmit() {
  if (!validate()) return
  isConfirmOpen.value = true
}

async function handleConfirm() {
  isSubmitting.value = true
  try {
    const payload: AdjustmentPayload = {
      product_id: selectedProductId.value,
      full_delta: fullDelta.value,
      empty_delta: emptyDelta.value,
      reason: reason.value.trim(),
      actor: currentUser.value?.username ?? 'admin',
    }
    await recordAdjustment(payload)
    isConfirmOpen.value = false
    showSuccess(`Koreksi stok berhasil dicatat untuk ${selectedProduct.value?.name}.`)
    resetForm()
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal mencatat koreksi stok.')
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  selectedProductId.value = ''
  fullDelta.value = 0
  emptyDelta.value = 0
  reason.value = ''
  clearErrors()
}

function parseDeltaInt(e: Event): number {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  return isNaN(val) ? 0 : val
}

function formatDeltaDisplay(val: number): string {
  if (val > 0) return `+${val} tabung`
  if (val < 0) return `${val} tabung`
  return '0 (tidak berubah)'
}

function deltaCls(val: number): string {
  if (val > 0) return 'delta-pos'
  if (val < 0) return 'delta-neg'
  return 'delta-zero'
}
</script>

<template>
  <div class="page-adjustments">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">⚙️ Koreksi Stok Fisik</h1>
        <p class="page-desc">Koreksi saldo inventaris berdasarkan penghitungan fisik. Hanya Admin.</p>
      </div>
      <NuxtLink to="/admin/inventory">
        <BaseButton variant="ghost">← Ringkasan Stok</BaseButton>
      </NuxtLink>
    </div>

    <!-- Warning Banner -->
    <div class="warning-banner">
      ⚠️ <strong>Perhatian:</strong> Koreksi stok adalah tindakan sensitif yang langsung mengubah saldo inventaris.
      Pastikan penghitungan fisik sudah selesai sebelum mencatat koreksi. Setiap perubahan akan dicatat dalam riwayat pergerakan stok.
    </div>

    <div class="form-layout">
      <!-- Form Panel -->
      <div class="form-panel">
        <h2 class="panel-title">Form Koreksi Stok</h2>

        <!-- Pilih Produk -->
        <div class="field-group">
          <label class="field-label required-mark">Produk</label>
          <select
            v-model="selectedProductId"
            :class="['field-select', { 'has-error': formErrors.product }]"
          >
            <option value="">-- Pilih Produk --</option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }} ({{ p.size_kg }} kg){{ !p.active ? ' — Nonaktif' : '' }}
            </option>
          </select>
          <p v-if="formErrors.product" class="error-msg">{{ formErrors.product }}</p>
        </div>

        <!-- Saldo Sekarang -->
        <div v-if="selectedBalance && selectedProduct" class="current-balance">
          <p class="balance-title">Saldo Sebelum Koreksi — {{ selectedProduct.name }}</p>
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
          <p class="balance-note">Saldo dialokasikan (reserved) tidak dapat diubah melalui koreksi stok.</p>
        </div>

        <!-- Delta Stok Penuh -->
        <div class="field-group">
          <label class="field-label required-mark">Delta Stok Penuh</label>
          <input
            :value="fullDelta"
            type="number"
            step="1"
            :class="['field-input', { 'has-error': formErrors.fullDelta }]"
            placeholder="Contoh: +10 atau -5"
            @change="fullDelta = parseDeltaInt($event)"
            @input="fullDelta = parseDeltaInt($event)"
          />
          <p class="field-hint">
            Positif (+) untuk menambah stok penuh, negatif (−) untuk mengurangi.
            <template v-if="selectedBalance">
              Nilai boleh antara {{ -selectedBalance.full_qty }} s.d. tak terbatas.
            </template>
          </p>
          <p v-if="formErrors.fullDelta" class="error-msg">{{ formErrors.fullDelta }}</p>
        </div>

        <!-- Delta Stok Kosong -->
        <div class="field-group">
          <label class="field-label required-mark">Delta Stok Kosong</label>
          <input
            :value="emptyDelta"
            type="number"
            step="1"
            :class="['field-input', { 'has-error': formErrors.emptyDelta }]"
            placeholder="Contoh: +5 atau -3"
            @change="emptyDelta = parseDeltaInt($event)"
            @input="emptyDelta = parseDeltaInt($event)"
          />
          <p class="field-hint">
            Positif (+) untuk menambah stok kosong, negatif (−) untuk mengurangi.
            <template v-if="selectedBalance">
              Nilai boleh antara {{ -selectedBalance.empty_qty }} s.d. tak terbatas.
            </template>
          </p>
          <p v-if="formErrors.emptyDelta" class="error-msg">{{ formErrors.emptyDelta }}</p>
        </div>

        <!-- Alasan Koreksi -->
        <div class="field-group">
          <label class="field-label required-mark">Alasan Koreksi</label>
          <textarea
            v-model="reason"
            :class="['field-textarea', { 'has-error': formErrors.reason }]"
            rows="3"
            placeholder="Contoh: Selisih stok fisik setelah stock opname tanggal 1 November 2026..."
          />
          <p v-if="formErrors.reason" class="error-msg">{{ formErrors.reason }}</p>
        </div>

        <!-- Tombol -->
        <div class="form-actions">
          <BaseButton variant="ghost" type="button" @click="resetForm">Reset</BaseButton>
          <BaseButton
            variant="danger"
            type="button"
            :disabled="!selectedProductId"
            @click="handlePreviewSubmit"
          >
            ⚙️ Tinjau & Konfirmasi Koreksi
          </BaseButton>
        </div>
      </div>

      <!-- Preview Panel -->
      <div v-if="selectedBalance && selectedProduct" class="preview-panel">
        <h2 class="panel-title">Simulasi Saldo Sesudah Koreksi</h2>

        <div class="preview-table">
          <div class="preview-header">
            <span>Saldo</span>
            <span>Sebelum</span>
            <span>Delta</span>
            <span>Sesudah</span>
          </div>
          <div class="preview-row">
            <span class="preview-item-label">Stok Penuh</span>
            <span>{{ formatQuantity(selectedBalance.full_qty) }}</span>
            <span :class="deltaCls(fullDelta)">{{ formatDeltaDisplay(fullDelta) }}</span>
            <span :class="['preview-after', (previewFull ?? 0) < 0 ? 'qty-low' : 'qty-full']">
              {{ formatQuantity(Math.max(0, previewFull ?? 0)) }}
              <span v-if="(previewFull ?? 0) < 0" class="neg-warn">⛔ Negatif!</span>
            </span>
          </div>
          <div class="preview-row">
            <span class="preview-item-label">Stok Kosong</span>
            <span>{{ formatQuantity(selectedBalance.empty_qty) }}</span>
            <span :class="deltaCls(emptyDelta)">{{ formatDeltaDisplay(emptyDelta) }}</span>
            <span :class="['preview-after', (previewEmpty ?? 0) < 0 ? 'qty-low' : 'qty-empty']">
              {{ formatQuantity(Math.max(0, previewEmpty ?? 0)) }}
              <span v-if="(previewEmpty ?? 0) < 0" class="neg-warn">⛔ Negatif!</span>
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
            <span>→</span>
            <span class="preview-after qty-available">{{ formatQuantity(previewAvailable ?? 0) }}</span>
          </div>
        </div>

        <!-- Peringatan saldo negatif -->
        <div v-if="isPreviewNegative" class="preview-error">
          ⛔ <strong>Koreksi tidak dapat disimpan.</strong>
          Delta menyebabkan saldo negatif. Sesuaikan nilai delta.
        </div>

        <div class="preview-rule-note">
          Stok tersedia = Stok Penuh − Dialokasikan (min. 0).
          Saldo reserved tidak berubah akibat koreksi stok.
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi -->
    <BaseModal
      :is-open="isConfirmOpen"
      title="Konfirmasi Koreksi Stok"
      size="md"
      @close="isConfirmOpen = false"
    >
      <template #body>
        <div v-if="selectedProduct && selectedBalance" class="confirm-body">
          <div class="confirm-warning">
            ⚠️ Tindakan ini akan langsung mengubah saldo inventaris dan tidak dapat dibatalkan.
            Pastikan data sudah benar.
          </div>
          <div class="confirm-grid">
            <div class="confirm-row">
              <span class="confirm-label">Produk</span>
              <span class="confirm-val fw-bold">{{ selectedProduct.name }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Delta Stok Penuh</span>
              <span :class="['confirm-val fw-bold', deltaCls(fullDelta)]">
                {{ formatDeltaDisplay(fullDelta) }}
              </span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Delta Stok Kosong</span>
              <span :class="['confirm-val fw-bold', deltaCls(emptyDelta)]">
                {{ formatDeltaDisplay(emptyDelta) }}
              </span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Alasan</span>
              <span class="confirm-val">{{ reason }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Dicatat oleh</span>
              <span class="confirm-val">{{ currentUser?.username ?? 'admin' }}</span>
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
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton variant="secondary" :disabled="isSubmitting" @click="isConfirmOpen = false">
          Batal
        </BaseButton>
        <BaseButton variant="danger" :loading="isSubmitting" @click="handleConfirm">
          ⚙️ Simpan Koreksi
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-adjustments { display: flex; flex-direction: column; gap: var(--space-5); }
.page-header { display: flex; flex-direction: column; gap: var(--space-3); }
@media (min-width: 640px) { .page-header { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.page-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }
.page-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

.warning-banner {
  background: #fef3c7;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  color: #92400e;
}

.form-layout { display: flex; flex-direction: column; gap: var(--space-5); }
@media (min-width: 900px) { .form-layout { flex-direction: row; align-items: flex-start; } }

.form-panel, .preview-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  flex: 1 1 0;
}
.panel-title { font-size: var(--font-size-md); font-weight: 700; margin: 0 0 var(--space-4); }

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
.balance-note { font-size: var(--font-size-xs); color: var(--color-text-subtle); margin: var(--space-2) 0 0; }

.form-actions { display: flex; gap: var(--space-2); justify-content: flex-end; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }

.qty-full { color: var(--color-success); }
.qty-empty { color: var(--color-text-subtle); }
.qty-reserved { color: var(--color-warning); }
.qty-available { color: var(--color-primary-700); }
.qty-low { color: var(--color-danger) !important; }

/* Preview */
.preview-table { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--space-3); }
.preview-header {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
  font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; padding: var(--space-2) var(--space-3);
  background: var(--color-surface-subtle); border-radius: var(--radius-sm);
}
.preview-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm); align-items: center; border-radius: var(--radius-sm);
}
.preview-row:hover { background: var(--color-surface-subtle); }
.preview-row-divider { border-top: 1px dashed var(--color-border); padding-top: var(--space-2); }
.preview-highlight { background: var(--color-primary-100); font-weight: 700; }
.preview-item-label { font-weight: 600; }
.preview-after { font-weight: 700; }
.neg-warn { font-size: var(--font-size-xs); margin-left: 4px; }
.preview-error {
  background: #fee2e2;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  color: #991b1b;
  margin-bottom: var(--space-3);
}
.preview-rule-note { font-size: var(--font-size-xs); color: var(--color-text-muted); border-top: 1px solid var(--color-border); padding-top: var(--space-3); }

.delta-pos { color: var(--color-success); font-weight: 600; }
.delta-neg { color: var(--color-danger); font-weight: 600; }
.delta-zero { color: var(--color-text-muted); font-size: var(--font-size-xs); }

/* Modal */
.confirm-body { display: flex; flex-direction: column; gap: var(--space-3); }
.confirm-warning { background: #fef3c7; border: 1px solid var(--color-warning); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--font-size-sm); color: #92400e; }
.confirm-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.confirm-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); }
.confirm-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 500; }
.confirm-val { font-size: var(--font-size-sm); color: var(--color-text); text-align: right; }
.fw-bold { font-weight: 700; }
hr { border: none; border-top: 1px solid var(--color-border); }
</style>
