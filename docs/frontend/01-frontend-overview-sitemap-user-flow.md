# Frontend Overview, Sitemap, dan User Flow

**Proyek:** Sistem Pemesanan dan Manajemen Pangkalan LPG  
**Versi dokumen:** 1.0  
**Status:** Rancangan frontend berdasarkan PRD V1  
**Platform:** Website responsif, mobile-first, Bahasa Indonesia

> Dokumen ini menerjemahkan kebutuhan PRD menjadi konteks implementasi frontend. Nama route merupakan usulan awal, bukan kontrak backend. Detail endpoint harus diverifikasi pada `backend-api.md`.

## 1. Ringkasan produk

Website digunakan untuk membantu operasional pangkalan LPG resmi dan pemesanan B2B oleh pengecer. Sistem ditujukan untuk mengurangi ketergantungan pada buku tulis dan WhatsApp pribadi dalam pencatatan stok, pesanan, transaksi, serta bon/piutang.

Produk yang dikelola meliputi LPG 3 kg, Bright Gas 5,5 kg, dan Bright Gas 12 kg. Sistem memiliki tiga role: **Admin/Pemilik**, **Karyawan**, dan **Pengecer**.

Frontend bertanggung jawab untuk:
- Menyediakan halaman dan navigasi sesuai role.
- Menampilkan data dan status dari backend.
- Mengumpulkan input pengguna serta memberikan validasi awal.
- Mengirim aksi melalui REST API.
- Menampilkan hasil, kesalahan, dan status proses secara jelas.

Frontend bukan sumber kebenaran untuk saldo stok, reservasi, status pesanan, saldo piutang, atau hak akses. Keputusan final untuk hal-hal tersebut tetap berada di backend.

## 2. Tujuan dan masalah yang didukung

| Masalah operasional | Dukungan antarmuka |
|---|---|
| Stok penuh dan kosong pernah tercampur atau terlambat dicatat | Menampilkan saldo penuh, kosong, dialokasikan, dan tersedia secara terpisah; menyediakan form pasokan, penjualan, dan riwayat stok |
| Pesanan melalui WhatsApp dapat terlambat ditangani | Menyediakan katalog, keranjang, nomor order, antrean pesanan, dan status pesanan |
| Catatan bon/piutang berisiko hilang | Menyediakan catatan transaksi, pembayaran awal/sebagian/pelunasan, dan ringkasan saldo piutang |
| Pemilik kesulitan memantau kegiatan | Menyediakan dashboard dan laporan operasional untuk admin |

## 3. Aktor dan hak akses

### 3.1 Admin/Pemilik

Pengguna dengan kewenangan penuh. Admin dapat:
- Melihat dashboard dan seluruh ringkasan usaha.
- Mengelola akun pengecer dan karyawan.
- Menyetujui atau menolak registrasi pengecer.
- Mengelola produk, harga, dan ambang stok minimum.
- Melihat stok penuh, stok kosong, dan stok dialokasikan.
- Mencatat pasokan dan melihat riwayat pergerakan stok.
- Melakukan koreksi stok dengan alasan.
- Memproses pesanan, penjualan langsung, pembayaran, dan piutang.
- Melihat laporan penjualan, stok, piutang, dan audit.

### 3.2 Karyawan

Pengguna operasional dengan akses terbatas. Karyawan dapat:
- Melihat halaman operasional yang diperlukan.
- Melihat stok penuh/kosong dan riwayat stok (baca-saja).
- Mencatat penerimaan pasokan.
- Melihat, mengonfirmasi, menolak, membatalkan, dan menyelesaikan pesanan sesuai aturan.
- Mencatat penjualan langsung.
- Mencatat bon dan pembayaran sebagian/pelunasan.

Karyawan **tidak** dapat:
- Mengelola produk atau harga.
- Mengelola akun pengecer atau karyawan.
- Melakukan koreksi stok atau mengatur stok minimum.
- Melihat dashboard/laporan agregat seluruh usaha atau audit.

Karyawan hanya boleh melihat informasi transaksi/piutang yang diperlukan untuk pekerjaan dan diizinkan backend. Jangan tampilkan daftar atau agregat seluruh piutang pengecer kepada karyawan tanpa izin API yang jelas.

### 3.3 Pengecer

Pengecer dapat:
- Mendaftar akun dan menunggu persetujuan admin.
- Login setelah akun aktif.
- Melihat katalog, harga, dan stok tersedia untuk dipesan.
- Membuat keranjang dan mengajukan pesanan.
- Melihat status dan riwayat pesanan sendiri.
- Melihat transaksi, pembayaran, dan tagihan miliknya sendiri.
- Mengelola data profil minimum dan kata sandi sendiri.

