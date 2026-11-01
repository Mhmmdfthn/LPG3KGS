# Design System — Sistem Pemesanan dan Manajemen Pangkalan LPG

**Versi:** 1.0  
**Status:** Usulan visual frontend, bukan identitas visual resmi mitra  
**Tujuan:** menjaga tampilan konsisten, sederhana, responsif, dan mudah digunakan.

> PRD menetapkan prinsip mobile-first, Bahasa Indonesia sederhana, angka yang jelas, konfirmasi tindakan penting, keterlacakan, dan aksesibilitas dasar. PRD belum menetapkan warna, font, logo, atau desain visual final. Token di dokumen ini adalah **usulan awal** dan dapat disesuaikan setelah ditinjau kelompok/mitra.

## 1. Arah visual

Gunakan gaya **modern, bersih, profesional, dan operasional**. Antarmuka harus terasa seperti aplikasi manajemen usaha yang jelas dan praktis, bukan marketplace penuh promosi.

Prinsip:
- Utamakan keterbacaan dan kejelasan data.
- Kurangi ornamen dan dekorasi yang tidak membantu pekerjaan.
- Gunakan ruang putih/negative space yang cukup.
- Warna status harus memiliki makna konsisten.
- Prioritaskan interaksi cepat pada ponsel.
- Hindari animasi berat dan efek visual yang mengganggu.

## 2. Palet warna usulan

Warna berikut merupakan token awal. Jangan mengklaim sebagai warna resmi pangkalan atau Pertamina.

| Token | Hex | Penggunaan |
|---|---|---|
| `color-primary-900` | `#123047` | Sidebar/heading kuat atau elemen utama |
| `color-primary-700` | `#174C68` | Tombol utama/tautan penting |
| `color-primary-600` | `#176B78` | Aksen interaktif |
| `color-primary-100` | `#E7F2F3` | Background aksen lembut |
| `color-bg` | `#F7F9FB` | Background aplikasi |
| `color-surface` | `#FFFFFF` | Card, panel, modal |
| `color-text` | `#17212B` | Teks utama |
| `color-text-muted` | `#647381` | Teks sekunder |
| `color-border` | `#E2E8EE` | Border/divider |
| `color-success` | `#16804A` | Sukses/lunas/aktif |
| `color-success-bg` | `#E8F6EE` | Background sukses |
| `color-warning` | `#A96308` | Menunggu/peringatan |
| `color-warning-bg` | `#FFF4DE` | Background peringatan |
| `color-danger` | `#B4232F` | Gagal/ditolak/nonaktif |
| `color-danger-bg` | `#FDECEE` | Background bahaya |
| `color-info` | `#245EA8` | Informasi/dikonfirmasi |
| `color-info-bg` | `#EAF2FC` | Background informasi |

Jangan menggunakan primary untuk semua tombol. Aksi destruktif menggunakan danger; aksi sekunder menggunakan neutral/outline.

## 3. Tipografi

**Usulan font:** gunakan font sans-serif yang sudah tersedia di proyek. Jika tidak ada pilihan yang ditentukan, gunakan `Inter` jika sudah terpasang; jika belum, gunakan system font stack. Jangan menambahkan font eksternal atau dependensi hanya untuk kosmetik tanpa alasan.

| Gaya | Ukuran usulan | Weight | Penggunaan |
|---|---:|---:|---|
| Page title | 24–28 px desktop; 20–24 px mobile | 600–700 | Judul halaman |
| Section title | 18–20 px | 600 | Judul section/card |
| Body | 14–16 px | 400 | Konten umum |
| Label | 13–14 px | 500–600 | Label field |
| Helper/caption | 12–13 px | 400 | Petunjuk/metadata |
| KPI value | 24–32 px | 600–700 | Angka dashboard |
| Table text | 13–14 px | 400 | Isi tabel |

Gunakan line-height yang nyaman, sekitar 1.4–1.6 untuk teks isi. Jangan mengecilkan teks penting untuk memuat lebih banyak informasi.

## 4. Spacing dan ukuran

Gunakan skala berbasis kelipatan 4 px:

| Token | Ukuran |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |

