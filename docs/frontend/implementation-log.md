# Log Implementasi Frontend (Frontend Implementation Log)

**Proyek:** Sistem Pemesanan dan Manajemen Pangkalan LPG (LPG3KGS)  
**Dokumen Pelacak Kemajuan Pengembangan UI Frontend**

---

## Ringkasan Progres

| Tahap | Modul / Cakupan | Status | Tanggal Selesai | Catatan |
|---|---|:---:|:---:|---|
| **Tahap 0** | **Frontend Foundation & Setup** | 🟢 Selesai | 2026-11-01 | Setup design tokens, CSS variables, 15 reusable UI components, 4 layouts, mock data, typecheck & build lulus |
| **Tahap 1** | **Autentikasi & Akun Publik** | 🟢 Selesai | 2026-11-01 | PG-01 Login multi-role & status checks, PG-02 Registrasi Pengecer (no NIK/KTP), PG-03 Pending Display, PG-28 Profil & Sandi |
| **Tahap 2** | **Manajemen Pengguna & Approval** | 🟢 Selesai | 2026-11-01 | PG-06 Kelola User (Pengecer & Karyawan tabs, CRUD, toggle status, reset sandi), PG-07 Persetujuan Pengecer (approval, reject beralasan, validasi PRD) |
| **Tahap 3A** | **Manajemen Produk** | 🟢 Selesai | 2026-11-01 | PG-08 Daftar Produk, PG-09 Tambah/Edit Produk (modal), toggle status, pencarian, filter, pagination |
| **Tahap 3B** | **Manajemen Inventaris & Stok** | 🟢 Selesai | 2026-11-01 | PG-10 Ringkasan Stok (Admin & Karyawan), PG-11 Catat Pasokan Agen, PG-12 Riwayat Pergerakan Stok, PG-13 Koreksi Stok (Khusus Admin) |
| **Tahap 4A** | **Pemesanan Pengecer (Katalog & Order)** | 🟢 Selesai | 2026-11-01 | PG-22 Katalog Pengecer, PG-23 Keranjang & Pengajuan Order, PG-24 Riwayat Pesanan Saya, PG-25 Detail Pesanan Saya |
| **Tahap 4B** | **Pengecer (Transaksi & Tagihan Bon)** | ⚪ Belum Dimulai | — | PG-26 Transaksi Saya, PG-27 Tagihan Bon Saya |
| **Tahap 5A** | **Manajemen Pesanan Internal** | 🟢 Selesai | 2026-11-01 | PG-14 Pesanan Masuk (Admin/Staff), PG-15 Detail & Pengelolaan Order (Konfirmasi, Tolak, Batal, Serah-Terima) |
| **Tahap 5B** | **Penjualan Langsung** | ⚪ Belum Dimulai | — | PG-16 Penjualan Langsung (Non-Order) |
| **Tahap 6** | **Pembayaran Bon & Piutang** | ⚪ Belum Dimulai | — | PG-17 Pembayaran Bon, Pencarian & Cicilan |
| **Tahap 7** | **Dashboard, Laporan & Audit** | ⚪ Belum Dimulai | — | PG-04/05 Dashboard, PG-18/19/20 Laporan, PG-21 Audit |
| **Tahap 8** | **UAT & Acceptance Checklist** | ⚪ Belum Dimulai | — | Verifikasi final responsivitas & acceptance checklist |

---

## Log Riwayat Aktivitas

### [2026-11-01] — Setup & Foundation
- **Inisialisasi Panduan:** Membuat `docs/frontend/frontend-agent-guidelines.md` dan `docs/frontend/implementation-log.md`.
- **Instalasi Paket:** Menjalankan `npm.cmd ci` dengan hasil 0 vulnerabilities fatal, generator Nuxt aktif.
- **Implementasi Design System:** Membuat `app/assets/css/main.css` yang mendefinisikan token CSS (warna, font, spasi, radius, elevasi, breakpoint).
- **Pembuatan Reusable Components:** Tombol, input, select, textarea, checkbox, badge status, kartu, modal, tabel responsif, pagination, skeleton, empty state, error state, dan toast.
- **Pembuatan Layout Utama:** Default, Admin, Staff, dan Retailer layout dengan navigasi desktop dan mobile drawer.
- **Pembuatan Mock Data:** Menyiapkan mock data realistis di `app/data/` untuk simulasi pengguna, katalog, pesanan, transaksi, dan stok.
- **Halaman Preview:** Menyiapkan route preview role (`/`, `/admin`, `/staff`, `/retailer`, `/preview-components`).

