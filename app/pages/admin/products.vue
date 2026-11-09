<script setup lang="ts">
import type { Product as MockProduct } from '~/types/models'
import type { CreateProductPayload, UpdateProductPayload } from '~/composables/useProducts'

definePageMeta({ layout: 'admin' })

const { products, addProduct, updateProduct, toggleProductStatus } = useProducts()
const { showSuccess, showError } = useNotification()

// â”€â”€â”€ Filter & Pencarian â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
const currentPage = ref(1)
const pageSize = 8

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    if (statusFilter.value === 'ACTIVE' && !p.active) return false
    if (statusFilter.value === 'INACTIVE' && p.active) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      return p.name.toLowerCase().includes(q) || String(p.size_kg).includes(q)
    }
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / pageSize) || 1)
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})

watch([searchQuery, statusFilter], () => { currentPage.value = 1 })

// â”€â”€â”€ Counter Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const activeCount = computed(() => products.value.filter(p => p.active).length)
const inactiveCount = computed(() => products.value.filter(p => !p.active).length)
const lowStockCount = computed(() => products.value.filter(p => p.active && p.low_stock).length)

// â”€â”€â”€ Modal Tambah Produk (PG-09 Tambah) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isAddModalOpen = ref(false)
const isSubmittingAdd = ref(false)

const addForm = reactive<CreateProductPayload>({
  name: '',
  size_kg: 3,
  price: 0,
  minimum_stock: 10,
  active: true,
})
const addErrors = reactive({ name: '', size_kg: '', price: '', minimum_stock: '' })

function openAddModal() {
  addForm.name = ''
  addForm.size_kg = 3
  addForm.price = 0
  addForm.minimum_stock = 10
  addForm.active = true
  clearAddErrors()
  isAddModalOpen.value = true
}

function clearAddErrors() {
  addErrors.name = ''
  addErrors.size_kg = ''
  addErrors.price = ''
  addErrors.minimum_stock = ''
}

function validateAddForm(): boolean {
  clearAddErrors()
  let ok = true
  if (!addForm.name.trim()) { addErrors.name = 'Nama produk wajib diisi.'; ok = false }
  if (!addForm.size_kg || addForm.size_kg <= 0) { addErrors.size_kg = 'Berat harus bernilai positif (> 0).'; ok = false }
  if (addForm.price < 0) { addErrors.price = 'Harga tidak boleh negatif.'; ok = false }
  if (addForm.minimum_stock < 0 || !Number.isInteger(addForm.minimum_stock)) {
    addErrors.minimum_stock = 'Stok minimum harus bilangan bulat â‰¥ 0.'
    ok = false
  }
  return ok
}

async function handleAddProduct() {
  if (!validateAddForm()) return
  isSubmittingAdd.value = true
  try {
    await new Promise(r => setTimeout(r, 400))
    const created = await addProduct({ ...addForm })
    showSuccess(`Produk "${created.name}" berhasil ditambahkan ke katalog.`, 'Produk Berhasil Ditambahkan')
    isAddModalOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Gagal menambahkan produk.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingAdd.value = false
  }
}

// â”€â”€â”€ Modal Edit Produk (PG-09 Edit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isEditModalOpen = ref(false)
const isSubmittingEdit = ref(false)
const editingProductId = ref('')

const editForm = reactive<UpdateProductPayload & { name: string; size_kg: number; price: number; minimum_stock: number; active: boolean }>({
  name: '',
  size_kg: 0,
  price: 0,
  minimum_stock: 0,
  active: true,
})
const editErrors = reactive({ name: '', size_kg: '', price: '', minimum_stock: '' })

function openEditModal(product: MockProduct) {
  editingProductId.value = product.id
  editForm.name = product.name
  editForm.size_kg = product.size_kg
  editForm.price = product.price
  editForm.minimum_stock = product.minimum_stock
  editForm.active = product.active
  editErrors.name = ''
  editErrors.size_kg = ''
  editErrors.price = ''
  editErrors.minimum_stock = ''
  isEditModalOpen.value = true
}