Rekomendasi:
- Padding halaman desktop: 24–32 px.
- Padding halaman mobile: 16 px.
- Jarak antar section: 24 px desktop, 16–20 px mobile.
- Padding card: 16–20 px.
- Tinggi input dan tombol utama: sekitar 44–48 px.
- Area sentuh kontrol mobile minimal sekitar 44 × 44 px.

## 5. Layout dan responsivitas

### 5.1 Breakpoint usulan

Gunakan breakpoint sesuai framework/CSS yang sudah tersedia. Bila belum ada standar proyek, gunakan patokan:
- Mobile: kurang dari 640 px.
- Tablet: 640–1023 px.
- Desktop: 1024 px ke atas.

Breakpoint adalah panduan, bukan keharusan memakai angka tersebut jika layout proyek sudah punya sistem lain.

### 5.2 Layout Admin/Karyawan

**Desktop:**
- Sidebar sekitar 240–260 px.
- Header sekitar 60–72 px.
- Konten utama mengisi sisa area.
- Maksimalkan lebar konten secara wajar; hindari baris teks yang terlalu panjang.

**Mobile:**
- Sidebar menjadi drawer/menu.
- Header ringkas dengan tombol menu dan judul/identitas.
- Padding konten 16 px.
- Kartu statistik dapat menjadi dua kolom atau satu kolom sesuai lebar layar.
- Tabel kompleks berubah menjadi kartu/list atau menyediakan cara scroll yang tidak menghambat.
- Tombol aksi utama mudah dijangkau dan tidak tertutup keyboard.

### 5.3 Layout Pengecer

- Katalog menggunakan grid responsif: satu kolom pada layar sempit, dua kolom saat ruang cukup, dan lebih banyak kolom pada desktop.
- Kartu produk menonjolkan nama, ukuran, harga, stok tersedia, dan kontrol jumlah.
- Keranjang harus mudah ditemukan.
- Detail order dan tagihan harus jelas, tidak menampilkan terlalu banyak informasi sekunder.

## 6. Bentuk komponen

| Komponen | Spesifikasi usulan |
|---|---|
| Card | Background putih, border tipis, radius 12 px, shadow sangat halus atau tanpa shadow |
| Button | Radius 8 px, tinggi 44–48 px, label jelas, state hover/focus/disabled/loading |
| Input | Tinggi 44–48 px, label di atas input, helper/error di bawah |
| Select | Tampilan dan tinggi konsisten dengan input |
| Badge | Pill/radius penuh atau rounded, teks singkat; selalu sertakan label status |
| Modal/dialog | Lebar terkontrol, ringkasan aksi, tombol batal dan konfirmasi |
| Table | Header jelas, alignment angka konsisten, row divider tipis |
| Alert | Ikon opsional, judul/pesan jelas, tidak bergantung pada warna saja |
| Tabs | Untuk kelompok konten sejenis, misalnya daftar pengecer/karyawan |
| Toast | Umpan balik singkat untuk aksi ringan; kegagalan penting tetap terlihat pada halaman |

## 7. Tombol dan hierarki aksi

- **Primary:** aksi utama halaman, misalnya Simpan, Ajukan Pesanan, Konfirmasi.
- **Secondary/Outline:** aksi alternatif, misalnya Kembali, Batal, Lihat Detail.
- **Danger:** aksi berisiko/destruktif, misalnya Tolak, Nonaktifkan, Koreksi negatif bila berlaku.
- **Ghost/Text:** aksi ringan, misalnya Lihat atau Buka.
- **Disabled:** tampilkan alasan bila pengguna perlu tahu mengapa aksi belum dapat dilakukan.
- **Loading:** ubah label/indikator dan cegah pengiriman berulang.

Jangan menempatkan dua tombol primary yang bersaing dalam satu konteks.

## 8. Status dan pemetaan warna

Status harus selalu mempunyai teks; warna hanya memperkuat makna.

### 8.1 Status order

| Status backend | Label UI | Warna usulan |
|---|---|---|
| `MENUNGGU_KONFIRMASI` | Menunggu Konfirmasi | Warning |
| `DIKONFIRMASI` | Dikonfirmasi | Info |
| `DITOLAK` | Ditolak | Danger |
| `DIBATALKAN` | Dibatalkan | Neutral/Danger lembut |
| `SELESAI` | Selesai | Success |