### [2026-11-01] — Tahap 1: Authentication & Public Account UI
- **Penyempurnaan `mockAuth.ts` & `useMockAuth.ts`:**
  - Menambahkan store reaktif pengguna `mock_users_store` yang menyimpan status dan kata sandi demo.
  - Menambahkan fungsi otentikasi simulasi: `login()`, `register()`, `changePassword()`, `updateProfile()`, `logout()`.
  - Simulasi validasi status akun: `PENDING` (ditolak masuk dengan penjelasan menunggu admin), `INACTIVE` (ditolak masuk), `ACTIVE` (berhasil login & redirect sesuai role).
- **PG-01 Login (`app/pages/login.vue`):**
  - Input identitas (username/email) dan kata sandi dengan toggle lihat/sembunyikan kata sandi.
  - Validasi field wajib dan tampilan banner error kredensial / status akun.
  - Tombol pengujian instan untuk role Admin, Karyawan, Pengecer Aktif, Akun Pending, Akun Nonaktif, dan Sandi Salah.
  - Redirect otomatis pasca login: Admin (`/admin`), Karyawan (`/staff`), Pengecer (`/retailer`).
- **PG-02 Registrasi Pengecer Mandiri (`app/pages/register.vue`):**
  - Form pendaftaran pengecer B2B dengan validasi nama, kontak, email, username unik, kata sandi (min. 10 karakter), dan konfirmasi sandi.
  - Kepatuhan PRD: **Tidak meminta atau menyimpan NIK/KTP**.
  - Pengecekan duplikasi username secara lokal terhadap pengguna yang sudah terdaftar.
  - Data pendaftar baru disimpan dengan status `PENDING` dan dialihkan ke halaman status pending.
- **PG-03 Status Menunggu Persetujuan (`app/pages/registration-pending.vue`):**
  - Menampilkan ringkasan pendaftaran pengguna terbaru atau sampel akun pending.
  - Memberikan penegasan bahwa akun belum dapat digunakan untuk memesan sebelum diverifikasi dan disetujui Admin.
- **PG-28 Profil & Keamanan (`app/pages/profile.vue`):**
  - Menampilkan identitas akun aktif, role badge, status badge, dan tanggal bergabung.
  - Form edit profil (nama, nama usaha, kontak, email) dengan feedback sukses.
  - Form ubah kata sandi dengan verifikasi kata sandi lama, validasi panjang kata sandi baru (>=10 karakter), dan konfirmasi sandi baru.
  - Tombol keluar sesi (Logout) dengan modal konfirmasi dan pengalihan ke `/login`.
- **Verifikasi Kualitas:**
  - `npm.cmd run typecheck`: 0 error.
  - `npm.cmd run build`: Berhasil kompilasi produksi (0 warning/error).
- **Bug Fix Component Auto-import Registration:**
  - *Masalah:* Komponen `<BaseInput>`, `<BaseButton>`, `<BaseCard>`, dll. yang berada di `app/components/common/` secara default diberi prefix folder oleh Nuxt (menjadi `CommonBaseInput`, `CommonBaseButton`, dll.), sehingga tag `<BaseInput>` tidak ter-render di browser (terlihat kosong/tidak interaktif).
  - *Perbaikan:* Menambahkan konfigurasi `components: [{ path: '~/components', pathPrefix: false }]` di `nuxt.config.ts`, serta memperbaiki prop tipe numerik di `preview-components.vue`.
  - *Hasil:* Seluruh input form, tombol, dan interaktivitas telah ter-render dan terhidrasi dengan sempurna di browser.
- **Bug Fix Root Route (`/`) Interception by Nitro Server Route:**
  - *Masalah:* Akses ke `http://localhost:3000/` mengembalikan JSON placeholder backend (`server/routes/index.get.ts`) bawaan setup awal sebelum frontend dibuat, sehingga mem-bypass halaman utama `app/pages/index.vue`.
  - *Perbaikan:* Menambahkan `ignore: ['server/routes/index.get.ts']` di `nuxt.config.ts` agar Nitro menyerahkan routing root `/` ke frontend renderer Nuxt tanpa perlu mengubah atau menghapus file backend.
  - *Hasil:* Akses ke `http://localhost:3000/` kini menampilkan halaman utama switcher portal dan panduan antarmuka secara sempurna.
  - `npm.cmd test`: 16/16 backend tests passed.
  - Seluruh alur diuji pada viewport desktop dan mobile.