Pengecer tidak dapat melihat data pengecer lain, mengonfirmasi order, mengubah stok, atau mencatat transaksi internal pangkalan.

### 3.4 Pembeli langsung

Pembeli langsung bukan pengguna akun pada V1. Transaksi mereka dicatat admin/karyawan melalui halaman Penjualan Langsung. Website tidak mengumpulkan NIK/KTP; proses resmi LPG 3 kg tetap dilakukan pada MAP di luar website.

## 4. Prinsip pengalaman pengguna

1. **Mobile-first:** semua alur inti dapat diselesaikan pada ponsel Android.
2. **Bahasa sederhana:** gunakan istilah seperti Stok Penuh, Stok Kosong, Tersedia, Menunggu Konfirmasi, Bon, Dibayar Sebagian, dan Lunas.
3. **Navigasi berbasis role:** hanya tampilkan menu yang relevan bagi role pengguna; backend tetap wajib memeriksa otorisasi.
4. **Tindakan kritis perlu konfirmasi:** konfirmasi/tolak order, penyelesaian pesanan, koreksi stok, dan pembayaran.
5. **Angka tidak ambigu:** jumlah disertai satuan tabung; nominal uang menggunakan format Rupiah.
6. **Keterlacakan:** detail transaksi menampilkan nomor referensi, status, waktu, dan riwayat yang diizinkan.
7. **Jaringan tidak stabil:** jangan menampilkan status sukses sebelum ada konfirmasi backend.

## 5. Ruang lingkup frontend V1

### Termasuk
- Login dan logout.
- Registrasi pengecer dan status menunggu persetujuan.
- Pengelolaan akun pengecer/karyawan oleh admin.
- Katalog, produk, harga, dan stok tersedia.
- Manajemen stok penuh/kosong, pasokan, koreksi, stok minimum, serta riwayat.
- Keranjang dan pemesanan pengecer.
- Antrean, konfirmasi, penolakan, pembatalan, dan penyelesaian pesanan.
- Penjualan langsung.
- Pembayaran tunai, bon, pembayaran awal, sebagian, dan pelunasan.
- Ringkasan transaksi/tagihan pengecer.
- Dashboard, laporan penjualan/stok/piutang, dan audit untuk admin.
- Profil dan ubah kata sandi.

### Tidak termasuk V1
- Integrasi API MAP atau sistem pemerintah.
- Pengumpulan atau penyimpanan NIK/KTP.
- WhatsApp API atau notifikasi otomatis WhatsApp.
- Payment gateway.
- Sensor/IoT penghitung tabung.
- Marketplace multi-penjual, promosi/kupon/poin, rekomendasi produk.
- Mode offline penuh dan sinkronisasi setelah offline.
- Aplikasi native Android/iOS.
- Fitur tambahan kategori COULD pada PRD.

## 6. Sitemap dan usulan route

Route di bawah merupakan usulan untuk frontend. Sesuaikan dengan router aktual proyek dan jangan menganggap route frontend sebagai endpoint API.

### 6.1 Publik dan autentikasi

```text
/
├── /login
└── /register
    └── setelah registrasi: halaman/pesan status menunggu persetujuan
```

Jika root `/` diakses:
- Pengguna belum login diarahkan ke `/login`.
- Pengguna login diarahkan ke landing page berdasarkan role.

### 6.2 Admin

```text
/admin
├── /dashboard
├── /users
│   ├── /retailers
│   ├── /retailers/pending
│   └── /employees
├── /products
│   ├── /new
│   └── /:productId/edit
├── /inventory
│   ├── /receipts/new
│   ├── /movements
│   └── /adjustments/new
├── /orders
│   └── /:orderId
├── /sales
│   ├── /direct/new
│   └── /:saleId
├── /receivables
│   └── /:receivableId
├── /reports
│   ├── /sales
│   ├── /inventory
│   └── /receivables
├── /audit-logs
└── /profile
```

### 6.3 Karyawan

Karyawan dapat memakai layout internal yang sama dengan admin, tetapi menu dan route dibatasi:

```text
/staff
├── /dashboard
├── /inventory
│   ├── /receipts/new
│   └── /movements
├── /orders
│   └── /:orderId
├── /sales
│   ├── /direct/new
│   └── /:saleId
├── /payments
│   └── /:receivableId
└── /profile
```

Route ini hanya boleh diaktifkan setelah dicocokkan dengan izin aktual backend. Karyawan tidak diberi route pengelolaan produk, akun, koreksi stok, laporan agregat, atau audit.

### 6.4 Pengecer

```text
/retailer
├── /catalog
├── /cart
├── /orders
│   └── /:orderId
├── /transactions
│   └── /:transactionId
├── /receivables
│   └── /:receivableId
└── /profile
```

