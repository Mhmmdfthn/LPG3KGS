# Page Specifications — Sistem Pemesanan dan Manajemen Pangkalan LPG

**Versi:** 1.0  
**Status:** Spesifikasi UI berdasarkan PRD V1; beberapa detail visual merupakan keputusan rancangan frontend.  
**Catatan:** Route adalah usulan frontend. Endpoint dan field API harus dicocokkan dengan `backend-api.md` dan implementasi backend.

## 1. Aturan umum seluruh halaman

### 1.1 Page shell

**Shell Admin/Karyawan**
- Header berisi judul halaman, identitas pengguna, dan menu profil/logout.
- Sidebar desktop berisi navigasi sesuai role.
- Pada ponsel, sidebar berubah menjadi drawer/menu ringkas.
- Area konten menampilkan judul, deskripsi seperlunya, aksi utama, dan konten halaman.

**Shell Pengecer**
- Header berisi identitas sistem/halaman, akses profil, dan keranjang bila relevan.
- Navigasi menyediakan katalog, pesanan, transaksi/tagihan, dan profil.
- Pada ponsel, gunakan navigasi ringkas yang mudah dijangkau.

### 1.2 Kondisi UI standar

Setiap halaman yang mengambil data dari API harus menangani:
- **Loading:** tampilkan skeleton/spinner atau indikator yang sesuai; jangan tampilkan angka lama seolah data terbaru.
- **Success:** tampilkan data dari respons backend.
- **Empty:** jelaskan bahwa belum ada data dan berikan aksi berikutnya jika tersedia.
- **Error:** jelaskan kegagalan dan sediakan coba lagi bila aman.
- **Unauthorized/forbidden:** tampilkan pesan akses tidak diizinkan atau arahkan ke halaman yang sesuai; jangan hanya menyembunyikan error.
- **Submitting:** nonaktifkan tombol submit yang sama untuk mengurangi klik ganda.
- **Validation:** tampilkan kesalahan dekat field terkait.

### 1.3 Format data

- Uang: `Rp` dengan pemisah ribuan, contoh `Rp150.000`.
- Kuantitas tabung: bilangan bulat dan selalu disertai nama produk/ukuran serta satuan `tabung`.
- Tanggal/waktu: tampilkan secara konsisten dalam zona waktu operasional `Asia/Jakarta`, setelah mencocokkan format timestamp dari API.
- Status: tampilkan label manusiawi, jangan menampilkan enum database mentah tanpa pemetaan.
- Jangan menampilkan `null`, `undefined`, atau ID internal sebagai informasi utama pengguna.

### 1.4 Konfirmasi aksi berdampak

Wajib meminta konfirmasi dengan ringkasan untuk:
- Menyetujui atau menolak order.
- Membatalkan order.
- Menyelesaikan serah-terima.
- Melakukan koreksi stok.
- Menyimpan penjualan langsung.
- Mencatat pembayaran bon.
- Menonaktifkan akun atau produk.

## 2. Daftar halaman V1

