<script setup lang="ts">
import { formatRupiah, formatQuantity, formatDateTime } from '~/composables/useFormatters'
import type { Order } from '~/types/orders'
import type { CompleteOrderPayload } from '~/composables/useOrders'

interface Props {
  orderId: string
  role: 'admin' | 'staff'
}

const props = defineProps<Props>()

const {
  getOrderById,
  confirmOrder,
  rejectOrder,
  cancelOrder,
  completeOrder
} = useOrders()

const { getBalance } = useInventory()
const { api } = useApi()
const { currentUser } = useAuth()
const { showSuccess, showError, showWarning } = useNotification()

const basePath = computed(() => (props.role === 'admin' ? '/admin/orders' : '/staff/orders'))
const currentActor = computed(() =>
  currentUser.value?.username || (props.role === 'admin' ? 'admin' : 'petugas_ops')
)

// Ambil data order
const order = computed(() => getOrderById(props.orderId))

// Ambil referensi penjualan jika status sudah SELESAI
const relatedSale = ref<any>(null)
watch(order, async (current) => {
  relatedSale.value = current?.sale_id ? await api(`/sales/${current.sale_id}`).catch(() => null) : null
}, { immediate: true })

// Cek ketersediaan stok untuk seluruh item (untuk konfirmasi)
const stockCheckResult = computed(() => {
  if (!order.value) return { canConfirm: false, items: [] }
  let allAvailable = true
  const items = order.value.items.map(it => {
    const bal = getBalance(it.product_id)
    const available = bal ? bal.available_qty : 0
    const isSufficient = available >= it.quantity
    if (!isSufficient) allAvailable = false
    return {
      ...it,
      available,
      isSufficient
    }
  })
  return { canConfirm: allAvailable, items }
})

// ─── Modal States ─────────────────────────────────────────────────
const isConfirmModalOpen = ref(false)
const isSubmittingConfirm = ref(false)

const isRejectModalOpen = ref(false)
const rejectReason = ref('')
const isSubmittingReject = ref(false)

const isCancelModalOpen = ref(false)
const cancelReason = ref('')
const isSubmittingCancel = ref(false)

const isCompleteModalOpen = ref(false)
const isSubmittingComplete = ref(false)

// Form Serah Terima & Pembayaran
interface HandoverReturnItem {
  product_id: string
  product_name: string
  quantity: number
  empty_returned: number
}

const handoverReturns = ref<HandoverReturnItem[]>([])
const paymentType = ref<'TUNAI' | 'BON'>('TUNAI')
const paymentAmount = ref<number>(0)
const paymentMethod = ref<'TUNAI' | 'TRANSFER' | 'LAINNYA'>('TUNAI')
const paymentNote = ref('')

function openCompleteModal() {
  if (!order.value) return
  // Inisialisasi daftar pengembalian tabung kosong untuk seluruh produk (nilai awal wajib 0 sesuai aturan)
  handoverReturns.value = order.value.items.map(it => ({
    product_id: it.product_id,
    product_name: it.product_name,
    quantity: it.quantity,
    empty_returned: 0
  }))

  paymentType.value = 'TUNAI'
  paymentAmount.value = order.value.total
  paymentMethod.value = 'TUNAI'
  paymentNote.value = ''
  isCompleteModalOpen.value = true
}

watch(paymentType, newType => {
  if (!order.value) return
  if (newType === 'TUNAI') {
    paymentAmount.value = order.value.total
  } else {
    // Bon: default pembayaran awal Rp0 (atau bisa diisi DP)
    paymentAmount.value = 0
  }
})

// Hitung sisa piutang untuk pembayaran bon
const remainingBalance = computed(() => {
  if (!order.value) return 0
  return Math.max(0, order.value.total - (paymentAmount.value || 0))
})

// ─── Action Handlers ──────────────────────────────────────────────
async function handleConfirmSubmit() {
  if (!order.value) return
  isSubmittingConfirm.value = true
  try {
    await confirmOrder(order.value.id, currentActor.value)
    showSuccess(
      `Pesanan ${order.value.number} berhasil disetujui! Stok otomatis dialokasikan.`,
      'Pesanan Dikonfirmasi'
    )
    isConfirmModalOpen.value = false
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal mengonfirmasi pesanan.')
  } finally {
    isSubmittingConfirm.value = false
  }
}