### [2026-11-01] — Tahap 2: Manajemen Pengguna & Persetujuan Pengecer (PG-06 & PG-07)
- **Ekstensi Composable & Mock Store (`useMockAuth.ts` & `mockAuth.ts`):**
  - Menambahkan field `rejection_reason?: string` pada model `MockUser`.
  - Menambahkan fungsi approval pengecer: `approveRetailer(id)` yang mengubah status `PENDING` -> `ACTIVE`.
  - Menambahkan fungsi penolakan pengecer: `rejectRetailer(id, reason)` yang memvalidasi alasan wajib dan mengubah status -> `REJECTED`.
  - Menambahkan fungsi administrasi pengguna: `addUser(payload)` (akun otomatis `ACTIVE`), `updateUser(id, data)` (reaktif ke sesi aktif), `toggleUserStatus(id)` (toggle `ACTIVE` <-> `INACTIVE` dengan perlindungan admin utama), dan `resetUserPassword(id, newPass)`.
  - Menambahkan sinkronisasi `localStorage` client-safe (`lpg3kgs_mock_users_v1`) bebas hydration error pada Nuxt SSR.
  - Memperbarui `login()`: akun `REJECTED` ditolak dengan menampilkan alasan penolakan, akun `INACTIVE` ditolak dengan instruksi hubungi pemilik pangkalan.
- **PG-07: Persetujuan Pengecer (`app/pages/admin/users/pending.vue`):**
  - Tampilan daftar pengecer berstatus `PENDING` dengan tabel desktop dan card list responsif mobile.
  - Indikator counter pendaftaran menunggu persetujuan pada header halaman.
  - Fitur pencarian instan (nama warung, penanggung jawab, username, kontak) dan filter status.
  - Modal detail pendaftar lengkap tanpa meminta atau menampilkan NIK/KTP (kepatuhan regulasi PRD).
  - Dialog konfirmasi persetujuan akun dengan ringkasan data pendaftar.
  - Modal penolakan dengan input alasan wajib diisi dan validasi sebelum submit.
  - Empty state khusus saat daftar kosong atau hasil pencarian nihil.
- **PG-06: Manajemen Pengguna (`app/pages/admin/users/index.vue`):**
  - Tab navigasi role: **Pengecer B2B** dan **Karyawan Operasional** dengan lencana jumlah akun real-time.
  - Banner peringatan dinamis jika terdapat pengecer berstatus pending, lengkap dengan link ke `/admin/users/pending`.
  - Tabel desktop dan kartu mobile dengan info nama, nama usaha (pengecer), username, kontak, email, tanggal pembuatan, status badge, dan tombol aksi.
  - Pencarian, filter status (`ALL`, `ACTIVE`, `INACTIVE`), dan pagination (`PaginationNav`).
  - Modal tambah akun baru (Pengecer / Karyawan) dengan validasi username unik, nomor kontak, format email, dan panjang password min. 10 karakter.
  - Modal edit informasi akun dengan pembaruan reaktif langsung ke mock state.
  - Modal konfirmasi aktifkan / nonaktifkan akun dengan penjelasan dampak bagi pengguna.
  - Modal reset password oleh Admin dengan validasi min. 10 karakter dan konfirmasi kata sandi baru.
- **Verifikasi Kualitas:**
  - `npm.cmd run typecheck`: Lulus (0 error).
  - `npm.cmd run build`: Berhasil kompilasi produksi dalam 9.39s.
  - `npm.cmd test`: 16/16 test backend tetap lulus.
  - Verifikasi response dev server: `http://localhost:3000/admin/users` dan `http://localhost:3000/admin/users/pending` merespons status 200 OK.