| ID | Halaman | Role | Route usulan | Prioritas |
|---|---|---|---|---|
| PG-01 | Login | Publik | `/login` | Inti |
| PG-02 | Registrasi Pengecer | Publik | `/register` | Inti |
| PG-03 | Status Menunggu Persetujuan | Pengecer pending | `/registration-pending` atau state registrasi | Inti |
| PG-04 | Dashboard Admin | Admin | `/admin/dashboard` | V1 |
| PG-05 | Dashboard Karyawan | Karyawan | `/staff/dashboard` | Operasional |
| PG-06 | Manajemen Pengguna | Admin | `/admin/users` | Inti |
| PG-07 | Persetujuan Pengecer | Admin | `/admin/users/retailers/pending` | Inti |
| PG-08 | Manajemen Produk | Admin | `/admin/products` | Inti |
| PG-09 | Detail/Form Produk | Admin | `/admin/products/new`, `/:id/edit` | Inti |
| PG-10 | Ringkasan Stok | Admin/Karyawan | `/inventory` | Inti |
| PG-11 | Penerimaan Pasokan | Admin/Karyawan | `/inventory/receipts/new` | Inti |
| PG-12 | Riwayat Pergerakan Stok | Admin/Karyawan | `/inventory/movements` | V1 |
| PG-13 | Koreksi Stok | Admin | `/inventory/adjustments/new` | V1 |
| PG-14 | Pesanan Masuk | Admin/Karyawan | `/orders` | Inti |
| PG-15 | Detail Pesanan | Admin/Karyawan | `/orders/:orderId` | Inti |
| PG-16 | Penjualan Langsung | Admin/Karyawan | `/sales/direct/new` | Inti |
| PG-17 | Pembayaran Bon | Admin/Karyawan sesuai izin | `/payments`, `/receivables/:id` | Inti |
| PG-18 | Laporan Penjualan | Admin | `/reports/sales` | V1 |
| PG-19 | Laporan Stok | Admin | `/reports/inventory` | V1 |
| PG-20 | Laporan Piutang | Admin | `/reports/receivables` | Inti |
| PG-21 | Riwayat Audit | Admin | `/audit-logs` | V1 |
| PG-22 | Katalog Pengecer | Pengecer aktif | `/retailer/catalog` | Inti |
| PG-23 | Keranjang/Ringkasan Pesanan | Pengecer aktif | `/retailer/cart` | Inti |
| PG-24 | Pesanan Saya | Pengecer aktif | `/retailer/orders` | Inti |
| PG-25 | Detail Pesanan Saya | Pengecer aktif | `/retailer/orders/:orderId` | Inti |
| PG-26 | Transaksi Saya | Pengecer aktif | `/retailer/transactions` | V1 |
| PG-27 | Tagihan Saya | Pengecer aktif | `/retailer/receivables` | V1 |
| PG-28 | Profil dan Ubah Kata Sandi | Semua role login | `/profile` | Inti |

> Admin dan karyawan dapat memakai komponen halaman operasional yang sama bila sesuai, tetapi menu dan aksi harus mengikuti izin role. Jangan memberi karyawan akses ke halaman admin hanya karena memakai komponen yang sama.

## 3. Spesifikasi halaman publik

### PG-01 — Login

**Tujuan:** mengautentikasi admin, karyawan, dan pengecer.

**Komponen dan layout:**
- Panel/form login dengan nama sistem.
- Field username/email (ikuti kontrak backend) dan password.
- Tombol tampil/sembunyikan password.
- Tombol Masuk.
- Link Daftar sebagai Pengecer.
- Pesan error autentikasi yang tidak membocorkan apakah username terdaftar.

**Interaksi:**
1. Pengguna mengisi kredensial.
2. Validasi field wajib di frontend.
3. Submit ke API autentikasi.
4. Setelah sukses, baca role dari hasil autentikasi yang tervalidasi dan arahkan ke dashboard role terkait.
5. Jika akun nonaktif/pending, tampilkan pesan yang sesuai respons backend.

**UI states:** idle, submitting, invalid credentials, network/server error, account pending/inactive, success.

**Validasi:** jangan menyimpan password; jangan hardcode akun demo; jangan menebak nama field API.

### PG-02 — Registrasi Pengecer

**Tujuan:** menerima pendaftaran mandiri pengecer.

**Field minimum dari PRD:**
- Nama penanggung jawab.
- Nama usaha/pengecer.
- Nomor kontak.
- Username unik.
- Password.
- Konfirmasi password.

**Larangan:** tidak meminta NIK, nomor KTP, foto KTP, atau data identitas yang dikhususkan untuk MAP.

**Interaksi:**
- Validasi field wajib dan kesesuaian password.
- Submit ke backend.
- Jika berhasil, tampilkan status bahwa akun menunggu persetujuan admin.
- Jangan memberikan akses ke katalog/pemesanan sebelum backend menyatakan akun aktif.

**UI states:** idle, invalid fields, username/contact conflict (berdasarkan error API), submitting, success pending, network/server error.

### PG-03 — Status Menunggu Persetujuan

**Tujuan:** menjelaskan bahwa pendaftaran diterima tetapi belum disetujui.

**Konten:** pesan `Pendaftaran diterima. Tunggu persetujuan admin sebelum memesan.`, informasi ringkas akun/usaha bila aman, tombol kembali ke login.

Jangan menampilkan tombol untuk mengajukan pesanan. Jika backend menyediakan endpoint status registrasi, tampilkan status terkini dari API. Jangan mengasumsikan notifikasi WhatsApp/email tersedia.

## 4. Spesifikasi halaman Admin

### PG-04 — Dashboard Admin

**Tujuan:** memberi ringkasan cepat kondisi operasional pangkalan.

**Kartu ringkasan wajib:**
1. Stok tersedia untuk dipesan.
2. Pesanan menunggu konfirmasi.
3. Penjualan hari ini.
4. Total piutang.

