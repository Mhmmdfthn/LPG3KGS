# API Integration Mapping — Frontend ke Backend

**Versi:** 1.0  
**Status:** Pemetaan awal berdasarkan PRD; endpoint aktual belum diverifikasi dalam dokumen ini.  
**Backend:** Node.js + Express.js REST API  
**Database:** PostgreSQL melalui Supabase, diakses dari backend

> **PENTING:** `backend-api.md` dan kode backend aktual merupakan acuan kontrak. Path yang ditulis pada PRD Bagian 7.4 adalah contoh konseptual, bukan jaminan endpoint aktif. Cocokkan seluruh method, path, payload, response, autentikasi, pagination, dan error sebelum menulis service frontend. Jangan menggunakan path kandidat secara langsung sebelum verifikasi.

## 1. Tujuan dokumen

Dokumen ini menghubungkan halaman/fitur frontend dengan kemampuan API backend, mendefinisikan data yang diperlukan UI, serta mencatat hal yang harus diverifikasi.

Frontend hanya berkomunikasi dengan backend melalui REST API. Frontend tidak mengakses database PostgreSQL/Supabase secara langsung.

## 2. Aturan integrasi umum

1. Periksa `backend-api.md`, router/controller/service backend, middleware autentikasi, dan tes backend.
2. Catat endpoint aktual pada tabel di Bagian 4 sebelum implementasi modul.
3. Jangan mengarang endpoint, HTTP method, nama field, enum, atau format response.
4. Gunakan base URL dari konfigurasi environment frontend yang sesuai pola repository.
5. Centralize API client, header, autentikasi, parsing response, timeout, dan error handling.
6. Jangan mengirim secret backend ke browser.
7. Jangan mengakses Supabase/PostgreSQL langsung dari frontend.
8. Backend adalah otoritas untuk role, kepemilikan data, saldo stok, reservasi, status order, penjualan, dan pembayaran.
9. Jangan menganggap request berhasil sebelum menerima respons sukses yang valid.
10. Untuk request timeout/connection lost pada operasi tulis, periksa riwayat/detail sebelum mengirim ulang agar tidak menggandakan transaksi.
11. Gunakan request cancellation/debouncing untuk pencarian/filter bila sesuai, tetapi jangan membatalkan request tulis setelah server mungkin memproses tanpa strategi yang aman.
12. Jangan menyimpan password di browser. Strategi token/cookie mengikuti implementasi backend yang sebenarnya.

## 3. Informasi kontrak yang harus ditemukan

Sebelum integrasi, lengkapi informasi berikut dari `backend-api.md` dan server:

| Area | Hal yang harus diverifikasi | Status |
|---|---|---|
| Base URL | Konfigurasi development dan production | Belum diverifikasi |
| Login | Path, method, payload, response, bentuk sesi/token | Belum diverifikasi |
| Logout | Apakah endpoint diperlukan dan bagaimana sesi diakhiri | Belum diverifikasi |
| Auth transport | Cookie HttpOnly, bearer token, atau mekanisme lain | Belum diverifikasi |
| Refresh/session | Masa berlaku, refresh, invalidasi akun nonaktif | Belum diverifikasi |
| Role | Nilai role aktual dan middleware authorization | Belum diverifikasi |
| Pagination | Query params, bentuk metadata, default page size | Belum diverifikasi |
| Filtering | Nama parameter/filter yang didukung | Belum diverifikasi |
| Sorting | Field dan arah sorting yang didukung | Belum diverifikasi |
| Error envelope | Struktur JSON untuk error validasi/server | Belum diverifikasi |
| Date/time | Format timestamp dan zona waktu | Belum diverifikasi |
| Currency | Representasi nominal Rupiah di response/request | Belum diverifikasi |
| Upload | Apakah ada upload gambar produk atau tidak | Tidak diasumsikan |
| CORS | Origin frontend yang diizinkan | Belum diverifikasi |

## 4. Feature-to-API mapping