function validateEditForm(): boolean {
  editErrors.name = ''
  editErrors.size_kg = ''
  editErrors.price = ''
  editErrors.minimum_stock = ''
  let ok = true
  if (!editForm.name.trim()) { editErrors.name = 'Nama produk tidak boleh kosong.'; ok = false }
  if (!editForm.size_kg || editForm.size_kg <= 0) { editErrors.size_kg = 'Berat harus bernilai positif (> 0).'; ok = false }
  if (editForm.price < 0) { editErrors.price = 'Harga tidak boleh negatif.'; ok = false }
  if (editForm.minimum_stock < 0 || !Number.isInteger(editForm.minimum_stock)) {
    editErrors.minimum_stock = 'Stok minimum harus bilangan bulat â‰¥ 0.'
    ok = false
  }
  return ok
}

async function handleUpdateProduct() {
  if (!validateEditForm()) return
  isSubmittingEdit.value = true
  try {
    await new Promise(r => setTimeout(r, 400))
    const updated = await updateProduct(editingProductId.value, {
      name: editForm.name,
      size_kg: editForm.size_kg,
      price: editForm.price,
      minimum_stock: editForm.minimum_stock,
      active: editForm.active,
    })
    showSuccess(`Informasi produk "${updated.name}" berhasil diperbarui.`, 'Produk Diperbarui')
    isEditModalOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Gagal memperbarui produk.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingEdit.value = false
  }
}

// â”€â”€â”€ Modal Konfirmasi Toggle Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const isToggleModalOpen = ref(false)
const productToToggle = ref<MockProduct | null>(null)
const isSubmittingToggle = ref(false)

function promptToggleStatus(product: MockProduct) {
  productToToggle.value = product
  isToggleModalOpen.value = true
}