Katalog dapat menjadi landing page pengecer setelah login. Keranjang dapat menggunakan state sementara di frontend bila sesuai arsitektur yang tersedia; pesanan baru tercatat di backend setelah pengajuan berhasil.

## 7. Navigasi

### 7.1 Layout internal Admin/Karyawan

- Header: nama halaman, identitas pengguna, kontrol profil/logout.
- Sidebar desktop: menu sesuai role.
- Mobile: sidebar berubah menjadi drawer/menu yang mudah dibuka dan ditutup.
- Area konten: judul halaman, deskripsi singkat bila dibutuhkan, breadcrumb seperlunya, konten utama.
- Aksi utama ditempatkan konsisten pada bagian header halaman atau area yang mudah dijangkau.

### 7.2 Layout Pengecer

- Header dengan nama usaha/sistem, akses profil, dan keranjang.
- Navigasi katalog, pesanan, transaksi/tagihan, dan profil.
- Pada ponsel, gunakan navigasi ringkas yang mudah dijangkau; jangan memadatkan terlalu banyak menu.
- Katalog menonjolkan harga dan stok tersedia.

## 8. User flow utama

### Flow 1 — Login dan pengalihan role

```text
Pengguna membuka website
        |
        v
     Halaman Login
        |
        v
  Isi username/password
        |
        v
  Frontend kirim ke API
        |
        +---- kredensial tidak valid ----> tampilkan error
        |
        v
 Backend mengembalikan sesi + role
        |
        +---- admin ------> Dashboard Admin
        +---- karyawan ---> Dashboard Karyawan
        +---- pengecer ---> Katalog Pengecer
```

Frontend tidak boleh menentukan role dari input pengguna atau nilai lokal yang tidak diverifikasi backend.

### Flow 2 — Registrasi pengecer

```text
Pengecer membuka Daftar
        |
        v
Isi nama penanggung jawab, nama usaha,
kontak, username, password, konfirmasi password
        |
        v
Validasi frontend
        |
        v
Kirim registrasi ke backend
        |
        +---- gagal ----> tampilkan pesan per field
        |
        v
Berhasil dibuat dengan status MENUNGGU PERSETUJUAN
        |
        v
Tampilkan pesan menunggu persetujuan
        |
        v
Admin meninjau pada panel akun pending
        |
        +---- ditolak ----> status ditolak + alasan
        |
        +---- disetujui --> akun aktif, pengecer dapat login/memesan
```

Registrasi tidak meminta NIK/KTP. Jangan mengarahkan akun pending ke katalog/pemesanan.

### Flow 3 — Pengecer mengajukan pesanan

```text
Pengecer login dan akun aktif
        |
        v
Buka katalog
        |
        v
Lihat produk, harga, stok tersedia
(stok penuh fisik - dialokasikan)
        |
        v
Pilih produk dan jumlah
        |
        v
Periksa keranjang dan total
        |
        v
Ajukan pesanan
        |
        +---- stok/validasi gagal ----> tampilkan error, jangan buat order parsial
        |
        v
Backend membuat nomor order
status MENUNGGU_KONFIRMASI
        |
        v
Tampilkan nomor dan status pesanan
```

Pengajuan order tidak mengurangi stok fisik dan tidak mengalokasikan stok.

### Flow 4 — Admin/Karyawan memproses pesanan

```text
Petugas buka Pesanan Masuk
        |
        v
Pilih order MENUNGGU_KONFIRMASI
        |
        v
Periksa item dan stok tersedia terkini
        |
        +---- Tolak --> isi alasan --> konfirmasi --> status DITOLAK
        |
        +---- Konfirmasi --> tampilkan ringkasan --> konfirmasi aksi
                                  |
                                  v
                       backend validasi ulang stok
                                  |
                         +--------+-------+
                         |                |
                      gagal             berhasil
                         |                |
                  tampilkan konflik   status DIKONFIRMASI
                                      stok dialokasikan
```

Karyawan boleh melakukan konfirmasi/penolakan, tetapi tidak mengelola produk atau mengoreksi stok.

### Flow 5 — Serah-terima pesanan dan pembentukan penjualan

```text
Petugas buka order DIKONFIRMASI
        |
        v
Pastikan barang benar-benar diserahkan
        |
        v
Input tabung kosong yang benar-benar diterima
        |
        v
Pilih pembayaran: Tunai atau Bon
        |
        v
Jika Bon: masukkan pembayaran awal (boleh Rp0)
        |
        v
Tampilkan ringkasan barang, pembayaran,
dan sisa tagihan
        |
        v
Petugas konfirmasi penyelesaian
        |
        v
Backend menyelesaikan dalam satu proses atomik:
- kurangi stok penuh fisik
- lepaskan alokasi
- tambah stok kosong aktual
- bentuk satu penjualan
- catat pembayaran/piutang
- ubah order menjadi SELESAI
        |
        v
Tampilkan nomor transaksi dan status terbaru
```

