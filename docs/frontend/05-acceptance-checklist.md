# Frontend Acceptance Checklist

**Proyek:** Sistem Pemesanan dan Manajemen Pangkalan LPG  
**Versi:** 1.0  
**Status awal:** Belum diuji — checklist ini harus diperbarui berdasarkan implementasi nyata.

> Checklist ini merupakan kriteria penerimaan frontend. Hasil yang diharapkan bukan bukti bahwa sistem sudah lulus. Centang item hanya setelah diuji.

## 1. Cara menggunakan checklist

Untuk setiap item, catat:
- Status: `Belum diuji`, `Lulus`, `Gagal`, atau `Blocked`.
- Tanggal dan penguji.
- Browser/perangkat.
- Bukti (screenshot, log, test output, atau nomor kasus).
- Catatan masalah dan issue terkait.

Jangan menandai integrasi API berhasil jika fitur masih memakai mock data.

## 2. Repository dan kesiapan pengembangan

- [ ] Struktur repository diperiksa sebelum perubahan.
- [ ] `package.json` dan lockfile diperiksa.
- [ ] Versi Vue dan build tool dikonfirmasi.
- [ ] Router/state management/CSS framework yang benar-benar tersedia dikonfirmasi.
- [ ] Script development, lint, type-check, test, dan build dicatat.
- [ ] Dependensi baru memiliki alasan dan tidak merusak lockfile.
- [ ] Frontend berjalan tanpa error build.
- [ ] Backend tidak berubah tanpa persetujuan pemilik backend.
- [ ] Secret/backend credentials tidak ada di bundle frontend atau repository publik.

## 3. Navigasi dan autentikasi

### Login
- [ ] Halaman login dapat dibuka oleh pengguna yang belum login.
- [ ] Field username/email dan password sesuai kontrak API.
- [ ] Kredensial valid menghasilkan sesi sesuai mekanisme backend.
- [ ] Kredensial salah menghasilkan pesan yang jelas.
- [ ] Akun pending/nonaktif tidak mendapat akses terlindungi.
- [ ] Pengguna diarahkan berdasarkan role dari backend.
- [ ] Tombol submit memiliki loading state dan mencegah klik ganda.
- [ ] Kondisi koneksi gagal tidak menampilkan status login berhasil.

### Role dan route guard
- [ ] Admin diarahkan ke dashboard admin.
- [ ] Karyawan diarahkan ke dashboard karyawan.
- [ ] Pengecer aktif diarahkan ke katalog.
- [ ] Pengguna belum login tidak dapat membuka halaman privat.
- [ ] Karyawan tidak melihat menu/aksi manajemen produk dan harga.
- [ ] Karyawan tidak melihat menu/aksi akun, koreksi stok, laporan agregat, atau audit.
- [ ] Pengecer tidak melihat menu internal/admin.
- [ ] Backend tetap diuji menolak akses API yang tidak diizinkan; route guard frontend tidak dianggap bukti keamanan.
- [ ] Logout mengakhiri sesi sesuai kontrak backend dan membersihkan state frontend yang relevan.

## 4. Registrasi dan akun pengecer

- [ ] Form memuat nama penanggung jawab, nama usaha, kontak, username, password, dan konfirmasi password.
- [ ] Tidak ada field NIK/KTP atau upload foto identitas.
- [ ] Validasi field wajib berjalan.
- [ ] Konfirmasi password harus sesuai.
- [ ] Error duplikasi/validasi backend tampil dengan benar.
- [ ] Registrasi sukses menampilkan status menunggu persetujuan.
- [ ] Akun pending tidak dapat memesan.
- [ ] Admin dapat melihat daftar pendaftaran pending.
- [ ] Admin dapat menyetujui pendaftaran.
- [ ] Admin dapat menolak pendaftaran dengan alasan wajib.
- [ ] Admin dapat membuat akun pengecer sesuai kemampuan API.
- [ ] Status akun aktif/nonaktif tampil benar.
- [ ] Riwayat order/transaksi tidak hilang ketika akun dinonaktifkan.

## 5. Dashboard

### Admin
- [ ] Kartu stok tersedia tampil dari data backend.
- [ ] Jumlah pesanan menunggu tampil dari data backend.
- [ ] Penjualan hari ini tampil dengan format Rupiah.
- [ ] Total piutang tampil terpisah dari penjualan.
- [ ] Peringatan stok minimum tampil sesuai threshold backend.
- [ ] Daftar pesanan terbaru menampilkan status yang benar.
- [ ] Klik kartu/tautan membuka halaman terkait.
- [ ] Empty state dan error state tersedia.