**Bagian tambahan:**
- Peringatan produk di bawah stok minimum.
- Daftar pesanan terbaru atau pesanan yang membutuhkan tindakan.
- Tautan cepat ke stok, pesanan, penjualan, piutang, dan laporan.

**Perilaku:**
- Semua angka berasal dari API dashboard atau endpoint yang sesuai.
- Penjualan hari ini harus dibedakan dari uang yang sudah diterima karena penjualan bon belum tentu lunas.
- Klik kartu/tautan mengarah ke halaman terkait.

**Empty/error:** jika belum ada transaksi, tampilkan nilai 0 dan pesan informatif. Jika API gagal, jangan menampilkan data dummy seolah data aktual.

### PG-05 — Dashboard Karyawan

**Tujuan:** memberi akses cepat ke tugas operasional harian.

**Konten yang disarankan:**
- Ringkasan pesanan yang menunggu tindakan, bila API mengizinkan.
- Ringkasan stok operasional, bila tersedia.
- Aksi cepat: Catat Pasokan, Pesanan Masuk, Penjualan Langsung, Pembayaran Bon.

Jangan tampilkan laporan agregat seluruh usaha, audit, manajemen akun, atau koreksi stok. Angka dashboard harus sesuai cakupan izin karyawan yang diberikan backend.

### PG-06 — Manajemen Pengguna

**Role:** Admin.

**Konten:** tab/segmen Pengecer dan Karyawan; daftar nama, nama usaha bila pengecer, kontak, role, status, tanggal dibuat; pencarian dan filter status bila API mendukung.

**Aksi:** tambah akun pengecer, tambah akun karyawan, buka detail/edit data minimum, aktifkan/nonaktifkan, buka daftar menunggu persetujuan.

**Aturan:**
- Admin dapat membuat akun pengecer langsung aktif sesuai PRD.
- Admin dapat membuat/nonaktifkan akun karyawan dan mengelola aksesnya.
- Riwayat order dan transaksi tetap tersimpan meskipun akun dinonaktifkan.
- Jangan tampilkan password/hash password.

### PG-07 — Persetujuan Pengecer

**Role:** Admin.

**Daftar:** nama penanggung jawab, nama usaha, kontak, username (jika aman/berguna), waktu pendaftaran, status Menunggu Persetujuan.

**Detail:** data minimum yang diperlukan untuk meninjau akun.

**Aksi Setujui:** tampilkan ringkasan, minta konfirmasi, kirim ke API, lalu tampilkan status aktif jika berhasil.

**Aksi Tolak:** alasan penolakan wajib diisi; tampilkan konfirmasi; setelah sukses, tampilkan status ditolak.

**States:** tidak ada pendaftaran, loading, error, data tersedia, aksi sedang diproses.

### PG-08 — Manajemen Produk

**Role:** Admin.

**Daftar kolom:** nama produk, ukuran/jenis, harga, status aktif, stok tersedia (jika endpoint menyediakan), stok minimum.

**Aksi:** tambah produk, edit produk/harga, aktif/nonaktif.

**Aturan:**
- Hanya admin dapat mengubah produk dan harga.
- Produk nonaktif tidak dapat dipilih untuk order baru.
- Harga historis transaksi tidak berubah ketika harga katalog diubah.
- Jangan menghapus secara permanen produk yang memiliki catatan historis; gunakan status nonaktif sesuai kemampuan API.

### PG-09 — Form Produk

**Field:** nama produk, ukuran/jenis, harga Rupiah, status aktif; ambang stok minimum dapat diatur di sini bila sesuai API atau pada halaman stok.

**Validasi UI:** field wajib, harga tidak negatif, angka uang valid. Validasi akhir dilakukan backend.

**Aksi:** simpan/batal. Saat edit, tampilkan nilai saat ini. Konfirmasi sebelum menonaktifkan produk.

### PG-10 — Ringkasan Stok

**Role:** Admin/Karyawan; koreksi hanya admin.

**Tampilkan per produk:**
- Stok penuh fisik.
- Stok kosong fisik.
- Stok dialokasikan/reserved.
- Stok penuh tersedia untuk dipesan (`penuh - dialokasikan`).
- Ambang stok minimum dan indikator peringatan jika data tersedia.

**Aksi:** Catat Pasokan, Riwayat Stok. Admin juga mendapat aksi Koreksi Stok dan pengaturan ambang minimum.