### [2026-11-01] — Tahap 3A: Manajemen Produk (PG-08 & PG-09)
- **Composable `useMockProducts.ts` (BARU):**
  - State reaktif produk (`mock_products_store`) menggunakan `useState` + sinkronisasi `localStorage` (`lpg3kgs_mock_products_v1`) bebas hydration error.
  - Fungsi `addProduct(payload)`: menambahkan produk baru dengan initial stok nol (stok dikelola terpisah sesuai PRD).
  - Fungsi `updateProduct(id, data)`: memperbarui nama, ukuran, harga, stok minimum, status produk — tidak mengubah field stok.
  - Fungsi `toggleProductStatus(id)`: toggle status `ACTIVE` ↔ `INACTIVE` tanpa menghapus produk atau mempengaruhi data stok.
  - Fungsi `resetDefaultProducts()`: reset ke data default 3 produk LPG standar.
  - Mengekspor tipe `CreateProductPayload` dan `UpdateProductPayload` untuk typing ketat di halaman.
- **PG-08 & PG-09: Produk & Harga (`app/pages/admin/products.vue`):**
  - Tabel desktop dengan kolom: Nama Produk, Ukuran (kg), Harga Jual, Min. Stok, Status badge, Aksi (Edit + Toggle Status).
  - Card list mobile-first untuk layar kecil dengan informasi ringkas + aksi yang sama.
  - Pencarian real-time berdasarkan nama produk atau ukuran (kg).
  - Filter status: Semua / Aktif / Nonaktif.
  - Pagination 8 item per halaman dengan komponen `PaginationNav`.
  - Kartu counter ringkasan: total produk aktif, nonaktif, dan stok rendah.
  - **PG-09 Modal Tambah Produk:** field nama, ukuran (kg), harga (format Rupiah dengan pemisah ribuan), stok minimum, status; validasi lengkap sebelum submit; mencegah submit ganda.
  - **PG-09 Modal Edit Produk:** pre-fill data produk terpilih, validasi, update reaktif ke state dan `localStorage`.
  - **Modal Konfirmasi Toggle Status:** menampilkan nama produk, status saat ini vs target, dan dampak aksi sebelum dikonfirmasi.
  - Empty state saat daftar produk kosong atau pencarian tidak menemukan hasil.
  - State loading (simulasi delay), success toast, dan error fallback.
  - Layout responsif mobile-first sesuai design system.
  - Integritas PRD: perubahan harga **tidak** mengubah harga transaksi historis; produk baru mulai dengan stok nol; stok dikelola di modul terpisah (Tahap 3B).
- **Bug Fix & Catatan Teknis:**
  - Input harga menggunakan `<input type="text">` native dengan fungsi `parsePriceInput()` untuk format Rupiah (1.000.000) karena `BaseInput` tidak mendukung format angka khusus secara nativ.
  - Fungsi `formatRupiah`, `formatDate`, `formatDateTime` diakses via auto-import Nuxt dari `useFormatters.ts`.
  - Seluruh variant `BaseButton` yang digunakan: `primary`, `secondary`, `danger`, `ghost` (tidak ada `outline`).
- **Verifikasi Kualitas:**
  - `npm.cmd run typecheck`: Lulus (0 error).
  - `npm.cmd run build`: Berhasil kompilasi produksi dalam 9.52s.

### [2026-11-01] — Tahap 3B: Manajemen Inventaris & Stok (PG-10 s.d. PG-13)
- **Composable `useMockInventory.ts` (BARU):**
  - State saldo inventaris reaktif (`lpg3kgs_inventory_balances`) dan log pergerakan stok (`lpg3kgs_inventory_movements`) via `useState`.
  - Sinkronisasi `localStorage` client-safe (`lpg3kgs_mock_inventory_v1`) via `onMounted` + `import.meta.client`.
  - Saldo stok terpisah dari master data produk; data nama/harga tetap mengacu pada `useMockProducts()`.
  - Fungsi `recordReceipt(payload)`:
    - Menambah tabung penuh diterima (`full_received`) ke stok penuh fisik (`full_qty`).
    - Mengurangi tabung kosong dikembalikan (`empty_sent`) dari stok kosong fisik (`empty_qty`).
    - Validasi: `empty_sent` tidak boleh melebihi `empty_qty` saat itu.
    - Menghitung ulang stok tersedia secara ketat: `available_qty = Math.max(0, full_qty - reserved_qty)`.
    - Saldo `reserved_qty` tidak diubah sama sekali.
    - Menghasilkan record `StockMovement` tipe `PENERIMAAN_PASOKAN` dengan pencatatan saldo sebelum dan sesudah.
  - Fungsi `recordAdjustment(payload)`:
    - Koreksi delta stok penuh (`full_delta`) dan stok kosong (`empty_delta`).
    - Validasi PRD: alasan wajib diisi, delta tidak boleh keduanya nol, hasil saldo akhir tidak boleh negatif.
    - Saldo `reserved_qty` tidak diubah sama sekali.
    - Menghasilkan record `StockMovement` tipe `KOREKSI_STOK`.
  - Fungsi `getBalance(productId)` dan `resetDefault()`.
  - Mock pergerakan awal realistis (6 riwayat terurut waktu).