### Karyawan
- [ ] Dashboard hanya menampilkan ringkasan operasional yang diizinkan.
- [ ] Tidak ada laporan agregat atau audit yang tidak diizinkan.
- [ ] Aksi cepat menuju penerimaan pasokan, pesanan, penjualan langsung, dan pembayaran tersedia sesuai API.

## 6. Produk dan katalog

### Admin — Manajemen Produk
- [ ] Daftar produk menampilkan nama, ukuran, harga, dan status.
- [ ] Admin dapat menambah produk jika endpoint tersedia.
- [ ] Admin dapat mengubah data/harga jika endpoint tersedia.
- [ ] Admin dapat menonaktifkan produk.
- [ ] Produk nonaktif tidak dapat dipilih untuk order baru.
- [ ] Perubahan harga tidak mengubah harga transaksi/order historis.
- [ ] Validasi harga nonnegatif tampil.

### Pengecer — Katalog
- [ ] Hanya produk aktif yang dapat dipesan.
- [ ] Nama dan ukuran produk jelas.
- [ ] Harga menggunakan format Rupiah.
- [ ] Stok tersedia berasal dari backend dan memperhitungkan alokasi.
- [ ] Stok kosong tidak digabungkan dengan stok penuh.
- [ ] Produk dengan stok tersedia 0 tidak dapat ditambahkan.
- [ ] Jumlah yang dipilih berupa bilangan bulat positif.
- [ ] Katalog nyaman digunakan pada ponsel.
- [ ] Error dan empty state tersedia.

## 7. Persediaan/stok

- [ ] Stok penuh tampil terpisah dari stok kosong.
- [ ] Stok dialokasikan tampil terpisah bila role diizinkan.
- [ ] Stok tersedia = stok penuh fisik − stok dialokasikan (minimum 0).
- [ ] Tidak ada perhitungan stok jual yang menjumlahkan tabung penuh dan kosong.
- [ ] Admin/karyawan dapat melihat ringkasan stok sesuai izin.
- [ ] Admin/karyawan dapat membuka riwayat pergerakan stok.
- [ ] Filter riwayat hanya ditampilkan jika didukung API.
- [ ] Riwayat stok bersifat baca-saja.

### Penerimaan pasokan
- [ ] Form memuat produk, jumlah penuh masuk, jumlah kosong dikirim, dan catatan opsional.
- [ ] Validasi jumlah bilangan bulat/nonnegatif berjalan.
- [ ] Ringkasan perubahan tampil sebelum submit.
- [ ] Backend menolak input yang menyebabkan saldo tidak valid.
- [ ] Setelah sukses, saldo dan riwayat diperbarui dari backend.
- [ ] Retry tidak menggandakan penerimaan.

### Koreksi stok (admin saja)
- [ ] Aksi koreksi hanya tersedia untuk admin.
- [ ] Alasan koreksi wajib diisi.
- [ ] Saldo sebelum dan perubahan jelas.
- [ ] Konfirmasi tersedia sebelum submit.
- [ ] Koreksi tidak dapat membuat saldo negatif atau alokasi melebihi stok penuh.
- [ ] Hasil koreksi dan riwayat tampil setelah backend mengonfirmasi.
- [ ] Karyawan ditolak oleh UI dan backend.

## 8. Pemesanan pengecer dan pemrosesan internal

### Pengajuan order pengecer
- [ ] Pengecer aktif dapat menambah produk ke keranjang.
- [ ] Keranjang menampilkan item, harga, kuantitas, subtotal, total.
- [ ] Kuantitas 0, negatif, pecahan, atau format tidak valid ditolak.
- [ ] Stok dicek ulang backend saat pengajuan.
- [ ] Order valid mendapat nomor unik dan status Menunggu Konfirmasi.
- [ ] Pengajuan tidak langsung mengalokasikan stok.
- [ ] Pengajuan tidak langsung membuat penjualan.
- [ ] Klik ganda/retry tidak membuat order duplikat.
- [ ] Setelah berhasil, nomor order dan status tampil.