**Aturan:** jangan menjumlahkan penuh dan kosong. Jangan menghitung angka tersedia sebagai `full + empty`. Karyawan hanya membaca saldo.

### PG-11 — Penerimaan Pasokan

**Role:** Admin/Karyawan.

**Field per penerimaan:** tanggal/waktu (default saat ini bila sesuai API), produk, jumlah tabung penuh diterima, jumlah tabung kosong yang dikirim kembali ke agen, catatan opsional.

**Interaksi:** pilih produk, isi jumlah, lihat ringkasan perubahan, konfirmasi simpan.

**Aturan:** jumlah harus bilangan bulat tidak negatif; validasi akhir mengikuti backend. Contoh konseptual: penuh bertambah dan kosong berkurang sesuai jumlah yang dicatat. Jangan menganggap jumlah kosong yang dikirim boleh melebihi stok kosong tersedia.

### PG-12 — Riwayat Pergerakan Stok

**Role:** Admin/Karyawan (baca-saja).

**Daftar:** waktu, produk, jenis pergerakan/sumber, perubahan penuh, perubahan kosong, pelaku, referensi transaksi.

**Filter:** produk, tanggal/periode, jenis pergerakan; hanya tampilkan filter yang didukung API.

**Interaksi:** klik baris untuk melihat detail sumber bila endpoint mendukung. Jangan sediakan edit/hapus riwayat stok.

### PG-13 — Koreksi Stok

**Role:** Admin saja.

**Field:** produk, jenis saldo yang dikoreksi (penuh/kosong), jumlah selisih atau jumlah akhir sesuai kontrak API, alasan wajib.

**Perilaku:** tampilkan saldo sebelum, perubahan, dan perkiraan saldo sesudah bila data tersedia. Minta konfirmasi sebelum menyimpan.

**Aturan:** tidak boleh membuat saldo negatif atau alokasi melebihi stok penuh. Simpan alasan dan pelaku melalui backend. Karyawan tidak boleh melihat aksi koreksi.

### PG-14 — Pesanan Masuk

**Role:** Admin/Karyawan.

**Daftar:** nomor order, pengecer, tanggal, total/item ringkas, status, aksi/detail.

**Filter:** status, tanggal, pengecer, nomor order sesuai API.

**Prioritas visual:** pesanan `MENUNGGU_KONFIRMASI` harus mudah ditemukan. Status lain tetap dapat dicari.

**Aksi:** buka detail. Jangan konfirmasi/tolak langsung tanpa melihat rincian order.

### PG-15 — Detail Pesanan

**Role:** Admin/Karyawan.

**Konten:** nomor order, nama usaha/pengecer, tanggal pengajuan, item, kuantitas, harga snapshot, subtotal/total, status, riwayat status, alasan penolakan/pembatalan jika ada.

**Aksi bergantung status:**
- `MENUNGGU_KONFIRMASI`: Konfirmasi atau Tolak.
- `DIKONFIRMASI`: Batalkan atau Selesaikan.
- `DITOLAK`, `DIBATALKAN`, `SELESAI`: tampilkan detail baca-saja sesuai aturan transisi.

**Konfirmasi order:** tampilkan stok terkini dan ringkasan alokasi yang akan terjadi. Backend harus memeriksa ulang stok. Jika terjadi konflik, tampilkan pesan stok berubah dan muat ulang data.

**Tolak/batal:** alasan wajib diisi.

**Selesaikan:**
- Input jumlah tabung kosong yang benar-benar diterima.
- Pilih pembayaran Tunai atau Bon.
- Jika Bon, input pembayaran awal dari Rp0 sampai total transaksi.
- Tampilkan nilai transaksi, dibayar, dan sisa tagihan sebelum simpan.
- Konfirmasi ringkasan.
- Setelah sukses tampilkan nomor transaksi/sale dan status.

**Aturan keras:** satu order hanya dapat menghasilkan maksimal satu penjualan. Jangan menganggap order selesai hanya karena tombol telah diklik; tunggu respons backend.

### PG-16 — Penjualan Langsung

**Role:** Admin/Karyawan.

**Field:** produk, jumlah tabung penuh keluar, jumlah tabung kosong aktual yang diterima, harga/total dari data produk/API, pembayaran tunai.

**Perilaku:**
- Tidak meminta akun pembeli langsung.
- Tidak meminta NIK/KTP.
- Tampilkan total sebelum simpan.
- Konfirmasi tindakan.
- Setelah sukses tampilkan nomor transaksi.