- **PG-10: Ringkasan Stok:**
  - Route Admin: `/admin/inventory` (`app/pages/admin/inventory/index.vue`).
  - Route Karyawan (baca-saja): `/staff/inventory` (`app/pages/staff/inventory/index.vue`).
  - Menampilkan 4 saldo terpisah per produk: Stok Penuh, Stok Kosong, Dialokasikan (Reserved), dan Stok Tersedia.
  - Menegakkan aturan PRD: Stok Penuh dan Stok Kosong adalah saldo berbeda dan **dilarang dijumlahkan**.
  - Peringatan stok rendah dinamis (berdasarkan ambang minimum tiap produk).
  - Pencarian produk dan filter status (Semua, Aktif, Nonaktif, Stok Rendah).
  - Tampilan tabel desktop dan kartu mobile-first.
- **PG-11: Catat Penerimaan Pasokan Agen:**
  - Route Admin: `/admin/inventory/receipts` (`app/pages/admin/inventory/receipts.vue`).
  - Route Karyawan: `/staff/inventory/receipts` (`app/pages/staff/inventory/receipts.vue`).
  - Pilihan produk aktif, input tabung penuh diterima, input tabung kosong dikembalikan ke agen.
  - Simulasi perubahan saldo real-time (tabel sebelum vs delta vs sesudah).
  - Validasi ketat jika tabung kosong yang dikirim melebihi saldo tabung kosong yang tersedia.
  - Modal konfirmasi tindakan sebelum mutasi saldo dieksekusi.
- **PG-12: Riwayat Pergerakan Stok:**
  - Route Admin: `/admin/inventory/movements` (`app/pages/admin/inventory/movements.vue`).
  - Route Karyawan: `/staff/inventory/movements` (`app/pages/staff/inventory/movements.vue`).
  - Tabel dan kartu dengan detail waktu, nama produk, lencana jenis pergerakan, Δ penuh, Δ kosong, saldo sebelum & sesudah, keterangan, dan aktor.
  - Filter lengkap: pencarian teks, filter per produk, filter per jenis pergerakan, filter rentang tanggal.
  - Pagination dinamis (`PaginationNav`).
  - Modal detail pergerakan lengkap saat baris diklik.
- **PG-13: Koreksi Stok Fisik (Khusus Admin):**
  - Route Admin: `/admin/inventory/adjustments` (`app/pages/admin/inventory/adjustments.vue`).
  - Pembatasan hak akses: menu dan halaman tidak tersedia untuk role Karyawan.
  - Form koreksi delta penuh & delta kosong (bisa positif/negatif) dengan field alasan wajib diisi.
  - Validasi pencegahan saldo negatif dan peringatan visual seketika.
  - Dialog konfirmasi aksi sensitif sebelum saldo diperbarui.
- **Verifikasi Kualitas:**
  - `npm.cmd run typecheck`: Lulus (0 error).
  - `npm.cmd run build`: Berhasil kompilasi produksi dalam 10.5s.
  - Verifikasi response 7 route inventaris pada dev server: seluruhnya merespons `200 OK`.