async function handleRejectSubmit() {
  if (!order.value) return
  if (!rejectReason.value.trim()) {
    showWarning('Alasan penolakan wajib diisi.')
    return
  }
  isSubmittingReject.value = true
  try {
    await rejectOrder(order.value.id, rejectReason.value, currentActor.value)
    showSuccess(`Pesanan ${order.value.number} telah ditolak.`, 'Pesanan Ditolak')
    isRejectModalOpen.value = false
    rejectReason.value = ''
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal menolak pesanan.')
  } finally {
    isSubmittingReject.value = false
  }
}

async function handleCancelSubmit() {
  if (!order.value) return
  if (!cancelReason.value.trim()) {
    showWarning('Alasan pembatalan wajib diisi.')
    return
  }
  isSubmittingCancel.value = true
  try {
    await cancelOrder(order.value.id, cancelReason.value, currentActor.value)
    showSuccess(
      `Pesanan ${order.value.number} telah dibatalkan dan alokasi stok telah dilepaskan.`,
      'Pesanan Dibatalkan'
    )
    isCancelModalOpen.value = false
    cancelReason.value = ''
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal membatalkan pesanan.')
  } finally {
    isSubmittingCancel.value = false
  }
}

async function handleCompleteSubmit() {
  if (!order.value) return

  // Validasi pengembalian tabung
  for (const ret of handoverReturns.value) {
    if (ret.empty_returned < 0 || !Number.isInteger(ret.empty_returned)) {
      showError(`Jumlah tabung kosong untuk "${ret.product_name}" harus bilangan bulat ≥ 0.`)
      return
    }
  }

  // Validasi pembayaran
  if (paymentType.value === 'TUNAI' && paymentAmount.value !== order.value.total) {
    showError(`Pembayaran tunai harus lunas (tepat ${formatRupiah(order.value.total)}).`)
    return
  }
  if (paymentType.value === 'BON') {
    if (paymentAmount.value < 0 || paymentAmount.value > order.value.total) {
      showError(`Pembayaran awal bon harus antara Rp0 s.d. ${formatRupiah(order.value.total)}.`)
      return
    }
  }

  isSubmittingComplete.value = true
  try {
    const payload: CompleteOrderPayload = {
      returns: handoverReturns.value.map(r => ({
        product_id: r.product_id,
        empty_returned: r.empty_returned
      })),
      payment_type: paymentType.value,
      amount_paid: paymentAmount.value,
      payment_method: paymentMethod.value,
      note: paymentNote.value.trim() || undefined
    }

    await completeOrder(order.value.id, payload, currentActor.value)
    showSuccess(
      `Serah-terima pesanan ${order.value.number} selesai! Penjualan resmi telah dibuat.`,
      'Serah-Terima Berhasil'
    )
    isCompleteModalOpen.value = false
  } catch (e: unknown) {
    showError(e instanceof Error ? e.message : 'Gagal menyelesaikan serah-terima.')
  } finally {
    isSubmittingComplete.value = false
  }
}