async function handleConfirmToggle() {
  if (!productToToggle.value) return
  isSubmittingToggle.value = true
  try {
    await new Promise(r => setTimeout(r, 350))
    const updated = await toggleProductStatus(productToToggle.value.id)
    const nowActive = updated.active
    showSuccess(
      `Produk "${updated.name}" kini ${nowActive ? 'AKTIF dan dapat dipesan pengecer' : 'NONAKTIF dan tidak ditampilkan di katalog pengecer'}.`,
      nowActive ? 'Produk Diaktifkan' : 'Produk Dinonaktifkan'
    )
    isToggleModalOpen.value = false
    productToToggle.value = null
  } catch (err: any) {
    showError(err.message || 'Gagal mengubah status produk.', 'Terjadi Kesalahan')
  } finally {
    isSubmittingToggle.value = false
  }
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Input Rupiah: hanya izinkan angka
function parsePriceInput(val: string): number {
  const num = parseInt(val.replace(/\D/g, ''), 10)
  return isNaN(num) ? 0 : num
}
</script>

<template>
  <div class="page-container">

    <!-- â”€â”€ Header Halaman â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Manajemen Produk (PG-08)</h1>
        <p class="page-subtitle">
          Kelola katalog produk LPG: harga jual, berat tabung, stok minimum, dan status ketersediaan.
        </p>
      </div>
      <div class="header-actions">
        <BaseButton variant="primary" size="md" @click="openAddModal">
          âž• Tambah Produk
        </BaseButton>
      </div>
    </div>

    <!-- â”€â”€ Kartu Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <div class="summary-grid mb-6">
      <div class="summary-card" :class="{ 'filter-active': statusFilter === 'ALL' }" @click="statusFilter = 'ALL'">
        <span class="summary-icon">ðŸ“¦</span>
        <div>
          <div class="summary-value">{{ products.length }}</div>
          <div class="summary-label">Total Produk</div>
        </div>
      </div>

      <div class="summary-card" :class="{ 'filter-active': statusFilter === 'ACTIVE' }" @click="statusFilter = 'ACTIVE'">
        <span class="summary-icon">âœ…</span>
        <div>
          <div class="summary-value text-success">{{ activeCount }}</div>
          <div class="summary-label">Produk Aktif</div>
        </div>
      </div>

      <div class="summary-card" :class="{ 'filter-active': statusFilter === 'INACTIVE' }" @click="statusFilter = 'INACTIVE'">
        <span class="summary-icon">â›”</span>
        <div>
          <div class="summary-value text-muted">{{ inactiveCount }}</div>
          <div class="summary-label">Produk Nonaktif</div>
        </div>
      </div>

      <div class="summary-card">
        <span class="summary-icon">âš ï¸</span>
        <div>
          <div class="summary-value text-warning">{{ lowStockCount }}</div>
          <div class="summary-label">Stok Menipis</div>
        </div>
      </div>
    </div>

    <!-- â”€â”€ Toolbar: Search & Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <div class="toolbar-card mb-6">
      <div class="toolbar-search">
        <BaseInput
          v-model="searchQuery"
          placeholder="Cari nama produk atau ukuran (kg)..."
        />
      </div>

      <div class="toolbar-filter">
        <label for="status-filter" class="filter-label">Filter Status:</label>
        <select id="status-filter" v-model="statusFilter" class="filter-select">
          <option value="ALL">Semua Produk</option>
          <option value="ACTIVE">Hanya Aktif</option>
          <option value="INACTIVE">Hanya Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- â”€â”€ Tabel / Kartu Produk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <div class="table-card">
      <div v-if="paginatedProducts.length > 0">

        <!-- Desktop Table -->
        <div class="table-responsive hide-mobile">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th class="text-center">Ukuran</th>
                <th class="text-right">Harga Jual</th>
                <th class="text-center">Min. Stok</th>
                <th class="text-center">Status</th>
                <th class="text-center">Peringatan Stok</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in paginatedProducts"
                :key="product.id"
                :class="{ 'row-inactive': !product.active }"
              >
                <td>
                  <div class="product-name-cell">
                    <span class="product-icon">
                      {{ product.size_kg <= 5 ? 'ðŸ”µ' : product.size_kg <= 12 ? 'ðŸŸ¡' : 'ðŸ”´' }}
                    </span>
                    <div>
                      <span class="product-name">{{ product.name }}</span>
                      <span v-if="!product.active" class="inactive-note">(tidak tersedia di katalog)</span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span class="size-badge">{{ product.size_kg }} kg</span>
                </td>
                <td class="text-right">
                  <span class="price-value">{{ formatRupiah(product.price) }}</span>
                </td>
                <td class="text-center">
                  <span class="min-stock-badge">{{ product.minimum_stock }} tabung</span>
                </td>
                <td class="text-center">
                  <StatusBadge :status="product.active ? 'ACTIVE' : 'INACTIVE'" />
                </td>
                <td class="text-center">
                  <span v-if="product.active && product.low_stock" class="low-stock-badge">
                    âš ï¸ Stok Menipis
                  </span>
                  <span v-else-if="!product.active" class="text-muted text-xs">â€”</span>
                  <span v-else class="stock-ok-badge">âœ“ Aman</span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      title="Edit informasi produk"
                      @click="openEditModal(product)"
                    >
                      Edit
                    </BaseButton>
                    <BaseButton
                      :variant="product.active ? 'secondary' : 'success'"
                      size="sm"
                      :title="product.active ? 'Nonaktifkan produk' : 'Aktifkan produk'"
                      @click="promptToggleStatus(product)"
                    >
                      {{ product.active ? 'Nonaktifkan' : 'Aktifkan' }}
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div class="mobile-card-list hide-desktop">
          <div
            v-for="product in paginatedProducts"
            :key="product.id"
            class="product-mobile-card"
            :class="{ 'card-inactive': !product.active }"
          >
            <div class="m-card-header">
              <div class="m-card-title-row">
                <span class="product-icon-lg">
                  {{ product.size_kg <= 5 ? 'ðŸ”µ' : product.size_kg <= 12 ? 'ðŸŸ¡' : 'ðŸ”´' }}
                </span>
                <div>
                  <h3 class="m-product-name">{{ product.name }}</h3>
                  <span class="m-size-label">{{ product.size_kg }} kg</span>
                </div>
              </div>
              <StatusBadge :status="product.active ? 'ACTIVE' : 'INACTIVE'" size="sm" />
            </div>

            <div class="m-card-body">
              <div class="m-row">
                <span class="m-label">Harga Jual:</span>
                <span class="m-price">{{ formatRupiah(product.price) }}</span>
              </div>
              <div class="m-row">
                <span class="m-label">Stok Minimum:</span>
                <span>{{ product.minimum_stock }} tabung</span>
              </div>
              <div v-if="product.active" class="m-row">
                <span class="m-label">Peringatan Stok:</span>
                <span :class="product.low_stock ? 'text-warning' : 'text-success'">
                  {{ product.low_stock ? 'âš ï¸ Stok Menipis' : 'âœ“ Aman' }}
                </span>
              </div>
            </div>

            <div class="m-card-actions">
              <BaseButton
                variant="secondary"
                size="sm"
                block
                @click="openEditModal(product)"
              >
                Edit Produk
              </BaseButton>
              <BaseButton
                :variant="product.active ? 'secondary' : 'success'"
                size="sm"
                block
                @click="promptToggleStatus(product)"
              >
                {{ product.active ? 'Nonaktifkan' : 'Aktifkan' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-footer">
          <PaginationNav
            :current-page="currentPage"
            :total-pages="totalPages"
            :total-items="filteredProducts.length"
            :page-size="pageSize"
            @update:page="currentPage = $event"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="p-8">
        <EmptyState
          v-if="searchQuery || statusFilter !== 'ALL'"
          title="Produk Tidak Ditemukan"
          description="Tidak ada produk yang sesuai dengan kriteria pencarian atau filter Anda."
          action-label="Reset Filter"
          @action="searchQuery = ''; statusFilter = 'ALL'"
        />
        <EmptyState
          v-else
          title="Belum Ada Produk"
          description="Tambahkan produk LPG pertama untuk memulai operasional pemesanan pangkalan."
          action-label="âž• Tambah Produk Pertama"
          @action="openAddModal"
        />
      </div>
    </div>

    <!-- Catatan Aturan Bisnis -->
    <div class="footnote-card mt-4">
      <span class="footnote-icon">â„¹ï¸</span>
      <p class="footnote-text">
        <strong>Catatan:</strong> Harga historis transaksi tidak berubah saat harga katalog diedit.
        Produk yang dinonaktifkan tetap tersimpan dan tidak dihapus â€” riwayat transaksi tetap aman.
        Data inventaris stok dikelola pada modul Ringkasan Stok, bukan di halaman ini.
      </p>
    </div>


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <!-- MODAL PG-09: Tambah Produk Baru                          -->
    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <BaseModal
      :is-open="isAddModalOpen"
      title="Tambah Produk Baru (PG-09)"
      max-width="560px"
      @close="isAddModalOpen = false"
    >
      <form class="product-form" @submit.prevent="handleAddProduct">
        <div class="form-section-title">Informasi Produk</div>

        <BaseInput
          v-model="addForm.name"
          label="Nama Produk"
          placeholder="Contoh: LPG 3 kg (Subsidi), Bright Gas 5,5 kg..."
          :error-text="addErrors.name"
          required
        />

        <div class="form-grid mt-3">
          <BaseInput
            v-model.number="addForm.size_kg"
            label="Berat Tabung (kg)"
            type="number"
            placeholder="Contoh: 3, 5.5, 12"
            :error-text="addErrors.size_kg"
            required
          />

          <div>
            <label class="form-label">Harga Jual (Rupiah) <span class="required-star">*</span></label>
            <div class="price-input-wrapper">
              <span class="price-prefix">Rp</span>
              <input
                :value="addForm.price === 0 ? '' : addForm.price.toLocaleString('id-ID')"
                type="text"
                inputmode="numeric"
                class="form-input price-input"
                placeholder="0"
                @input="addForm.price = parsePriceInput(($event.target as HTMLInputElement).value)"
              >
            </div>
            <span v-if="addErrors.price" class="field-error-msg">{{ addErrors.price }}</span>
            <span v-else class="field-helper-msg">
              {{ addForm.price > 0 ? formatRupiah(addForm.price) : 'Masukkan harga jual per tabung' }}
            </span>
          </div>
        </div>

        <div class="form-grid mt-3">
          <BaseInput
            v-model.number="addForm.minimum_stock"
            label="Stok Minimum (Peringatan)"
            type="number"
            placeholder="Contoh: 10"
            helper-text="Sistem menampilkan peringatan jika stok tersedia di bawah angka ini."
            :error-text="addErrors.minimum_stock"
            required
          />

          <div class="status-toggle-field">
            <label class="form-label">Status Produk</label>
            <div class="toggle-pill-group">
              <label class="toggle-pill" :class="{ 'pill-active': addForm.active }">
                <input v-model="addForm.active" type="radio" :value="true" class="sr-only">
                <span>âœ… Aktif</span>
              </label>
              <label class="toggle-pill" :class="{ 'pill-inactive': !addForm.active }">
                <input v-model="addForm.active" type="radio" :value="false" class="sr-only">
                <span>â›” Nonaktif</span>
              </label>
            </div>
            <span class="field-helper-msg">
              {{ addForm.active ? 'Produk aktif dapat dipesan pengecer.' : 'Produk nonaktif tersembunyi di katalog pengecer.' }}
            </span>
          </div>
        </div>

        <div class="form-note mt-4">
          <span>ðŸ”’</span>
          <span>Produk baru mulai dengan stok nol. Penambahan stok fisik dilakukan melalui modul <strong>Catat Pasokan Agen</strong>.</span>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingAdd" @click="isAddModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton variant="primary" :loading="isSubmittingAdd" @click="handleAddProduct">
            Simpan Produk
          </BaseButton>
        </div>
      </template>
    </BaseModal>


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <!-- MODAL PG-09: Edit Produk                                  -->
    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <BaseModal
      :is-open="isEditModalOpen"
      title="Edit Informasi Produk (PG-09)"
      max-width="560px"
      @close="isEditModalOpen = false"
    >
      <form class="product-form" @submit.prevent="handleUpdateProduct">
        <div class="form-section-title">Informasi Produk</div>

        <BaseInput
          v-model="editForm.name"
          label="Nama Produk"
          placeholder="Nama produk..."
          :error-text="editErrors.name"
          required
        />

        <div class="form-grid mt-3">
          <BaseInput
            v-model.number="editForm.size_kg"
            label="Berat Tabung (kg)"
            type="number"
            placeholder="Contoh: 3, 5.5, 12"
            :error-text="editErrors.size_kg"
            required
          />

          <div>
            <label class="form-label">Harga Jual (Rupiah) <span class="required-star">*</span></label>
            <div class="price-input-wrapper">
              <span class="price-prefix">Rp</span>
              <input
                :value="editForm.price === 0 ? '' : editForm.price.toLocaleString('id-ID')"
                type="text"
                inputmode="numeric"
                class="form-input price-input"
                placeholder="0"
                @input="editForm.price = parsePriceInput(($event.target as HTMLInputElement).value)"
              >
            </div>
            <span v-if="editErrors.price" class="field-error-msg">{{ editErrors.price }}</span>
            <span v-else class="field-helper-msg">
              {{ editForm.price > 0 ? formatRupiah(editForm.price) : 'Masukkan harga jual per tabung' }}
            </span>
          </div>
        </div>

        <div class="form-grid mt-3">
          <BaseInput
            v-model.number="editForm.minimum_stock"
            label="Stok Minimum (Peringatan)"
            type="number"
            helper-text="Peringatan muncul bila stok tersedia < nilai ini."
            :error-text="editErrors.minimum_stock"
            required
          />

          <div class="status-toggle-field">
            <label class="form-label">Status Produk</label>
            <div class="toggle-pill-group">
              <label class="toggle-pill" :class="{ 'pill-active': editForm.active }">
                <input v-model="editForm.active" type="radio" :value="true" class="sr-only">
                <span>âœ… Aktif</span>
              </label>
              <label class="toggle-pill" :class="{ 'pill-inactive': !editForm.active }">
                <input v-model="editForm.active" type="radio" :value="false" class="sr-only">
                <span>â›” Nonaktif</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-note mt-4">
          <span>â„¹ï¸</span>
          <span>Mengedit harga <strong>tidak</strong> mengubah harga pada transaksi yang telah selesai. Data inventaris stok tidak terpengaruh oleh perubahan di halaman ini.</span>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton variant="secondary" :disabled="isSubmittingEdit" @click="isEditModalOpen = false">
            Batal
          </BaseButton>
          <BaseButton variant="primary" :loading="isSubmittingEdit" @click="handleUpdateProduct">
            Simpan Perubahan
          </BaseButton>
        </div>
      </template>
    </BaseModal>


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <!-- MODAL: Konfirmasi Toggle Status Produk                    -->
    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <BaseModal
      :is-open="isToggleModalOpen"
      :title="productToToggle?.active ? 'Nonaktifkan Produk?' : 'Aktifkan Produk?'"
      max-width="460px"
      @close="isToggleModalOpen = false"
    >
      <div v-if="productToToggle" class="confirm-content">
        <div
          class="confirm-icon-box"
          :class="productToToggle.active ? 'danger-icon-box' : 'success-icon-box'"
        >
          {{ productToToggle.active ? 'â›”' : 'âœ…' }}
        </div>

        <h4 class="confirm-title">
          {{ productToToggle.active ? 'Nonaktifkan Produk Ini?' : 'Aktifkan Produk Ini?' }}
        </h4>

        <div class="product-confirm-summary">
          <div class="confirm-product-icon">
            {{ productToToggle.size_kg <= 5 ? 'ðŸ”µ' : productToToggle.size_kg <= 12 ? 'ðŸŸ¡' : 'ðŸ”´' }}
          </div>
          <div>
            <strong class="confirm-product-name">{{ productToToggle.name }}</strong>
            <span class="confirm-product-meta">{{ productToToggle.size_kg }} kg â€¢ {{ formatRupiah(productToToggle.price) }}/tabung</span>
          </div>
        </div>

        <div class="status-change-note text-sm" :class="productToToggle.active ? 'note-warning' : 'note-info'">
          <template v-if="productToToggle.active">
            âš ï¸ <strong>Efek nonaktifkan:</strong> Produk ini tidak akan ditampilkan di katalog pengecer dan tidak dapat dipesan. Riwayat transaksi dan data stok fisik tidak akan berubah.
          </template>
          <template v-else>
            âœ… <strong>Efek mengaktifkan:</strong> Produk ini akan kembali muncul di katalog pengecer dan dapat dipesan sesuai ketersediaan stok.
          </template>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-btns">
          <BaseButton
            variant="secondary"
            :disabled="isSubmittingToggle"
            @click="isToggleModalOpen = false"
          >
            Batal
          </BaseButton>
          <BaseButton
            :variant="productToToggle?.active ? 'danger' : 'success'"
            :loading="isSubmittingToggle"
            @click="handleConfirmToggle"
          >
            {{ productToToggle?.active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

  </div>
</template>

<style scoped>
.page-container {
  padding-bottom: var(--space-8);
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-navy);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: var(--space-1);
}

/* Summary Cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: all var(--transition-base);
}

.summary-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.summary-card.filter-active {
  border-color: var(--color-primary);
  background-color: #e0f2fe;
}

.summary-icon {
  font-size: 24px;
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: 2px;
}

.text-success { color: #15803d; }
.text-warning { color: #b45309; }
.text-muted { color: var(--color-muted); }

/* Toolbar */
.toolbar-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .toolbar-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .toolbar-search {
    flex: 1;
    max-width: 480px;
  }
}

.toolbar-filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-muted);
  white-space: nowrap;
}

.filter-select {
  height: 40px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-navy);
}