Kolom **Endpoint aktual** sengaja belum diisi. Isi setelah verifikasi. Kolom kandidat hanya mengutip jalur konseptual pada PRD dan tidak boleh dianggap aktif sebelum dicocokkan.

| Modul/halaman | Operasi frontend | Data yang dibutuhkan | Kandidat konseptual pada PRD (perlu verifikasi) | Endpoint aktual |
|---|---|---|---|---|
| Login | Login | User identity, role, session/token metadata | `POST /auth/login` | Belum diverifikasi |
| Logout | Logout | Hasil invalidasi sesi bila ada | `POST /auth/logout` | Belum diverifikasi |
| Registrasi pengecer | Submit registrasi | Nama penanggung jawab, nama usaha, kontak, username, password | `POST /retailer-registrations` | Belum diverifikasi |
| Persetujuan pengecer | Daftar pending | Data pengecer, waktu/status pendaftaran | `GET /retailers/pending` | Belum diverifikasi |
| Persetujuan pengecer | Setujui/tolak | Keputusan, alasan penolakan bila ditolak | `PATCH /retailers/{id}/approval` | Belum diverifikasi |
| Manajemen pengecer | Buat/ubah akun | Data minimum pengecer dan status | `POST /retailers`, `PATCH /retailers/{id}` | Belum diverifikasi |
| Manajemen karyawan | Buat/ubah/nonaktifkan | Data akun karyawan yang didukung | `POST /staff`, `PATCH /staff/{id}` | Belum diverifikasi |
| Produk | Daftar produk | ID, nama, ukuran, harga, status aktif | `GET /products` | Belum diverifikasi |
| Produk | Tambah/ubah produk | Nama, ukuran, harga, status | `POST /products`, `PATCH /products/{id}` | Belum diverifikasi |
| Ringkasan stok | Saldo stok | Produk, penuh fisik, kosong fisik, reserved, tersedia, minimum | `GET /inventory` | Belum diverifikasi |
| Riwayat stok | Daftar pergerakan | Waktu, produk, jenis, delta penuh/kosong/reserved, pelaku, sumber | `GET /stock-movements` | Belum diverifikasi |
| Penerimaan pasokan | Simpan penerimaan | Produk, penuh diterima, kosong dikirim, tanggal/catatan | `POST /stock-receipts` | Belum diverifikasi |
| Koreksi stok | Simpan penyesuaian | Produk, saldo/delta, alasan | `POST /stock-adjustments` | Belum diverifikasi |
| Katalog pengecer | Daftar produk dan stok dapat dipesan | Produk aktif, harga, stok tersedia | `GET /products` (konsep) | Belum diverifikasi |
| Keranjang/order | Ajukan order | Daftar item, jumlah; identitas pengecer diambil backend dari sesi | `POST /orders` | Belum diverifikasi |
| Pesanan saya | Daftar order pengecer | Nomor, tanggal, total, status | `GET /orders/my` | Belum diverifikasi |
| Detail order pengecer | Detail order sendiri | Item, harga, status, riwayat | Belum diverifikasi pada PRD secara spesifik | Belum diverifikasi |
| Pesanan masuk | Daftar order internal | Nomor, pengecer, status, tanggal, item ringkas | `GET /orders` | Belum diverifikasi |
| Pesanan masuk | Konfirmasi order | ID order; hasil status/reservasi | `POST /orders/{id}/confirm` | Belum diverifikasi |
| Pesanan masuk | Tolak order | ID order, alasan | `POST /orders/{id}/reject` | Belum diverifikasi |
| Pesanan masuk | Batalkan order | ID order, alasan | `POST /orders/{id}/cancel` | Belum diverifikasi |
| Pesanan masuk | Selesaikan order | ID order, tabung kosong aktual, metode pembayaran, pembayaran awal | `POST /orders/{id}/complete` | Belum diverifikasi |
| Penjualan langsung | Buat sale | Item, kuantitas, kosong diterima, pembayaran tunai | `POST /sales/direct` | Belum diverifikasi |
| Transaksi internal | Daftar/detail sales | Nomor sale, pengecer bila ada, item, total, pembayaran, status | `GET /sales` | Belum diverifikasi |
| Pembayaran bon | Daftar piutang/tagihan | Sale, pengecer, total, dibayar, sisa, status | `GET /receivables` | Belum diverifikasi |
| Pembayaran bon | Catat cicilan/pelunasan | Sale/tagihan, nominal, metode/catatan bila didukung | `POST /sales/{id}/payments` | Belum diverifikasi |
| Transaksi pengecer | Daftar transaksi sendiri | Sale milik sesi pengecer | `GET /my/transactions` | Belum diverifikasi |
| Tagihan pengecer | Daftar tagihan sendiri | Total, pembayaran, sisa, status | `GET /my/receivables` | Belum diverifikasi |
| Dashboard admin | Ringkasan usaha | Stok tersedia, order pending, penjualan hari ini, piutang, stok minimum | `GET /dashboard` | Belum diverifikasi |
| Laporan penjualan | Laporan per periode/filter | Ringkasan dan rincian penjualan | `GET /reports/...` | Belum diverifikasi |
| Laporan stok | Laporan pergerakan | Ringkasan dan rincian stok | `GET /reports/...` | Belum diverifikasi |
| Laporan piutang | Laporan tagihan | Total per pengecer/transaksi, pembayaran, saldo | `GET /reports/...` atau `GET /receivables` | Belum diverifikasi |
| Audit | Daftar audit log | Pelaku, aksi, objek, waktu, ringkasan perubahan | `GET /audit-logs` | Belum diverifikasi |