**Validasi:** jumlah positif bilangan bulat; kuantitas tidak melebihi stok tersedia; jumlah kosong adalah input aktual. Validasi final berada di backend.

### PG-17 — Pembayaran Bon

**Role:** Admin/Karyawan sesuai cakupan izin backend.

**Konten pencarian/list:** nomor transaksi/tagihan, pengecer, tanggal, saldo, status; batasi hasil sesuai role.

**Detail tagihan:** nilai awal/total transaksi, total pembayaran tercatat, saldo sebelum, riwayat pembayaran, status.

**Form pembayaran:** nominal baru (positif), metode/catatan jika didukung API, tanggal bila dapat dipilih, ringkasan saldo sesudah.

**Validasi UI:** nominal lebih dari 0 dan tidak melebihi sisa tagihan terkini. Backend tetap memvalidasi ulang.

**Aksi:** konfirmasi simpan. Jangan menganggap pembayaran tercatat bila respons server belum diterima. Setelah sukses tampilkan nomor/referensi pembayaran dan status `DIBAYAR_SEBAGIAN` atau `LUNAS` sesuai API.

### PG-18 — Laporan Penjualan

**Role:** Admin.

**Konten:** total penjualan sesuai periode; rincian transaksi; pengelompokan produk/jenis transaksi jika didukung.

**Filter:** periode tanggal, produk, dan jenis transaksi sesuai dukungan API.

**Catatan:** penjualan tidak sama dengan kas yang diterima. Jangan memberi label penjualan sebagai pendapatan tunai bila data mengandung bon.

### PG-19 — Laporan Stok

**Role:** Admin.

**Konten:** saldo penuh/kosong, dialokasikan, tersedia, pergerakan masuk/keluar/koreksi per periode.

**Filter:** periode, produk, jenis pergerakan bila API mendukung.

**Tujuan:** membantu admin menelusuri perubahan stok. Angka harus berasal dari backend dan konsisten dengan riwayat transaksi.

### PG-20 — Laporan Piutang

**Role:** Admin.

**Konten:** daftar pengecer/tagihan, total transaksi kredit, total pembayaran, sisa saldo, status; detail per transaksi.

**Filter:** pengecer, status pembayaran, periode, nomor transaksi sesuai API.

**Aturan:** nilai sisa berasal dari backend. Jangan menghapus histori pembayaran atau menampilkan angka agregat yang dihitung dari data parsial tanpa label.

### PG-21 — Riwayat Audit

**Role:** Admin.

**Konten:** waktu, pelaku, jenis tindakan, entitas/nomor referensi, ringkasan perubahan.

**Filter:** tanggal, pelaku, tindakan, objek bila tersedia.

**Perilaku:** halaman baca-saja. Jangan menyediakan edit/hapus. Jangan menampilkan secret, password, token, atau NIK/KTP.

## 5. Spesifikasi halaman Pengecer

### PG-22 — Katalog Pengecer

**Role:** Pengecer aktif.

**Komponen kartu/list produk:** nama, ukuran, harga, stok tersedia untuk dipesan, kontrol jumlah, tombol Tambah.

**Perilaku:**
- Hanya tampilkan produk aktif.
- Tampilkan `Tersedia: N tabung` dari nilai backend (`stok_penuh - dialokasikan`).
- Produk dengan stok tersedia 0 tidak dapat ditambahkan dalam jumlah positif.
- Kontrol jumlah hanya menerima integer positif.
- Tampilkan indikator keranjang.
- Jangan tampilkan stok kosong sebagai jumlah produk yang bisa dibeli.

**States:** loading, katalog kosong, stok habis, error API, produk tersedia.

### PG-23 — Keranjang dan Ringkasan Pesanan

**Role:** Pengecer aktif.

**Konten:** produk, ukuran, harga snapshot saat katalog dimuat/validasi server, kuantitas, subtotal, total.

**Interaksi:** ubah kuantitas, hapus item, kembali ke katalog, Ajukan Pesanan.

**Validasi:** keranjang tidak kosong; kuantitas positif integer; tampilkan perubahan/kegagalan stok dari backend. Backend adalah otoritas harga dan stok.

**Setelah berhasil:** tampilkan nomor order dan status `MENUNGGU_KONFIRMASI`. Jangan menampilkan pesan pembayaran berhasil atau menjanjikan stok telah dialokasikan.

### PG-24 — Pesanan Saya