// Stepper Visual State Helper
const statusSteps = [
  { key: 'MENUNGGU_KONFIRMASI', label: 'Pengajuan', icon: '📝' },
  { key: 'DIKONFIRMASI', label: 'Dikonfirmasi', icon: '👍' },
  { key: 'SELESAI', label: 'Selesai (Serah-Terima)', icon: '🎉' }
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
  <div class="order-detail-manager">
    <!-- Back Navigation -->
    <div class="nav-back-row">
      <NuxtLink :to="basePath" class="back-link">
        ← Kembali ke Antrean Pesanan
      </NuxtLink>
    </div>

    <!-- Error State: Order Not Found -->
    <div v-if="!order" class="error-wrapper">
      <ErrorState
        title="Pesanan Tidak Ditemukan"
        description="Pesanan dengan nomor atau ID tersebut tidak terdaftar dalam sistem."
      >
        <template #actions>
          <NuxtLink :to="basePath">
            <BaseButton variant="primary">Kembali ke Antrean Pesanan</BaseButton>
          </NuxtLink>
        </template>
      </ErrorState>
    </div>

    <!-- Main Detail View -->
    <div v-else class="detail-layout">
      <!-- Main Column -->
      <div class="detail-main-col">
        <!-- Order Header Card -->
        <div class="header-card">
          <div class="header-top">
            <div>
              <span class="badge-tag">PESANAN PENGECER</span>
              <h1 class="order-title">{{ order.number }}</h1>
              <span class="order-time">
                Diajukan pada: {{ formatDateTime(order.created_at) }}
              </span>
            </div>

            <StatusBadge :status="order.status" size="md" />
          </div>

          <!-- Alert Khusus Ditolak / Dibatalkan -->
          <div v-if="order.status === 'DITOLAK'" class="status-alert alert-rejected">
            <span class="alert-icon">❌</span>
            <div>
              <strong>Pesanan Ditolak:</strong>
              <p class="alert-reason">{{ order.rejection_reason || 'Tidak ada alasan yang dicantumkan.' }}</p>
            </div>
          </div>

          <div v-if="order.status === 'DIBATALKAN'" class="status-alert alert-cancelled">
            <span class="alert-icon">⚠️</span>
            <div>
              <strong>Pesanan Dibatalkan:</strong>
              <p class="alert-reason">{{ order.cancellation_reason || 'Pesanan dibatalkan oleh pihak pangkalan.' }}</p>
            </div>
          </div>

          <!-- Stepper Visual Timeline -->
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
        <div class="section-card">
          <h2 class="card-title">Rincian Tabung Gas yang Dipesan</h2>

          <!-- Desktop Table -->
          <div class="table-wrap hide-mobile">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th class="text-right">Harga Satuan</th>
                  <th class="text-center">Kuantitas</th>
                  <th class="text-right">Subtotal</th>
                  <th v-if="order.status === 'MENUNGGU_KONFIRMASI'" class="text-center">
                    Kesiapan Stok
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in stockCheckResult.items" :key="item.product_id">
                  <td>
                    <div class="product-cell">
                      <span class="size-pill">{{ item.size_kg }} kg</span>
                      <strong>{{ item.product_name }}</strong>
                    </div>
                  </td>
                  <td class="text-right">{{ formatRupiah(item.unit_price) }}</td>
                  <td class="text-center font-bold">{{ formatQuantity(item.quantity) }}</td>
                  <td class="text-right text-primary font-bold">
                    {{ formatRupiah(item.subtotal) }}
                  </td>
                  <td v-if="order.status === 'MENUNGGU_KONFIRMASI'" class="text-center">
                    <span v-if="item.isSufficient" class="stock-ok-badge">
                      ✓ Cukup (Tersedia: {{ item.available }})
                    </span>
                    <span v-else class="stock-warn-badge">
                      ⚠️ Kurang (Tersedia: {{ item.available }})
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-items-list hide-desktop">
            <div
              v-for="item in stockCheckResult.items"
              :key="item.product_id"
              class="m-item-card"
            >
              <div class="m-item-head">
                <span class="size-pill">{{ item.size_kg }} kg</span>
                <strong>{{ item.product_name }}</strong>
              </div>
              <div class="m-item-body">
                <div class="m-kv">
                  <span>Kuantitas:</span>
                  <strong>{{ formatQuantity(item.quantity) }}</strong>
                </div>
                <div class="m-kv">
                  <span>Harga:</span>
                  <span>{{ formatRupiah(item.unit_price) }}</span>
                </div>
                <div class="m-kv">
                  <span>Subtotal:</span>
                  <strong class="text-primary">{{ formatRupiah(item.subtotal) }}</strong>
                </div>
                <div v-if="order.status === 'MENUNGGU_KONFIRMASI'" class="m-stock-check">
                  <span v-if="item.isSufficient" class="stock-ok-badge">
                    ✓ Stok Cukup (Tersedia: {{ item.available }})
                  </span>
                  <span v-else class="stock-warn-badge">
                    ⚠️ Stok Kurang (Tersedia: {{ item.available }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Serah Terima Info Card (Jika SELESAI) -->
        <div v-if="order.status === 'SELESAI' && relatedSale" class="section-card sale-card">
          <div class="sale-header">
            <div>
              <span class="sale-tag">BUKTI PENJUALAN RESMI</span>
              <h2 class="card-title text-primary">{{ relatedSale.number }}</h2>
            </div>
            <StatusBadge :status="relatedSale.payment_status" size="sm" />
          </div>

          <div class="sale-details-grid">
            <div class="sale-detail-item">
              <span class="s-label">Tipe Pembayaran:</span>
              <strong class="s-val">{{ relatedSale.payment_type }}</strong>
            </div>
            <div class="sale-detail-item">
              <span class="s-label">Total Transaksi:</span>
              <strong class="s-val text-primary">{{ formatRupiah(relatedSale.total) }}</strong>
            </div>
            <div class="sale-detail-item">
              <span class="s-label">Jumlah Dibayar:</span>
              <strong class="s-val text-success">{{ formatRupiah(relatedSale.paid) }}</strong>
            </div>
            <div class="sale-detail-item">
              <span class="s-label">Sisa Tagihan / Bon:</span>
              <strong :class="['s-val', relatedSale.balance > 0 ? 'text-danger' : 'text-muted']">
                {{ formatRupiah(relatedSale.balance) }}
              </strong>
            </div>
          </div>

          <!-- Tabung Kosong yang Diterima -->
          <div class="returns-summary-box">
            <h4 class="returns-title">Tabung Kosong Fisik yang Diterima Pangkalan:</h4>
            <div
              v-for="it in relatedSale.items"
              :key="it.product_id"
              class="returns-row"
            >
              <span>{{ it.product_name }}:</span>
              <strong>{{ formatQuantity(it.empty_returned) }} tabung kosong</strong>
            </div>
          </div>
        </div>

        <!-- History Log Card -->
        <div class="section-card">
          <h2 class="card-title">Riwayat Perubahan Status Pesanan</h2>

          <div v-if="order.history && order.history.length > 0" class="history-timeline">
            <div
              v-for="(hist, idx) in order.history"
              :key="idx"
              class="timeline-item"
            >
              <div class="timeline-dot" />
              <div class="timeline-content">
                <div class="timeline-head">
                  <StatusBadge :status="hist.status" size="sm" />
                  <span class="timeline-time">{{ formatDateTime(hist.timestamp) }}</span>
                </div>
                <p class="timeline-note">{{ hist.note }}</p>
                <span v-if="hist.actor" class="timeline-actor">Oleh: {{ hist.actor }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-muted">
            Belum ada riwayat aktivitas.
          </div>
        </div>
      </div>

      <!-- Sidebar Column: Action & Retailer Info -->
      <div class="detail-sidebar-col">
        <!-- Action Card Sesuai Status -->
        <div class="action-card">
          <h3 class="action-card-title">Aksi Operasional</h3>

          <!-- Status: MENUNGGU_KONFIRMASI -->
          <div v-if="order.status === 'MENUNGGU_KONFIRMASI'" class="action-buttons-group">
            <div class="action-info-text">
              Pesanan baru diajukan pengecer dan menunggu verifikasi ketersediaan stok pangkalan.
            </div>

            <BaseButton
              variant="primary"
              size="lg"
              class="w-full"
              :disabled="!stockCheckResult.canConfirm"
              @click="isConfirmModalOpen = true"
            >
              ✓ Setujui & Konfirmasi
            </BaseButton>

            <p v-if="!stockCheckResult.canConfirm" class="stock-block-warn">
              ⛔ Stok tabung fisik tidak mencukupi untuk memenuhi seluruh item pesanan ini.
            </p>

            <BaseButton
              variant="danger"
              size="md"
              class="w-full"
              @click="isRejectModalOpen = true"
            >
              ✕ Tolak Pesanan
            </BaseButton>
          </div>

          <!-- Status: DIKONFIRMASI -->
          <div v-else-if="order.status === 'DIKONFIRMASI'" class="action-buttons-group">
            <div class="action-info-text">
              Stok sudah dialokasikan. Pengecer siap melakukan serah-terima fisik tabung di pangkalan.
            </div>

            <BaseButton
              variant="primary"
              size="lg"
              class="w-full"
              @click="openCompleteModal"
            >
              🎉 Selesaikan Serah-Terima
            </BaseButton>

            <BaseButton
              variant="secondary"
              size="md"
              class="w-full text-danger"
              @click="isCancelModalOpen = true"
            >
              ⚠️ Batalkan Pesanan
            </BaseButton>
          </div>

          <!-- Status: SELESAI -->
          <div v-else-if="order.status === 'SELESAI'" class="action-done-box text-success">
            <span>✅</span>
            <div>
              <strong>Pesanan Selesai</strong>
              <p class="done-desc">Serah-terima telah rampung dan tercatat dalam buku penjualan.</p>
            </div>
          </div>

          <!-- Status: DITOLAK / DIBATALKAN -->
          <div v-else class="action-done-box text-muted">
            <span>⛔</span>
            <div>
              <strong>Pesanan Tidak Aktif</strong>
              <p class="done-desc">Tidak ada tindakan operasional lebih lanjut.</p>
            </div>
          </div>
        </div>

        <!-- Retailer Info Card -->
        <div class="info-card">
          <h3 class="info-card-title">Informasi Pengecer</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="i-lbl">Nama Usaha:</span>
              <strong class="i-val">{{ order.business_name || '-' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Penanggung Jawab:</span>
              <strong class="i-val">{{ order.retailer_name }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Nomor Kontak:</span>
              <strong class="i-val">{{ order.retailer_contact || '-' }}</strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">ID Pengecer:</span>
              <span class="i-val text-muted">{{ order.retailer_id }}</span>
            </div>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div class="info-card">
          <h3 class="info-card-title">Ringkasan Nilai</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="i-lbl">Total Kuantitas:</span>
              <strong class="i-val">
                {{ formatQuantity(order.items.reduce((s, it) => s + it.quantity, 0)) }}
              </strong>
            </div>
            <div class="info-item">
              <span class="i-lbl">Jenis Produk:</span>
              <span class="i-val">{{ order.items.length }} macam</span>
            </div>
            <hr class="card-hr" />
            <div class="info-item total-item">
              <span class="total-lbl">Total Tagihan:</span>
              <strong class="total-val text-primary">{{ formatRupiah(order.total) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: Konfirmasi Pesanan -->
    <BaseModal
      :is-open="isConfirmModalOpen"
      title="Konfirmasi Pesanan"
      size="md"
      @close="isConfirmModalOpen = false"
    >
      <template #body>
        <div v-if="order" class="modal-body-content">
          <p>
            Apakah Anda yakin ingin menyetujui pesanan <strong>{{ order.number }}</strong>?
          </p>
          <div class="modal-items-review">
            <div v-for="it in stockCheckResult.items" :key="it.product_id" class="review-line">
              <span>{{ it.quantity }}x {{ it.product_name }}</span>
              <span class="text-success font-bold">Stok Cukup (Tersedia: {{ it.available }})</span>
            </div>
          </div>
          <p class="modal-notice-box">
            ℹ️ Konfirmasi akan mengalokasikan stok penuh tabung ke <em>reserved_qty</em>.
            Stok fisik baru berkurang saat serah-terima dilakukan.
          </p>
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
          ✓ Ya, Setujui Pesanan
        </BaseButton>
      </template>
    </BaseModal>

    <!-- MODAL 2: Tolak Pesanan -->
    <BaseModal
      :is-open="isRejectModalOpen"
      title="Tolak Pesanan Pengecer"
      size="md"
      @close="isRejectModalOpen = false"
    >
      <template #body>
        <div class="modal-body-content">
          <p>
            Masukkan alasan penolakan untuk pesanan <strong>{{ order?.number }}</strong>.
            Alasan ini akan ditampilkan kepada pengecer pada detail pesanannya.
          </p>
          <div class="field-wrap">
            <label class="field-label required">Alasan Penolakan:</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="textarea-input"
              placeholder="Contoh: Stok tabung 12 kg sedang kosong menunggu pasokan agen hari Sabtu..."
            />
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton
          variant="secondary"
          :disabled="isSubmittingReject"
          @click="isRejectModalOpen = false"
        >
          Batal
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="isSubmittingReject"
          @click="handleRejectSubmit"
        >
          ✕ Tolak Pesanan
        </BaseButton>
      </template>
    </BaseModal>

    <!-- MODAL 3: Batalkan Pesanan -->
    <BaseModal
      :is-open="isCancelModalOpen"
      title="Batalkan Pesanan"
      size="md"
      @close="isCancelModalOpen = false"
    >
      <template #body>
        <div class="modal-body-content">
          <p>
            Apakah Anda yakin ingin membatalkan pesanan <strong>{{ order?.number }}</strong>?
          </p>
          <p v-if="order?.status === 'DIKONFIRMASI'" class="modal-warn-box">
            ⚠️ <strong>Perhatian:</strong> Pesanan ini telah berstatus DIKONFIRMASI.
            Membatalkan pesanan akan secara otomatis <strong>melepaskan alokasi stok reserved</strong>
            kembali menjadi stok siap dipesan.
          </p>
          <div class="field-wrap">
            <label class="field-label required">Alasan Pembatalan:</label>
            <textarea
              v-model="cancelReason"
              rows="3"
              class="textarea-input"
              placeholder="Contoh: Pengecer mengonfirmasi tidak dapat mengambil pesanan hari ini..."
            />
          </div>
        </div>
      </template>
      <template #footer>
        <BaseButton
          variant="secondary"
          :disabled="isSubmittingCancel"
          @click="isCancelModalOpen = false"
        >
          Batal
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="isSubmittingCancel"
          @click="handleCancelSubmit"
        >
          Ya, Batalkan Pesanan
        </BaseButton>
      </template>
    </BaseModal>

    <!-- MODAL 4: Selesaikan Serah-Terima & Pembayaran -->
    <BaseModal
      :is-open="isCompleteModalOpen"
      title="Selesaikan Serah-Terima & Pembayaran"
      size="lg"
      @close="isCompleteModalOpen = false"
    >
      <template #body>
        <div v-if="order" class="handover-modal-body">
          <p class="modal-intro">
            Catat serah-terima fisik tabung dan pembayaran untuk pesanan
            <strong>{{ order.number }}</strong>.
          </p>

          <!-- Bagian A: Pengembalian Tabung Kosong -->
          <div class="handover-section">
            <h4 class="section-sub-title">1. Pengembalian Tabung Kosong Aktual</h4>
            <p class="section-desc">
              Catat jumlah tabung kosong fisik yang benar-benar diterima dari pengecer.
              Wajib diisi untuk seluruh produk (isi 0 jika tidak ada tabung kosong yang dikembalikan).
            </p>

            <div class="returns-table-wrap">
              <table class="returns-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th class="text-center">Tabung Penuh Keluar</th>
                    <th class="text-right">Tabung Kosong Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ret in handoverReturns" :key="ret.product_id">
                    <td>
                      <strong>{{ ret.product_name }}</strong>
                    </td>
                    <td class="text-center font-bold">
                      {{ formatQuantity(ret.quantity) }}
                    </td>
                    <td class="text-right">
                      <div class="empty-input-wrap">
                        <input
                          v-model.number="ret.empty_returned"
                          type="number"
                          min="0"
                          class="empty-num-input"
                        />
                        <span class="unit-lbl">tabung</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bagian B: Pembayaran -->
          <div class="handover-section">
            <h4 class="section-sub-title">2. Pembayaran Transaksi</h4>

            <div class="payment-type-toggle">
              <label class="radio-label">
                <input
                  v-model="paymentType"
                  type="radio"
                  value="TUNAI"
                  name="paymentType"
                />
                <span class="radio-custom" />
                <span class="radio-text"><strong>Tunai (Pelunasan Penuh)</strong></span>
              </label>

              <label class="radio-label">
                <input
                  v-model="paymentType"
                  type="radio"
                  value="BON"
                  name="paymentType"
                />
                <span class="radio-custom" />
                <span class="radio-text"><strong>Bon (Hutang / DP)</strong></span>
              </label>
            </div>

            <!-- Form Nilai Pembayaran -->
            <div class="payment-fields-grid">
              <div class="field-item">
                <label class="field-label">Total Transaksi:</label>
                <div class="readonly-display text-primary font-bold">
                  {{ formatRupiah(order.total) }}
                </div>
              </div>

              <div class="field-item">
                <label class="field-label">
                  {{ paymentType === 'TUNAI' ? 'Jumlah Dibayar (Wajib Lunas):' : 'Pembayaran Awal / Uang Muka (Rp):' }}
                </label>
                <input
                  v-model.number="paymentAmount"
                  type="number"
                  min="0"
                  :max="order.total"
                  :disabled="paymentType === 'TUNAI'"
                  class="amount-input"
                />
              </div>

              <div v-if="paymentType === 'BON'" class="field-item">
                <label class="field-label">Sisa Tagihan / Piutang Bon:</label>
                <div class="readonly-display text-danger font-bold">
                  {{ formatRupiah(remainingBalance) }}
                </div>
              </div>

              <div class="field-item">
                <label class="field-label">Metode Pembayaran:</label>
                <select v-model="paymentMethod" class="select-input">
                  <option value="TUNAI">Uang Tunai</option>
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="LAINNYA">Lainnya (QRIS/E-Wallet)</option>
                </select>
              </div>
            </div>

            <div class="field-item full-w">
              <label class="field-label">Catatan Tambahan (Opsional):</label>
              <input
                v-model="paymentNote"
                type="text"
                class="text-input"
                placeholder="Contoh: Titipan uang muka diserahkan supir warung..."
              />
            </div>
          </div>

          <!-- Bagian C: Ringkasan Lengkap Sebelum Konfirmasi -->
          <div class="handover-section review-summary-container">
            <h4 class="section-sub-title">3. Ringkasan Sebelum Konfirmasi Serah-Terima</h4>

            <div class="review-card">
              <!-- Rincian Tabung -->
              <div class="review-block">
                <span class="review-block-title">📦 Rincian Fisik Tabung:</span>
                <div class="review-table-mini">
                  <div
                    v-for="ret in handoverReturns"
                    :key="ret.product_id"
                    class="review-row"
                  >
                    <span class="r-name">{{ ret.product_name }}:</span>
                    <span class="r-val">
                      {{ ret.quantity }} tabung penuh diserahkan ➔
                      <strong :class="ret.empty_returned > 0 ? 'text-success' : 'text-muted'">
                        {{ ret.empty_returned }} tabung kosong diterima
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Rincian Keuangan -->
              <div class="review-block">
                <span class="review-block-title">💰 Rincian Pembayaran & Sisa Piutang:</span>
                <div class="review-grid-two">
                  <div class="r-cell">
                    <span class="r-lbl">Total Transaksi:</span>
                    <strong class="r-data text-primary">{{ formatRupiah(order.total) }}</strong>
                  </div>
                  <div class="r-cell">
                    <span class="r-lbl">Jenis Pembayaran:</span>
                    <strong class="r-data">
                      {{ paymentType === 'TUNAI' ? 'Tunai (Lunas Penuh)' : 'Bon / Hutang (Sebagian/DP)' }}
                    </strong>
                  </div>
                  <div class="r-cell">
                    <span class="r-lbl">Nominal Pembayaran Diterima:</span>
                    <strong class="r-data text-success">{{ formatRupiah(paymentAmount || 0) }}</strong>
                  </div>
                  <div class="r-cell">
                    <span class="r-lbl">Sisa Piutang (Bon):</span>
                    <strong :class="['r-data', remainingBalance > 0 ? 'text-danger' : 'text-muted']">
                      {{ formatRupiah(remainingBalance) }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <BaseButton
          variant="secondary"
          :disabled="isSubmittingComplete"
          @click="isCompleteModalOpen = false"
        >
          Batal
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="isSubmittingComplete"
          @click="handleCompleteSubmit"
        >
          ✅ Konfirmasi & Simpan Serah-Terima
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.order-detail-manager {
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

/* Layout */
.detail-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 960px) {
  .detail-layout {
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
    width: 340px;
    flex-shrink: 0;
  }
}

/* Cards */
.header-card,
.section-card,
.action-card,
.info-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.badge-tag {
  font-size: 10px;
  font-weight: 800;
  color: var(--color-text-subtle);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.order-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin: 2px 0 4px;
}

.order-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.status-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.alert-rejected {
  background-color: #fee2e2;
  border-left: 4px solid var(--color-danger);
  color: #991b1b;
}

.alert-cancelled {
  background-color: #f3f4f6;
  border-left: 4px solid var(--color-text-subtle);
  color: var(--color-text);
}

.alert-reason {
  font-size: var(--font-size-xs);
  margin: 4px 0 0;
}

/* Stepper */
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

/* Card titles */
.card-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.action-card-title,
.info-card-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

/* Tables */
.table-wrap {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.items-table th {
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
}

.items-table td {
  padding: var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.product-cell {
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

.stock-ok-badge {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: 600;
  background-color: #d1fae5;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.stock-warn-badge {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  font-weight: 600;
  background-color: #fee2e2;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Mobile Item Cards */
.mobile-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.m-item-card {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.m-item-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.m-item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.m-kv {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.m-stock-check {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed var(--color-border);
}

/* Sale Card */
.sale-card {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.sale-tag {
  font-size: 10px;
  font-weight: 800;
  color: var(--color-success);
  letter-spacing: 0.05em;
}

.sale-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid #bbf7d0;
}

.sale-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.s-val {
  font-size: var(--font-size-sm);
}

.returns-summary-box {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid #bbf7d0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.returns-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  margin: 0;
}

.returns-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
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

.timeline-item {
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

.timeline-content {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  flex: 1 1 auto;
}

.timeline-head {
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

/* Action Card */
.action-buttons-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.action-info-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.stock-block-warn {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}

.action-done-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-subtle);
}

.done-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

/* Info Cards */
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.i-lbl {
  color: var(--color-text-muted);
}

.card-hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-2) 0;
}

.total-item {
  padding-top: var(--space-1);
}

.total-lbl {
  font-weight: 700;
}

.total-val {
  font-size: var(--font-size-lg);
  font-weight: 800;
}

/* Modal Content & Forms */
.modal-body-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.modal-items-review {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
}

.review-line {
  display: flex;
  justify-content: space-between;
}

.modal-notice-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-xs);
  color: #1e40af;
  margin: 0;
}

.modal-warn-box {
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--font-size-xs);
  color: #92400e;
  margin: 0;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text);
}

.field-label.required::after {
  content: ' *';
  color: var(--color-danger);
}

.textarea-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  outline: none;
  background-color: var(--color-surface);
}

.textarea-input:focus {
  border-color: var(--color-primary-700);
}

/* Handover Modal Form */
.handover-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-height: 65vh;
  overflow-y: auto;
  padding-right: var(--space-1);
}

.handover-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-sub-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  padding-bottom: var(--space-1);
  border-bottom: 2px solid var(--color-primary-700);
  display: inline-block;
}

.section-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.returns-table-wrap {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.returns-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-xs);
}

.returns-table th {
  background-color: var(--color-surface-subtle);
  padding: var(--space-2) var(--space-3);
  text-align: left;
  font-weight: 700;
  border-bottom: 1px solid var(--color-border);
}

.returns-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.empty-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.empty-num-input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-align: right;
  outline: none;
}

.empty-num-input:focus {
  border-color: var(--color-primary-700);
}

.unit-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

.payment-type-toggle {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  background-color: var(--color-surface-subtle);
  border-radius: var(--radius-md);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.payment-fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 640px) {
  .payment-fields-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item.full-w {
  grid-column: 1 / -1;
}

.readonly-display {
  padding: 8px 12px;
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.amount-input,
.select-input,
.text-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  outline: none;
  background-color: var(--color-surface);
}

.amount-input:focus,
.select-input:focus,
.text-input:focus {
  border-color: var(--color-primary-700);
}

/* Review Summary Box in Handover Modal */
.review-summary-container {
  margin-top: var(--space-2);
}

.review-card {
  background-color: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary-700);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.review-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.review-block-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary-900);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.review-table-mini {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}

.review-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
  flex-wrap: wrap;
  gap: 4px;
}

.review-row .r-name {
  font-weight: 600;
  color: var(--color-text);
}

.review-grid-two {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
}

@media (min-width: 640px) {
  .review-grid-two {
    grid-template-columns: repeat(2, 1fr);
  }
}

.r-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

.r-data {
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.w-full {
  width: 100%;
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
.text-success {
  color: var(--color-success);
}
.text-danger {
  color: var(--color-danger);
}
</style>