/* Table Card */
.table-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--font-size-sm);
}

.data-table th {
  background-color: #f8fafc;
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.data-table tbody tr.row-inactive {
  opacity: 0.65;
  background-color: #fafafa;
}

.product-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.product-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.product-name {
  font-weight: 600;
  color: var(--color-navy);
}

.inactive-note {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  font-style: italic;
}

.size-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f1f5f9;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-navy);
}

.price-value {
  font-weight: 700;
  color: var(--color-navy);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.min-stock-badge {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.low-stock-badge {
  font-size: var(--font-size-xs);
  color: #b45309;
  font-weight: 600;
}

.stock-ok-badge {
  font-size: var(--font-size-xs);
  color: #15803d;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* Mobile Cards */
.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.product-mobile-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background-color: var(--color-surface);
}

.product-mobile-card.card-inactive {
  opacity: 0.7;
  background-color: #fafafa;
}

.m-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.m-card-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.product-icon-lg {
  font-size: 24px;
}

.m-product-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-navy);
  margin: 0;
}

.m-size-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.m-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  padding-bottom: var(--space-3);
  border-bottom: 1px dashed var(--color-border);
  margin-bottom: var(--space-3);
}

.m-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m-label {
  color: var(--color-muted);
  font-size: var(--font-size-xs);
}

