<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { showSuccess, showError, showWarning, showInfo } = useNotification()

// State untuk pengujian form
const textInput = ref('Nilai awal')
const numberInput = ref(15)
const selectVal = ref('TUNAI')
const textareaVal = ref('Catatan pasokan dari agen.')
const checkVal = ref(true)
const isModalOpen = ref(false)
const currentPage = ref(1)

const selectOptions = [
  { value: 'TUNAI', label: 'Tunai (Cash)' },
  { value: 'BON', label: 'Bon (Piutang Usaha)' },
  { value: 'TRANSFER', label: 'Transfer Bank' }
]

// Mock data ringkas untuk tabel
const tableRows = [
  { id: '1', name: 'LPG 3 kg', full: 80, empty: 35, reserved: 15, available: 65, price: 19000, status: 'ACTIVE' },
  { id: '2', name: 'Bright Gas 5,5 kg', full: 12, empty: 8, reserved: 4, available: 8, price: 92000, status: 'LOW_STOCK' },
  { id: '3', name: 'Bright Gas 12 kg', full: 18, empty: 14, reserved: 0, available: 18, price: 195000, status: 'ACTIVE' },
]
</script>

<template>
  <div class="components-preview container">
    <div class="preview-header">
      <NuxtLink to="/" class="back-link">← Kembali ke Beranda</NuxtLink>
      <h1 class="page-title">Galeri Komponen Reusable UI</h1>
      <p class="page-subtitle">
        Kumpulan komponen desain sistem LPG3KGS yang dibuat modular, konsisten, dan siap digunakan pada seluruh halaman.
      </p>
    </div>

    <!-- 1. BUTTONS -->
    <BaseCard title="1. BaseButton (Tombol)" subtitle="Mendukung berbagai varian, ukuran, dan loading state" class="mb-6">
      <div class="demo-section">
        <h4 class="demo-label">Varian Warna:</h4>
        <div class="flex flex-wrap gap-3 items-center">
          <BaseButton variant="primary" @click="showSuccess('Tombol Utama diklik!')">Primary</BaseButton>
          <BaseButton variant="secondary" @click="showInfo('Tombol Sekunder diklik!')">Secondary</BaseButton>
          <BaseButton variant="success" @click="showSuccess('Aksi Sukses berhasil!')">Success</BaseButton>
          <BaseButton variant="danger" @click="showError('Aksi Dihapus!')">Danger</BaseButton>
          <BaseButton variant="ghost" @click="showWarning('Tombol Ghost dipilih')">Ghost</BaseButton>
        </div>
      </div>

      <div class="demo-section mt-4">
        <h4 class="demo-label">Ukuran & Kondisi Khusus:</h4>
        <div class="flex flex-wrap gap-3 items-center">
          <BaseButton size="sm">Small (36px)</BaseButton>
          <BaseButton size="md">Medium (44px)</BaseButton>
          <BaseButton size="lg">Large (52px)</BaseButton>
          <BaseButton disabled>Disabled</BaseButton>
          <BaseButton loading>Loading State</BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- 2. STATUS BADGES -->
    <BaseCard title="2. StatusBadge (Label Status Operasional)" subtitle="Pemetaan otomatis status order, pembayaran, dan akun" class="mb-6">
      <div class="demo-section">
        <h4 class="demo-label">Status Pesanan (Order):</h4>
        <div class="flex flex-wrap gap-3 items-center">
          <StatusBadge status="MENUNGGU_KONFIRMASI" />
          <StatusBadge status="DIKONFIRMASI" />
          <StatusBadge status="SELESAI" />
          <StatusBadge status="DITOLAK" />
          <StatusBadge status="DIBATALKAN" />
        </div>
      </div>

      <div class="demo-section mt-4">
        <h4 class="demo-label">Status Pembayaran & Tagihan:</h4>
        <div class="flex flex-wrap gap-3 items-center">
          <StatusBadge status="BELUM_DIBAYAR" />
          <StatusBadge status="DIBAYAR_SEBAGIAN" />
          <StatusBadge status="LUNAS" />
        </div>
      </div>

      <div class="demo-section mt-4">
        <h4 class="demo-label">Status Akun Pengguna & Stok:</h4>
        <div class="flex flex-wrap gap-3 items-center">
          <StatusBadge status="ACTIVE" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="REJECTED" />
          <StatusBadge status="INACTIVE" />
          <StatusBadge status="LOW_STOCK" />
        </div>
      </div>
    </BaseCard>

    <!-- 3. FORM INPUTS -->
    <BaseCard title="3. Form Inputs & Controls" subtitle="Input teks, angka, select, textarea, dan checkbox dengan pesan validasi" class="mb-6">
      <div class="grid grid-cols-1 sm-grid-cols-2 gap-4">
        <BaseInput
          v-model="textInput"
          label="Nama Penanggung Jawab"
          placeholder="Contoh: Ahmad Fauzi"
          helper-text="Sesuai identitas pendaftaran"
          required
        />

        <BaseInput
          v-model="numberInput"
          type="number"
          label="Jumlah Tabung Diambil"
          prefix="📦"
          suffix="tabung"
          helper-text="Format integer bilangan bulat"
        />

        <BaseInput
          model-value=""
          label="Contoh Field Error"
          placeholder="Ketik sesuatu..."
          error-text="Kolom ini wajib diisi sesuai kontrak validasi."
        />

        <BaseSelect
          v-model="selectVal"
          label="Metode Pembayaran"
          :options="selectOptions"
          helper-text="Pilih jenis pembayaran transaksi"
        />
      </div>

      <div class="mt-4">
        <BaseTextarea
          v-model="textareaVal"
          label="Alasan Penolakan / Catatan Pasokan"
          placeholder="Tuliskan keterangan pendukung transaksi di sini..."
          :rows="3"
          helper-text="Maksimal 500 karakter"
        />
      </div>

      <div class="mt-4">
        <BaseCheckbox
          v-model="checkVal"
          label="Saya telah memverifikasi hitung fisik tabung"
          description="Memastikan data tabung isi dan kosong yang dicatat sesuai dengan keadaan nyata di pangkalan."
        />
      </div>
    </BaseCard>

    <!-- 4. MODAL & DIALOG -->
    <BaseCard title="4. BaseModal (Dialog Konfirmasi Aksi Kritis)" subtitle="Modal dapat diakses via keyboard (Esc), klik latar, atau tombol tutup" class="mb-6">
      <p class="text-sm text-muted mb-4">
        PRD mewajibkan dialog konfirmasi sebelum melakukan aksi berdampak seperti Serah-Terima Order, Koreksi Stok, Penolakan, atau Pembatalan.
      </p>

      <BaseButton variant="primary" @click="isModalOpen = true">
        Buka Contoh Dialog Konfirmasi
      </BaseButton>

      <BaseModal
        :is-open="isModalOpen"
        title="Konfirmasi Serah-Terima Barang"
        max-width="500px"
        @close="isModalOpen = false"
      >
        <div class="modal-demo-content">
          <p class="mb-2"><strong>Nomor Pesanan:</strong> ORD-20261101-0001</p>
          <p class="mb-2"><strong>Pengecer:</strong> Warung Sumber Rejeki</p>
          <p class="mb-4 text-muted">
            Apakah Anda yakin ingin menyelesaikan serah-terima pesanan ini? Stok fisik penuh akan berkurang dan penjualan akan dibentuk tepat satu kali.
          </p>

          <BaseInput
            label="Tabung Kosong Aktual Diterima"
            type="number"
            suffix="tabung"
            model-value="15"
            helper-text="Input aktual fisik, bukan asumsi otomatis."
          />
        </div>

        <template #footer>
          <BaseButton variant="secondary" @click="isModalOpen = false">Batal</BaseButton>
          <BaseButton variant="success" @click="isModalOpen = false; showSuccess('Serah-terima pesanan berhasil disimulasikan!')">
            Konfirmasi Selesai
          </BaseButton>
        </template>
      </BaseModal>
    </BaseCard>

    <!-- 5. TABLE & PAGINATION -->
    <BaseCard title="5. BaseTable & PaginationNav" subtitle="Tabel responsif dengan format mata uang dan kuantitas konsisten" class="mb-6">
      <BaseTable>
        <template #head>
          <tr>
            <th>Produk</th>
            <th class="text-right">Stok Penuh</th>
            <th class="text-right">Stok Kosong</th>
            <th class="text-right">Dialokasikan</th>
            <th class="text-right">Tersedia</th>
            <th class="text-right">Harga Jual</th>
            <th>Status</th>
          </tr>
        </template>

        <tr v-for="row in tableRows" :key="row.id">
          <td><strong>{{ row.name }}</strong></td>
          <td class="text-right">{{ formatQuantity(row.full) }}</td>
          <td class="text-right">{{ formatQuantity(row.empty) }}</td>
          <td class="text-right">{{ formatQuantity(row.reserved) }}</td>
          <td class="text-right"><strong class="text-primary">{{ formatQuantity(row.available) }}</strong></td>
          <td class="text-right">{{ formatRupiah(row.price) }}</td>
          <td><StatusBadge :status="row.status" /></td>
        </tr>
      </BaseTable>

      <PaginationNav
        :current-page="currentPage"
        :total-pages="4"
        :total-items="12"
        :page-size="3"
        @update:page="(p: number) => currentPage = p"
      />
    </BaseCard>

    <!-- 6. FEEDBACK STATES -->
    <BaseCard title="6. Feedback & Empty / Loading / Error States" subtitle="Penanganan berbagai kondisi UI saat memuat data" class="mb-6">
      <div class="grid grid-cols-1 sm-grid-cols-3 gap-4">
        <!-- Skeleton -->
        <div class="card-box">
          <h4 class="demo-label mb-2">Loading Skeleton:</h4>
          <LoadingSkeleton type="line" :count="3" class="mb-3" />
          <LoadingSkeleton type="rect" height="40px" />
        </div>

        <!-- Empty State -->
        <EmptyState
          title="Data Kosong"
          description="Belum ada transaksi pada periode ini."
          action-label="Tambah Data"
          @action="showInfo('Aksi tambah data diklik!')"
        />

        <!-- Error State -->
        <ErrorState
          title="Gagal Memuat"
          message="Koneksi terputus saat mengambil data riwayat."
          @retry="showSuccess('Mencoba memuat ulang data...')"
        />
      </div>
    </BaseCard>

    <!-- 7. TOAST TRIGGERS -->
    <BaseCard title="7. Notifikasi Toast (useNotification)" subtitle="Umpan balik instan melayang di sudut layar" class="mb-6">
      <div class="flex flex-wrap gap-3">
        <BaseButton variant="success" size="sm" @click="showSuccess('Pesanan berhasil diajukan dengan nomor ORD-101', 'Pemesanan Berhasil')">
          Trigger Success Toast
        </BaseButton>
        <BaseButton variant="danger" size="sm" @click="showError('Kredensial tidak valid atau akun belum aktif.', 'Autentikasi Gagal')">
          Trigger Error Toast
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="showWarning('Stok tersedia produk LPG 3 kg mendekati ambang batas minimum.', 'Peringatan Stok')">
          Trigger Warning Toast
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showInfo('Data disinkronkan secara lokal menggunakan mock state.')">
          Trigger Info Toast
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.components-preview {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.preview-header {
  margin-bottom: var(--space-6);
}

.back-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  display: inline-block;
  margin-bottom: var(--space-2);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary-900);
  margin-bottom: var(--space-1);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.demo-section {
  display: flex;
  flex-direction: column;
}

.demo-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.modal-demo-content {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}
</style>