### [2026-11-01] — Tahap 4A: Pemesanan Pengecer — Katalog & Order (PG-22 s.d. PG-25)
- **Composable `useMockOrders.ts` (BARU):**
  - Mengelola state keranjang (`mock_cart_store`) dan daftar pesanan (`mock_orders_store`) via `useState` Nuxt.
  - Sinkronisasi `localStorage` client-safe (`lpg3kgs_mock_cart_v1` dan `lpg3kgs_mock_orders_v1`) bebas hydration error SSR.
  - Cart actions: `addToCart()`, `updateCartQty()`, `removeFromCart()`, `clearCart()`, `cartCount`, `cartTotal`.
  - Integrasi stok real-time via `getProductAvailableQty()` dari `useMockInventory.ts`: `max(0, full_qty - reserved_qty)`.
  - Fungsi `createOrder(retailerInfo)`:
    - Memvalidasi ulang stok seluruh item sebelum submit.
    - Menghasilkan nomor pesanan unik (contoh: `ORD-20261101-XXXX`).
    - Status default pesanan: `MENUNGGU_KONFIRMASI`.
    - **Penegakan Aturan PRD:** Pengajuan pesanan **TIDAK mengubah stok fisik dan TIDAK menambah `reserved_qty`**. Stok baru dialokasikan saat dikonfirmasi oleh Admin/Petugas pada tahap berikutnya.
    - Mengaitkan identitas pesanan dengan `currentUser` (retailer).
    - Mengosongkan keranjang setelah submit berhasil.
    - Menyimpan catatan linimasa pertama pada `history`: "Pesanan diajukan oleh pengecer".
- **Ekstensi `mockOrders.ts`:**
  - Menambahkan interface `OrderStatusHistory` dan memperluas model `MockOrder` (mendukung `history`, `rejection_reason`, `cancellation_reason`).
  - Menambahkan data sampel pesanan untuk pengecer lain (`usr-ret-04`) untuk menguji isolasi hak akses data pengecer.
- **PG-22: Katalog Produk Pengecer (`app/pages/retailer/catalog.vue`):**
  - Menampilkan produk gas LPG aktif dari `useMockProducts.ts`.
  - Menampilkan stok tersedia real-time dari `useMockInventory.ts`.
  - Indikator status stok: `Tersedia`, `Stok Terbatas` (di bawah minimum), dan `Stok Habis`.
  - Produk dengan stok habis dinonaktifkan dari tombol tambah keranjang dan diberi pesan penjelas.
  - Kontrol kuantitas instan (+ / -) yang dibatasi maksimal sesuai stok tersedia pangkalan.
  - Pencarian produk dan filter ukuran tabung (3 kg, 5.5 kg, 12 kg).
  - Badge ringkasan keranjang pada hero banner yang responsif.
  - Empty state khusus bila pencarian tidak menemukan produk.
- **PG-23: Keranjang & Pengajuan Pesanan (`app/pages/retailer/cart.vue`):**
  - Daftar item belanja lengkap dengan nama, ukuran tabung, harga satuan, counter kuantitas, dan subtotal.
  - Deteksi dan peringatan dinamis (*conflict alert*) jika kuantitas item melebihi stok tersedia di pangkalan.
  - Tombol kosongkan keranjang dan hapus item individual.
  - Ringkasan total kuantitas tabung dan total Rupiah.
  - Kotak edukasi aturan bisnis PRD V1.
  - Modal konfirmasi sebelum submit pesanan dengan rincian lengkap dan tombol submit dicegah dari klik ganda (*loading state*).
  - Pengalihan otomatis ke `/retailer/orders` setelah pesanan berhasil diajukan.
- **PG-24: Riwayat Pesanan Saya (`app/pages/retailer/orders/index.vue`):**
  - **Isolasi Data Pengecer (PRD Rule):** Hanya menampilkan pesanan milik pengecer yang sedang login (`o.retailer_id === currentUser.id`). Pesanan pengecer lain tidak pernah bocor.
  - Kartu pesanan mobile-first dengan nomor order, tanggal, ringkasan produk, total tagihan, dan `StatusBadge`.
  - Tampilan catatan alasan penolakan pada kartu jika pesanan berstatus `DITOLAK`.
  - Filter status pesanan (Semua, Menunggu, Dikonfirmasi, Selesai, Ditolak) dan pencarian nomor order.
  - Pagination terintegrasi dengan `PaginationNav`.
  - Empty state informatif jika belum ada pesanan atau pencarian nihil.
- **PG-25: Detail Pesanan Saya (`app/pages/retailer/orders/[id].vue`):**
  - Validasi kepemilikan pesanan: jika mencoba membuka ID pesanan milik pengecer lain atau pesanan tidak ada, menampilkan tampilan `ErrorState` ("Pesanan Tidak Ditemukan atau Anda Tidak Memiliki Hak Akses").
  - Header detail dengan nomor order, waktu pengajuan, dan status badge.
  - Banner peringatan khusus jika status `DITOLAK` (beserta alasan penolakan) atau `DIBATALKAN`.
  - Stepper linimasa progres visual (Pengajuan → Dikonfirmasi → Selesai).
  - Tabel rincian produk (desktop) dan kartu produk (mobile) dengan harga satuan, kuantitas, dan subtotal.
  - Log riwayat perjalanan pesanan (*status history timeline*) dengan waktu, status badge, catatan keterangan, dan aktor petugas.
  - Informasi identitas pemesan dan panduan pengambilan tabung kosong ke pangkalan.
  - Kepatuhan PRD: tidak ada tombol konfirmasi pesanan atau serah terima di sisi Pengecer.