### Pesanan masuk admin/karyawan
- [ ] Daftar order menampilkan nomor, pengecer, tanggal, item/total, dan status.
- [ ] Filter/search berjalan sesuai API.
- [ ] Detail order menampilkan item dan harga saat pengajuan.
- [ ] Konfirmasi hanya tersedia pada status yang sah.
- [ ] Konfirmasi menampilkan ringkasan dan stok tersedia terkini.
- [ ] Backend memvalidasi stok ulang dan mencegah reservasi melebihi stok fisik.
- [ ] Konflik stok menampilkan pesan yang dapat dipahami.
- [ ] Penolakan mewajibkan alasan.
- [ ] Pembatalan mewajibkan alasan dan melepas reservasi jika sebelumnya sudah dialokasikan.
- [ ] Karyawan dapat konfirmasi/tolak order sesuai keputusan PRD.
- [ ] Tidak ada aksi status yang melanggar state machine.

### Serah-terima dan penyelesaian order
- [ ] Penyelesaian hanya tersedia untuk order terkonfirmasi.
- [ ] Input jumlah tabung kosong yang benar-benar diterima.
- [ ] Pilihan pembayaran Tunai/Bon tersedia sesuai backend.
- [ ] Bon dapat menerima pembayaran awal dari Rp0 sampai total transaksi.
- [ ] Ringkasan transaksi dan sisa tagihan tampil sebelum konfirmasi.
- [ ] Setelah backend sukses, order berubah menjadi Selesai.
- [ ] Stok penuh berkurang, reservasi dilepas, dan stok kosong bertambah sesuai jumlah aktual.
- [ ] Satu order hanya membentuk satu penjualan.
- [ ] Klik ganda/retry tidak menggandakan sale atau pergerakan stok.

## 9. Penjualan langsung

- [ ] Admin/karyawan dapat membuka form penjualan langsung.
- [ ] Tidak ada permintaan akun pembeli langsung.
- [ ] Tidak ada field NIK/KTP.
- [ ] Produk dan jumlah tabung penuh yang keluar dicatat.
- [ ] Jumlah tabung kosong aktual yang diterima dicatat terpisah.
- [ ] Stok diperiksa backend.
- [ ] Ringkasan total dan pembayaran tunai tampil.
- [ ] Konfirmasi tersedia sebelum simpan.
- [ ] Nomor transaksi ditampilkan setelah backend sukses.
- [ ] Retry tidak menggandakan sale atau mengurangi stok dua kali.

## 10. Pembayaran dan piutang

- [ ] Petugas dapat menemukan tagihan sesuai hak aksesnya.
- [ ] Detail menampilkan total transaksi, pembayaran, dan sisa.
- [ ] Pembayaran awal bon tercatat sebagai payment terpisah bila model backend demikian.
- [ ] Pembayaran sebagian dapat dicatat.
- [ ] Pelunasan dapat dicatat.
- [ ] Nominal harus positif.
- [ ] Nominal tidak boleh melebihi sisa tagihan terkini.
- [ ] Saldo sebelum dan sesudah pembayaran ditampilkan.
- [ ] Status Dibayar Sebagian/Lunas tampil sesuai respons backend.
- [ ] Riwayat pembayaran tidak hilang/ditimpa.
- [ ] Klik ganda/retry tidak mencatat pembayaran ganda.
- [ ] Pengecer hanya melihat tagihan miliknya sendiri.
- [ ] Pengecer tidak dapat mengubah pembayaran/tagihan pada V1.

## 11. Laporan dan audit

### Laporan penjualan
- [ ] Hanya admin yang dapat membuka.
- [ ] Filter periode/produk/jenis transaksi bekerja jika didukung API.
- [ ] Nilai penjualan tidak disamakan dengan uang tunai yang diterima.
- [ ] Total dan rincian konsisten dengan data transaksi sumber.

### Laporan stok
- [ ] Hanya admin yang dapat membuka.
- [ ] Saldo penuh/kosong dan alokasi dibedakan.
- [ ] Filter dan rincian sesuai API.
- [ ] Pergerakan masuk/keluar/koreksi dapat ditelusuri.

### Laporan piutang
- [ ] Hanya admin yang dapat melihat agregat seluruh usaha.
- [ ] Total transaksi, total pembayaran, dan saldo jelas.
- [ ] Saldo sama dengan total transaksi dikurangi pembayaran yang berhasil.
- [ ] Filter pengecer/status/periode sesuai API.