**Role:** Pengecer aktif.

**Daftar:** nomor order, tanggal, jumlah item, total, status terakhir.

**Filter:** status/periode bila API mendukung.

**Interaksi:** klik untuk detail. Kosongkan state dengan pesan bahwa belum ada pesanan.

### PG-25 — Detail Pesanan Saya

**Role:** Pengecer aktif.

**Konten:** nomor order, tanggal, produk/item, jumlah, total, status, riwayat status, alasan penolakan atau pembatalan bila tersedia.

**Aturan:** pengecer hanya melihat order miliknya. Jangan tampilkan tombol konfirmasi, penolakan, penyelesaian, atau pembatalan mandiri pada rancangan V1. Jika order perlu dibatalkan, pengecer menghubungi pangkalan dan petugas memproses pembatalan.

### PG-26 — Transaksi Saya

**Role:** Pengecer aktif.

**Daftar:** nomor transaksi, tanggal, total, total dibayar, sisa, status.

**Detail:** item, jumlah, harga snapshot, pembayaran tercatat, saldo akhir.

**Aturan:** hanya data pengecer yang login. Jangan memberi kemampuan mengubah atau menghapus transaksi.

### PG-27 — Tagihan Saya

**Role:** Pengecer aktif.

**Konten:** daftar tagihan/bon milik pengecer, total transaksi, pembayaran yang tercatat, sisa tagihan, status.

**Detail:** riwayat pembayaran dan tanggalnya.

**Aturan:** informasi read-only. Pengecer tidak mencatat pembayaran sendiri di V1; pencatatan dilakukan admin/karyawan. Jangan menampilkan tagihan pengecer lain.

## 6. Profil dan akun

### PG-28 — Profil dan Ubah Kata Sandi

**Role:** semua pengguna login.

**Konten:** nama/identitas yang aman, nama usaha untuk pengecer, kontak, username jika dapat diubah atau hanya dibaca, role/status bila perlu, form ubah kata sandi.

**Aksi:** simpan perubahan profil hanya untuk field yang diizinkan backend; ubah kata sandi dengan field saat ini/baru/konfirmasi sesuai kontrak API; logout.

**Aturan:** jangan pernah menampilkan password lama atau hash. Jangan membuat fitur reset via email/SMS jika integrasinya belum tersedia. Asumsi PRD untuk lupa password adalah bantuan admin.

## 7. Komponen bersama yang perlu dibuat

| Komponen | Kegunaan |
|---|---|
| `AppShell` | Kerangka umum layout internal |
| `AdminSidebar` / `StaffNavigation` | Menu internal sesuai role |
| `RetailerShell` | Layout storefront pengecer |
| `PageHeader` | Judul, deskripsi, aksi halaman |
| `StatCard` | Kartu ringkasan dashboard |
| `StatusBadge` | Label status order/pembayaran/akun |
| `DataTable` | Tabel desktop yang punya alternatif responsif |
| `MobileDataList` | Tampilan data berbentuk kartu/list pada ponsel |
| `SearchFilterBar` | Pencarian dan filter |
| `FormField` | Label, input, helper text, validation error |
| `ConfirmDialog` | Konfirmasi aksi berdampak |
| `EmptyState` | Tampilan data kosong |
| `LoadingState` | Skeleton/indikator loading |
| `ErrorState` | Pesan error dan aksi coba lagi |
| `CurrencyDisplay` | Format Rupiah konsisten |
| `QuantityDisplay` | Jumlah tabung beserta satuan |
| `Pagination` | Pagination bila API mendukung |

Komponen di atas adalah rekomendasi konseptual; adaptasikan dengan komponen/dependensi proyek yang telah tersedia.

## 8. Acceptance notes per halaman

- Setiap halaman harus punya judul yang jelas dan akses kembali/navigasi yang konsisten.
- Form tidak boleh kehilangan input secara tidak terduga ketika API gagal, sepanjang aman untuk dipertahankan.
- Setelah mutasi sukses, perbarui data yang relevan dari respons API atau lakukan refetch; jangan mengandalkan angka lokal yang belum diverifikasi.
- Untuk aksi yang dapat mengubah saldo, tampilkan ringkasan sebelum submit.
- Tidak boleh ada tombol yang terlihat aktif tetapi tidak memiliki aksi nyata. Jika endpoint belum tersedia, tandai fitur sebagai belum terintegrasi dan jangan menyimulasikan keberhasilan.