- **Pembaruan Navigasi Layout Pengecer (`app/layouts/retailer.vue` & `app/pages/retailer/index.vue`):**
  - Sinkronisasi link rute ke `/retailer/catalog`, `/retailer/cart`, `/retailer/orders`.
  - Penambahan badge kuantitas keranjang pada bottom navigation bar mobile.
  - Rute root `/retailer` otomatis mengalihkan ke `/retailer/catalog`.
- **Verifikasi Kualitas:**
  - `npm.cmd run typecheck`: Lulus (0 error).
  - `npm.cmd run build`: Berhasil kompilasi produksi dalam 11.2s.
  - Verifikasi response 4 rute baru pada server dev: `/retailer/catalog`, `/retailer/cart`, `/retailer/orders`, dan `/retailer/orders/ord-001` seluruhnya merespons `200 OK`.


### [2026-11-01] — Tahap 5A: Manajemen Pesanan Internal (PG-14 & PG-15)
- **Ekstensi Composable Inventaris (`useMockInventory.ts`):**
  - Menambahkan fungsi koordinasi mutasi stok order:
    - `allocateOrderStock()`: Validasi atomik ketersediaan seluruh item sebelum reservasi; menambah `reserved_qty` tanpa mengubah stok fisik; mencatat movement tipe `ALOKASI_ORDER`.
    - `releaseOrderStock()`: Mengurangi `reserved_qty` (min 0) saat pesanan dibatalkan setelah dikonfirmasi; mencatat movement tipe `PELEPASAN_ALOKASI`.
    - `completeOrderHandoverStock()`: Mengurangi stok fisik penuh (`full_qty`), melepaskan `reserved_qty`, menambah stok fisik kosong (`empty_qty`), dan mencatat movement tipe `SERAH_TERIMA`.
- **Composable Penjualan `useMockSales.ts` (BARU):**
  - Mengelola data penjualan transaksi (`mock_sales_store`) dengan sinkronisasi `localStorage` (`lpg3kgs_mock_sales_v1`).
  - Fungsi `createSaleFromOrder()`:
    - Validasi idempoten: satu order hanya dapat diselesaikan tepat satu kali.
    - Menghasilkan nomor penjualan resmi (`SAL-YYYYMMDD-XXXX`).
    - Menangani status pembayaran: `LUNAS` (tunai penuh), `DIBAYAR_SEBAGIAN` (bon dengan DP), atau `BELUM_DIBAYAR` (bon tanpa uang muka).
    - Mencatat pembayaran awal ke dalam daftar `payments`.
    - Menyimpan catatan pengembalian tabung kosong aktual per item produk.
- **Ekstensi Composable Pesanan (`useMockOrders.ts`):**
  - Menambahkan fungsi operasional internal:
    - `confirmOrder(orderId, actor)`: Memvalidasi stok cukup untuk semua item, memicu alokasi stok inventaris, mengubah status ke `DIKONFIRMASI`, mencatat linimasa history.
    - `rejectOrder(orderId, reason, actor)`: Memvalidasi alasan wajib diisi, mengubah status ke `DITOLAK`, menyimpan `rejection_reason` (transparan bagi pengecer), mencatat linimasa history.
    - `cancelOrder(orderId, reason, actor)`: Memvalidasi alasan wajib diisi, melepaskan alokasi stok reserved jika sebelumnya sudah dikonfirmasi, mengubah status ke `DIBATALKAN`, menyimpan `cancellation_reason`, mencatat linimasa history.
    - `completeOrder(orderId, payload, actor)`: Memvalidasi status order `DIKONFIRMASI`, memvalidasi input pembayaran tunai/bon, memicu serah-terima fisik stok, membentuk data penjualan tepat satu kali, mengubah status ke `SELESAI`, mencatat linimasa history.