### 8.2 Status pembayaran

| Kondisi | Label UI | Warna usulan |
|---|---|---|
| Saldo lebih dari 0 dan belum ada pembayaran | Belum Dibayar | Warning |
| Sudah ada pembayaran dan saldo masih lebih dari 0 | Dibayar Sebagian | Info/Warning |
| Saldo 0 | Lunas | Success |

Gunakan status aktual dari API bila tersedia. Jangan menghitung status berbeda dari backend hanya berdasarkan tampilan lokal.

### 8.3 Status akun

| Status | Label UI | Warna usulan |
|---|---|---|
| Menunggu persetujuan | Menunggu Persetujuan | Warning |
| Aktif | Aktif | Success |
| Ditolak | Ditolak | Danger |
| Nonaktif | Nonaktif | Neutral/Danger lembut |

## 9. Tabel dan data numerik

- Kolom tanggal, jumlah, dan uang harus memiliki alignment yang konsisten.
- Uang rata kanan dan menggunakan pemisah ribuan.
- Kuantitas menggunakan integer dan satuan tabung pada header/label.
- Tampilkan nomor transaksi/order sebagai teks yang mudah disalin.
- Tabel desktop tidak boleh menjadi tabel mini dengan teks yang tidak terbaca pada ponsel; ubah menjadi kartu/list atau pola responsif lain.
- Pagination, sorting, dan filter hanya ditampilkan jika didukung data/API.

## 10. Form dan validasi

- Setiap input memiliki label yang terlihat; placeholder bukan pengganti label.
- Pesan validasi menjelaskan cara memperbaiki nilai.
- Tampilkan ringkasan sebelum mengirim aksi yang mengubah stok/uang/status penting.
- Kuantitas tabung berupa bilangan bulat positif; koreksi stok mengikuti aturan khusus dan tidak boleh menimbulkan saldo negatif.
- Pembayaran harus positif dan tidak melebihi sisa tagihan.
- Harga tidak negatif.
- Validasi frontend membantu pengguna, tetapi backend tetap melakukan validasi final.

## 11. Format angka dan tanggal

- Rupiah: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` atau utilitas formatter setara jika sesuai struktur proyek.
- Kuantitas: format bilangan dengan locale Indonesia, tampilkan unit `tabung`.
- Tanggal/waktu: format locale Indonesia dan zona waktu `Asia/Jakarta`, setelah format API diverifikasi.
- Jangan melakukan perhitungan saldo kritis hanya dari data yang tidak lengkap di frontend.

## 12. Ikon dan ilustrasi

- Gunakan satu set ikon yang konsisten dan sudah terpasang di proyek.
- Jangan mencampur emoji dan ikon sebagai pengganti ikon navigasi profesional.
- Setiap ikon aksi penting harus disertai tooltip/label yang mudah dipahami bila maknanya tidak jelas.
- Hindari gambar dekoratif besar pada halaman operasional.

## 13. Aksesibilitas dasar

- Kontras teks dan background harus memadai.
- Fokus keyboard terlihat.
- Semua input memiliki label.
- Tombol dan link mempunyai nama yang bermakna.
- Status tidak dibedakan oleh warna saja.
- Modal dapat diakses dengan keyboard dan fokus tidak hilang.
- Jangan menonaktifkan zoom browser secara paksa.
- Pastikan ukuran teks dan target sentuh nyaman di ponsel.

## 14. Motion dan feedback

- Transisi singkat hanya untuk membantu memahami perubahan state.
- Hindari animasi berulang atau berat.
- Loading harus terlihat, tetapi tidak menutupi seluruh halaman bila hanya satu bagian yang sedang memuat.
- Untuk submit penting, tampilkan status sedang diproses dan hasil akhir dari backend.
- Pertimbangkan `prefers-reduced-motion` bila menggunakan animasi.

## 15. Prinsip konsistensi

Jika komponen serupa muncul di banyak halaman, gunakan komponen/utility bersama. Jangan membuat tampilan badge, tombol, form, modal, format uang, atau navigasi berbeda-beda per halaman tanpa alasan. Perubahan design system harus diterapkan konsisten dan dicatat dalam dokumen ini.