.m-price {
  font-weight: 700;
  color: var(--color-navy);
}

.m-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.pagination-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Footnote */
.footnote-card {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.footnote-icon {
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.footnote-text {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin: 0;
  line-height: 1.5;
}

/* Product Form (Modal) */
.product-form {
  display: flex;
  flex-direction: column;
}

.form-section-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 520px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: var(--space-1);
}

.required-star {
  color: #dc2626;
  margin-left: 2px;
}

/* Rupiah Price Input */
.price-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 40px;
}

.price-prefix {
  padding: 0 var(--space-3);
  background-color: #f1f5f9;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-muted);
  border-right: 1px solid var(--color-border);
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.price-input {
  border: none !important;
  border-radius: 0 !important;
  height: 100%;
  flex: 1;
  padding: 0 var(--space-3) !important;
}

.price-input:focus {
  outline: none;
  box-shadow: none;
}

.price-input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(23, 76, 104, 0.12);
}

.field-error-msg {
  display: block;
  font-size: var(--font-size-xs);
  color: #dc2626;
  margin-top: var(--space-1);
}

.field-helper-msg {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: var(--space-1);
}

/* Status Toggle Pills */
.status-toggle-field {
  display: flex;
  flex-direction: column;
}

.toggle-pill-group {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.toggle-pill {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.toggle-pill.pill-active {
  border-color: #15803d;
  background-color: #dcfce7;
  color: #15803d;
  font-weight: 600;
}

.toggle-pill.pill-inactive {
  border-color: #dc2626;
  background-color: #fee2e2;
  color: #dc2626;
  font-weight: 600;
}

.form-note {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3);
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

/* Confirm Modal */
.confirm-content {
  text-align: center;
  padding: var(--space-2) 0;
}

.confirm-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin: 0 auto var(--space-3);
}

.success-icon-box {
  background-color: #dcfce7;
}

.danger-icon-box {
  background-color: #fee2e2;
}

.confirm-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-navy);
  margin: 0 0 var(--space-3) 0;
}

.product-confirm-summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  text-align: left;
  margin-bottom: var(--space-3);
}

.confirm-product-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.confirm-product-name {
  display: block;
  font-weight: 600;
  color: var(--color-navy);
}

.confirm-product-meta {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.status-change-note {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: left;
}

.note-warning {
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.note-info {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #14532d;
}

.modal-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  width: 100%;
}
</style>