- **Komponen Bersama Antrean & Detail Pesanan:**
  - `app/components/orders/OrderQueueTable.vue` (PG-14):
    - Antrean pesanan operasional lengkap dari seluruh pengecer.
    - Filter status dinamis dengan lencana counter pesanan pending dan siap serah-terima.
    - Pencarian fleksibel (nomor pesanan, nama pengecer, nama warung) dan filter rentang tanggal.
    - Tombol aksi cepat konfirmasi dari daftar tabel desktop dan kartu mobile.
    - Pagination responsif dengan `PaginationNav`.
  - `app/components/orders/OrderDetailManager.vue` (PG-15):
    - Header rincian order, identitas pengecer, stepper visual alur status.
    - Tabel rincian produk dengan indikator kesiapan stok real-time (*stock check*).
    - Kotak referensi bukti penjualan resmi (`MockSale`) jika status `SELESAI`.
    - Modal interaktif: Konfirmasi Pesanan (dengan pengecekan stok), Tolak Pesanan (alasan wajib), Batalkan Pesanan (pelepasan stok reserved), dan Selesaikan Serah-Terima & Pembayaran (input tabung kosong per item + kalkulasi tunai/bon).
- **Halaman-Halaman yang Dibuat:**
  - PG-14 Admin: `/admin/orders` (`app/pages/admin/orders/index.vue`).
  - PG-14 Karyawan: `/staff/orders` (`app/pages/staff/orders/index.vue`).
  - PG-15 Admin: `/admin/orders/[id]` (`app/pages/admin/orders/[id].vue`).
  - PG-15 Karyawan: `/staff/orders/[id]` (`app/pages/staff/orders/[id].vue`).
- **Verifikasi Kualitas Awal:**
  - `npm.cmd run typecheck`: Lulus (0 error).
  - `npm.cmd run build`: Berhasil kompilasi produksi dalam 14.1s.
  - Verifikasi response 4 rute baru pada server dev: `/admin/orders`, `/admin/orders/ord-001`, `/staff/orders`, `/staff/orders/ord-001` seluruhnya merespons `200 OK`.

### Penyesuaian Detail Tahap 5A (Internal Order Management Refinement)
- **Penyesuaian PG-14 (`OrderQueueTable.vue`):**
  - Kolom tabel desktop diselaraskan secara eksplisit: Nomor Pesanan, Waktu Diajukan, Pengecer & Nama Usaha, **Jumlah Jenis Produk** (lencana jenis), Ringkasan Produk, Total Nilai, Status, dan Aksi Detail/Konfirmasi Cepat.
  - Tampilan kartu mobile dipertegas menampilkan `X jenis produk:` diikuti ringkasan item dan total tabung.
- **Penyesuaian PG-15 (`OrderDetailManager.vue`):**
  - Tampilan **Nomor Kontak Pengecer** (`retailer_contact`) ditambahkan pada card Informasi Pengecer.
  - **Inisialisasi Nilai Tabung Kosong:** Form pengembalian tabung kosong pada modal serah-terima diinisialisasi secara tepat dengan nilai `empty_returned = 0` (bukan otomatis sama dengan kuantitas keluar), mencakup seluruh item produk dalam pesanan.
  - **Ringkasan Sebelum Konfirmasi Serah-Terima:** Ditambahkan panel review lengkap sebelum tombol konfirmasi serah-terima diklik, menampilkan rincian fisik tabung (tabung penuh diserahkan vs tabung kosong diterima per item) serta rincian keuangan (total transaksi, jenis pembayaran tunai/bon, nominal pembayaran awal diterima, dan estimasi sisa piutang/bon).
- **Penyesuaian Detail Pesanan Pengecer (`app/pages/retailer/orders/[id].vue`):**
  - Ditambahkan banner informasi referensi bukti transaksi penjualan resmi (`sale_number`) saat pesanan sudah berstatus `SELESAI`.
- **Hasil Pengujian Komprehensif:**
  - `npm.cmd run typecheck`: Lulus 100% tanpa error (`nuxt typecheck`).
  - `npm.cmd test`: Lulus 16 test backend tanpa kegagalan (0 fail, 2 PostgreSQL multi-connection skipped), mengonfirmasi tidak ada efek samping maupun regresi pada backend.
  - `npm.cmd run build`: Sukses build produksi Nuxt/Nitro dalam 12.0s dengan 0 error.