Jangan membuat tombol penyelesaian yang dapat membentuk penjualan lebih dari satu kali. Jumlah kosong yang diterima adalah input aktual, bukan asumsi otomatis.

### Flow 6 — Penjualan langsung

```text
Admin/Karyawan buka Penjualan Langsung
        |
        v
Pilih produk dan kuantitas
        |
        v
Input jumlah tabung kosong yang diterima
        |
        v
Tampilkan total transaksi
        |
        v
Konfirmasi pembayaran tunai
        |
        v
Kirim ke backend
        |
        v
Tampilkan nomor transaksi jika berhasil
```

Tidak perlu membuat akun pembeli langsung atau meminta NIK/KTP pada website.

### Flow 7 — Pembayaran bon

```text
Petugas buka pencarian/tagihan yang diizinkan
        |
        v
Pilih tagihan
        |
        v
Tampilkan total transaksi, total dibayar,
dan sisa sebelum pembayaran
        |
        v
Masukkan nominal pembayaran baru
        |
        v
Validasi nominal > 0 dan <= sisa tagihan
        |
        v
Tampilkan saldo sesudah pembayaran
        |
        v
Konfirmasi dan kirim ke backend
        |
        +---- gagal ----> tampilkan error tanpa menganggap pembayaran sukses
        |
        v
Berhasil: perbarui riwayat dan status
(DIBAYAR SEBAGIAN / LUNAS)
```

### Flow 8 — Admin memantau laporan

```text
Admin membuka Dashboard/Laporan
        |
        v
Pilih periode/filter bila tersedia
        |
        v
Frontend meminta data ke API
        |
        +---- loading ----> indikator loading
        +---- error ------> pesan error + coba lagi
        +---- kosong -----> empty state informatif
        |
        v
Tampilkan ringkasan dan data rinci
        |
        v
Admin meninjau penjualan, stok, atau piutang
```

Kartu penjualan harus dibedakan dari uang tunai yang sudah diterima. Penjualan bukan selalu kas masuk karena transaksi bon dapat belum lunas.

## 9. Ketentuan data dan istilah

| Istilah UI | Definisi yang harus digunakan |
|---|---|
| Stok Penuh | Jumlah tabung berisi yang secara fisik tersedia di pangkalan |
| Stok Kosong | Jumlah tabung kosong di pangkalan |
| Dialokasikan | Jumlah stok penuh yang dijanjikan untuk pesanan terkonfirmasi tetapi belum diserahterimakan |
| Tersedia | Stok penuh fisik dikurangi stok dialokasikan; minimum 0 |
| Pesanan | Permintaan pembelian pengecer; belum otomatis menjadi penjualan |
| Penjualan | Transaksi ketika barang benar-benar diserahkan |
| Bon/Piutang | Sisa transaksi yang belum dibayar seluruhnya |
| Dibayar Sebagian | Sudah ada pembayaran, tetapi sisa tagihan masih lebih dari nol |
| Lunas | Sisa tagihan nol |

## 10. Arsitektur integrasi tingkat tinggi

```text
Browser ponsel/desktop
        |
        v
Frontend Vue.js
        |
        | HTTPS + REST/JSON
        v
Backend Node.js + Express.js
        |
        | akses database server-side
        v
PostgreSQL melalui Supabase
```

MAP resmi dan WhatsApp pribadi berada di luar integrasi V1. Frontend tidak boleh mengakses database secara langsung atau menyimpan secret backend.

## 11. Asumsi dan hal yang harus diverifikasi

- Versi Vue, bundler, router, state management, dan CSS framework mengikuti repository aktual.
- Nama route di dokumen ini adalah usulan dan boleh disesuaikan dengan kondisi kode.
- Bentuk request/response, autentikasi, refresh token/cookie, pagination, filter, dan error API harus diverifikasi melalui `backend-api.md` serta kode server.
- Proses lupa kata sandi V1 diasumsikan melalui bantuan admin, bukan email/SMS otomatis.
- Pengecer tidak membatalkan order sendiri pada rancangan V1; petugas membatalkan dengan alasan setelah menerima permintaan pengecer.
- Tidak ada serah-terima sebagian pada rancangan V1.
- Detail batas data piutang yang dapat dilihat karyawan harus mengikuti keputusan PRD dan izin backend.
- Tidak ada data operasional awal yang boleh dianggap nyata sebelum dikonfirmasi mitra.