## 5. Data minimum yang dibutuhkan UI

### 5.1 User/session

UI memerlukan identitas pengguna yang aman untuk ditampilkan (misalnya nama, username, role) dan status akun bila tersedia. Jangan meminta frontend menentukan role dari nilai form atau parameter URL. Jangan menganggap bentuk token tertentu sebelum auth backend diperiksa.

### 5.2 Produk dan stok

Data tampilan minimum per produk:
- ID produk untuk operasi API.
- Nama produk dan ukuran/jenis.
- Harga aktif.
- Status aktif.
- Stok penuh fisik bila role diizinkan.
- Stok kosong fisik bila role diizinkan.
- Stok dialokasikan bila role diizinkan.
- Stok tersedia untuk dipesan.
- Ambang minimum bila tersedia.

Pengecer hanya perlu menerima jumlah tersedia untuk dipesan dan informasi katalog yang diizinkan; jangan tampilkan data internal stok penuh/kosong jika tidak diperlukan oleh kebijakan akses.

### 5.3 Order

Data tampilan minimum:
- ID internal untuk referensi API (jangan jadikan label utama).
- Nomor order yang dapat dibaca.
- Pengecer pemilik order (untuk tampilan internal).
- Waktu pengajuan.
- Item, kuantitas, harga saat pengajuan, subtotal, total.
- Status.
- Waktu/riwayat perubahan status.
- Alasan penolakan/pembatalan bila ada.

### 5.4 Sale dan payment

Data tampilan minimum:
- Nomor transaksi.
- Waktu transaksi.
- Asal transaksi: dari order atau penjualan langsung.
- Item, jumlah, harga snapshot, total.
- Total pembayaran berhasil.
- Sisa tagihan dan status pembayaran.
- Riwayat payment (nominal, tanggal, metode/catatan bila tersedia).

Jangan menganggap total transaksi sama dengan kas yang diterima.

## 6. Pemetaan error ke UI

Struktur dan kode error aktual harus diverifikasi. Tabel berikut adalah panduan penanganan berdasarkan kategori, bukan klaim bahwa backend pasti memakai status/envelope tertentu.