### Audit
- [ ] Hanya admin yang dapat membuka.
- [ ] Halaman bersifat baca-saja.
- [ ] Menampilkan pelaku, waktu, aksi, objek, dan ringkasan perubahan sesuai API.
- [ ] Tidak menampilkan password, token, secret, NIK, atau KTP.

## 12. Transaksi dan tagihan pengecer

- [ ] Pengecer dapat melihat daftar transaksi sendiri.
- [ ] Detail transaksi menampilkan item, total, pembayaran, dan sisa.
- [ ] Pengecer dapat melihat tagihan/bon sendiri.
- [ ] Riwayat pembayaran ditampilkan.
- [ ] Tidak ada data pengecer lain pada UI.
- [ ] Percobaan akses ID pengecer lain ditolak oleh backend.
- [ ] Halaman bersifat read-only.

## 13. Profil

- [ ] Profil menampilkan informasi yang diizinkan.
- [ ] Pengguna dapat mengubah kata sandi jika endpoint tersedia.
- [ ] Validasi kata sandi mengikuti kontrak backend.
- [ ] Tidak pernah menampilkan hash/password.
- [ ] Logout berfungsi sesuai mekanisme autentikasi backend.

## 14. UI, responsivitas, dan aksesibilitas

- [ ] Tampilan diuji di viewport ponsel 360–430 px.
- [ ] Tampilan diuji di tablet dan desktop.
- [ ] Tidak ada scroll horizontal yang menghalangi alur utama.
- [ ] Tabel kompleks punya tampilan mobile yang dapat digunakan.
- [ ] Tombol dan area sentuh nyaman digunakan di ponsel.
- [ ] Fokus keyboard terlihat.
- [ ] Semua input mempunyai label.
- [ ] Status tidak hanya dibedakan melalui warna.
- [ ] Kontras dan ukuran teks dapat dibaca.
- [ ] Loading, empty, error, success, dan disabled states konsisten.
- [ ] Format Rupiah dan kuantitas konsisten.
- [ ] Tanggal/waktu memakai zona operasional yang disepakati.

## 15. Integrasi dan ketahanan jaringan

- [ ] Seluruh endpoint yang digunakan telah diverifikasi terhadap `backend-api.md` dan server.
- [ ] Tidak ada endpoint fiktif atau request payload hasil tebakan.
- [ ] Tidak ada akses database langsung dari frontend.
- [ ] Tidak ada secret di bundle frontend.
- [ ] CORS dan base URL sesuai lingkungan.
- [ ] Network error ditampilkan dengan jelas.
- [ ] Operasi tulis tidak menampilkan sukses sebelum backend mengonfirmasi.
- [ ] Jika timeout terjadi, UI memberi instruksi memeriksa riwayat/status sebelum mencoba ulang.
- [ ] Tidak ada mock data yang tercampur diam-diam dengan API produksi.

## 16. Build dan verifikasi akhir

- [ ] Script lint yang tersedia berhasil.
- [ ] Type-check yang tersedia berhasil.
- [ ] Unit/component test yang tersedia berhasil.
- [ ] Build produksi berhasil.
- [ ] Browser console tidak menunjukkan error kritis.
- [ ] Alur inti diuji end-to-end untuk tiga role.
- [ ] Tes otorisasi backend untuk role dan ownership dijalankan/dikonfirmasi.
- [ ] Tidak ada perubahan backend/database tanpa izin.
- [ ] Daftar bug/blocker tersisa didokumentasikan.
- [ ] Status checklist diperbarui berdasarkan pengujian nyata.

## 17. Catatan hasil pengujian

| Tanggal | Penguji | Halaman/flow | Perangkat/browser | Status | Bukti/link | Catatan |
|---|---|---|---|---|---|---|
| — | — | — | — | Belum diuji | — | — |

## 18. Kriteria minimum siap demo

Sistem dapat dipertimbangkan siap demo ketika:
- Login dan pengalihan role berjalan.
- Pengecer dapat melihat katalog dan mengajukan order.
- Admin/karyawan dapat memproses order dan menyelesaikan serah-terima.
- Stok penuh/kosong dan alokasi ditampilkan dengan benar.
- Penjualan langsung dan pembayaran bon dapat dicatat sesuai API.
- Pengecer hanya melihat data miliknya.
- Tampilan alur inti dapat digunakan dari ponsel.
- Tidak ada status sukses palsu atau transaksi ganda dalam skenario uji.
- Hasil yang belum terintegrasi atau belum diuji disebutkan secara jujur saat demo.