| Kategori | Perilaku UI |
|---|---|
| Validasi input | Tampilkan pesan dekat field terkait; pertahankan input yang aman |
| Tidak terautentikasi | Minta login kembali atau jalankan mekanisme refresh yang benar-benar disediakan backend |
| Tidak memiliki izin | Tampilkan pesan akses tidak diizinkan; jangan tampilkan data terlarang |
| Resource tidak ditemukan | Tampilkan halaman/detail tidak ditemukan atau data sudah tidak tersedia |
| Konflik stok/status | Beri pesan bahwa data berubah; muat ulang kondisi terkini sebelum aksi berikutnya |
| Duplikasi/idempotensi | Tampilkan hasil operasi yang sudah tercatat bila API mendukung pencarian referensi; jangan submit berulang tanpa verifikasi |
| Server error | Pesan umum, nomor referensi/request ID jika tersedia, dan opsi coba lagi hanya untuk operasi aman |
| Network timeout | Jangan menyatakan operasi tulis gagal atau sukses secara pasti sebelum memeriksa riwayat/status di backend |

## 7. Aturan otorisasi pada frontend

- Setelah autentikasi, tampilkan navigasi berdasarkan role backend.
- Admin dapat mengakses seluruh modul sesuai PRD.
- Karyawan hanya melihat aktivitas operasional yang diizinkan; tidak ada pengelolaan produk, akun, koreksi stok, laporan agregat seluruh usaha, atau audit.
- Pengecer hanya mengakses katalog, keranjang, order, transaksi, tagihan, dan profil miliknya.
- Jangan mengirim `retailer_id` dari browser sebagai bukti kepemilikan. Backend harus mengambil pengecer dari sesi login.
- Route guard hanya meningkatkan UX; backend wajib memeriksa role dan ownership untuk setiap endpoint.

## 8. Format service/frontend client yang direkomendasikan

Adaptasikan dengan repository; ini pedoman arsitektur, bukan instruksi membuat file dengan nama tertentu jika pola serupa sudah tersedia.

```text
src/ atau app/
├── services/
│   ├── api-client (konfigurasi HTTP, base URL, auth, error handling)
│   ├── auth-service
│   ├── product-service
│   ├── inventory-service
│   ├── order-service
│   ├── sales-service
│   ├── payment-service
│   └── report-service
├── composables/ atau stores/ (mengikuti pola proyek)
└── pages/ (halaman per role)
```

Jangan membuat service tiruan yang tidak terhubung ke backend dan jangan membuat satu service generik yang berisi seluruh logika bisnis.

## 9. Checklist verifikasi API sebelum implementasi modul

Untuk setiap endpoint, catat:

- [ ] Path dan HTTP method aktual.
- [ ] Controller/route backend yang menjalankannya.
- [ ] Authentication yang diperlukan.
- [ ] Role yang diizinkan.
- [ ] Request params/query/body lengkap.
- [ ] Contoh response sukses aktual.
- [ ] Contoh error validasi aktual.
- [ ] Error unauthorized/forbidden/not found/conflict yang mungkin.
- [ ] Pagination/filter/sort jika ada.
- [ ] Apakah operasi idempotent atau punya pencegahan duplikasi.
- [ ] Unit/integration test backend terkait.
- [ ] Sudah diuji dari frontend atau API client.

## 10. Catatan yang belum dapat dipastikan dari dokumen saat ini

- Isi aktual `backend-api.md` belum disertakan pada bahan yang tersedia saat penyusunan dokumen ini.
- Endpoint kandidat pada Bagian 4 berasal dari contoh kontrak tingkat tinggi PRD dan belum diverifikasi.
- Mekanisme token/cookie, refresh session, CORS, response envelope, pagination, dan kode error aktual belum diketahui.
- Endpoint detail profil, ubah password, dan status registrasi pending perlu diperiksa pada dokumentasi backend.
- Upload gambar produk tidak termasuk kebutuhan yang telah terkonfirmasi.

**Instruksi untuk agent:** lengkapi kolom Endpoint aktual setelah audit `backend-api.md` dan server. Jangan mengintegrasikan kandidat konseptual sampai tervalidasi.
