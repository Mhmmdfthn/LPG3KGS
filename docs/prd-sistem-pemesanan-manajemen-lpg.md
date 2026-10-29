# Product Requirements Document (PRD)
## Sistem Pemesanan dan Manajemen Pangkalan LPG

| Metadata | Keterangan |
|---|---|
| Nama produk | Sistem Pemesanan dan Manajemen Pangkalan LPG |
| Jenis produk | Website operasional pangkalan dan pemesanan B2B untuk pengecer |
| Versi PRD | 1.0 — rancangan kebutuhan versi pertama |
| Tanggal dokumen | 29 Oktober 2026 |
| Status | Siap ditinjau; keputusan lanjutan yang belum tervalidasi tercantum pada Bagian 9 |
| Sumber utama | `E-COMMERCE Week 6.md` — *Laporan Analisis Kebutuhan Website Sistem Pemesanan dan Manajemen Pangkalan LPG*, Kelompok 7 (5IKRA), Universitas Putra Bangsa, 2026 |
| Pembaca utama | Developer junior, penguji/QA, pemilik produk, dan tim proyek |
| Ruang lingkup rilis | **Seluruh fitur MUST dan SHOULD** pada analisis kebutuhan; fitur COULD/masa depan tidak termasuk |
| Platform | Website responsif, mobile-first, berbahasa Indonesia |
| Stack usulan dari laporan | Vue.js (frontend), Node.js + Express.js (REST API), PostgreSQL melalui Supabase |

> **Status informasi:** Masalah operasional, aktor, produk LPG, dan batasan integrasi bersumber dari laporan wawancara. **Keputusan final dari pemesan PRD**: (1C) akun pengecer bisa didaftarkan sendiri atau dibuat admin; (2B) tunai, bon, pembayaran sebagian dan pelunasan; (3A) alokasi stok setelah konfirmasi pesanan; (4B) karyawan dapat mengonfirmasi/menolak pesanan tetapi tidak mengatur produk atau mengoreksi stok; (5A) rilis pertama memuat semua kebutuhan MUST dan SHOULD. Rincian teknis yang belum ada di sumber ditandai sebagai **asumsi rancangan** atau **pertanyaan terbuka**, bukan dianggap hasil wawancara.

---

# 1. Introduction / Overview

## 1.1 Latar belakang

Mitra adalah pangkalan LPG resmi yang melayani pengecer (warung/grosir) dan pembeli langsung/UMKM kecil. Berdasarkan wawancara dalam laporan, sekitar 60% pelanggan adalah pengecer dan 40% adalah konsumen langsung/UMKM kecil; proporsi tersebut merupakan **perkiraan pemilik, bukan hasil pengukuran**. Produk meliputi LPG 3 kg bersubsidi serta Bright Gas 5,5 kg dan 12 kg. Pencatatan stok, transaksi, serta bon/piutang saat ini banyak dilakukan menggunakan buku tulis, sedangkan permintaan stok dan pemesanan pengecer masuk melalui WhatsApp pribadi.

Masalah yang harus diselesaikan:

| ID masalah | Kondisi saat ini | Dampak | Kemampuan produk yang menjawabnya |
|---|---|---|---|
| P-01 | Stok tabung penuh dan kosong pernah tercampur dalam catatan; penjualan belum langsung dicatat | Stok tersedia tidak akurat, pengecer bisa datang ketika stok isi sebenarnya habis | Stok penuh/kosong terpisah, pergerakan stok otomatis, koreksi berjejak, peringatan stok minimum |
| P-02 | Pesanan dan pertanyaan stok melalui WhatsApp dapat tertunda saat pemilik melayani pelanggan lain | Pesanan tenggelam, pengecer tidak tahu statusnya | Katalog dan stok tersedia, order dengan nomor/status, antrean konfirmasi, reservasi stok |
| P-03 | Bon/piutang ditulis pada buku yang dapat hilang/rusak | Nominal penagihan sulit dipastikan, potensi sengketa | Catatan penjualan, tagihan, pembayaran sebagian/pelunasan, saldo otomatis, laporan dan audit |
| P-04 | Proses resmi LPG 3 kg melalui MAP kadang menambah kerja administratif jika aplikasi terganggu | Pencatatan berulang | **Tidak ditangani oleh website**; proses MAP tetap terpisah, tanpa menyimpan NIK/KTP |

## 1.2 Ringkasan solusi

Bangun satu website dengan tiga peran: **Pemilik/Admin**, **Karyawan**, dan **Pengecer**. Pengecer melihat katalog dan stok yang masih dapat dipesan, mengajukan pesanan, lalu memantau status, transaksi, dan tagihan miliknya sendiri. Admin dan karyawan mengelola pesanan, pasokan, serah-terima, penjualan langsung, dan pembayaran menurut hak akses masing-masing. Admin juga mengatur akun, produk, koreksi stok, dan melihat laporan seluruh usaha.

**Prinsip paling penting:** (a) tabung penuh dan kosong adalah saldo berbeda; (b) pesanan tidak sama dengan penjualan; (c) stok disisihkan hanya setelah pesanan dikonfirmasi; (d) penjualan dan perpindahan stok terjadi tepat satu kali saat serah-terima; (e) saldo piutang berasal dari transaksi dan riwayat pembayaran, bukan angka yang ditimpa manual.

## 1.3 Pengguna dan konteks penggunaan

- **Pemilik/Admin:** pengambil keputusan dan pengawas operasi, biasanya memakai ponsel Android dengan internet berbasis kuota; membutuhkan ringkasan yang cepat dan catatan yang dapat dipercaya.
- **Karyawan:** petugas operasional yang mencatat pasokan, penjualan langsung, serah-terima, konfirmasi/penolakan pesanan, dan penerimaan pembayaran; tidak boleh mengubah produk/harga atau melakukan koreksi saldo stok.
- **Pengecer:** pelanggan bisnis yang mempunyai akun aktif; membutuhkan informasi stok, proses pengajuan pesanan yang jelas, dan transparansi tagihan miliknya sendiri.
- **Pembeli langsung:** tidak memiliki akun pada versi pertama; transaksi dicatat oleh admin/karyawan. Pendataan identitas untuk LPG 3 kg tetap dilakukan pada MAP resmi, di luar website.

## 1.4 Definisi dan istilah

| Istilah | Arti operasional |
|---|---|
| Stok penuh | Jumlah tabung berisi yang secara fisik tersedia di pangkalan per produk/ukuran |
| Stok kosong | Jumlah tabung kosong di pangkalan per produk/ukuran |
| Stok dialokasikan (*reserved*) | Jumlah stok penuh yang telah dijanjikan untuk pesanan terkonfirmasi tetapi belum diserahterimakan |
| Stok tersedia dipesan | `stok_penuh - stok_dialokasikan`, minimum 0; **bukan** jumlah tabung penuh dan kosong digabung |
| Order/pesanan | Permintaan pembelian pengecer; belum otomatis menjadi penjualan |
| Penjualan | Transaksi saat barang benar-benar diserahkan kepada pembeli |
| Bon/piutang | Saldo transaksi pengecer yang belum dibayar seluruhnya |
| Pembayaran sebagian | Pembayaran positif yang lebih kecil dari sisa tagihan sebelum pembayaran |
| MAP | Aplikasi/sistem resmi Pertamina yang tetap dijalankan terpisah untuk proses yang diwajibkan |
| Rilis pertama/V1 | Seluruh MUST dan SHOULD dari laporan beserta perubahan berdasarkan jawaban klarifikasi |

## 1.5 Batasan dan dependensi dasar

Aplikasi bergantung pada pencatatan transaksi yang disiplin oleh pengguna; **tidak** menghitung stok fisik otomatis. Aplikasi ini **bukan pengganti MAP**, tidak membaca/menulis NIK atau foto KTP, dan tidak melakukan sinkronisasi resmi Pertamina. Data penjualan LPG 3 kg yang disimpan sebatas data operasional internal yang diperbolehkan oleh kebijakan pangkalan dan ketentuan yang berlaku. Rincian kepatuhan, harga/kuota, dan aturan pembeli bersubsidi harus divalidasi oleh pemilik sebelum penggunaan nyata.

# 2. Goals

## 2.1 Tujuan produk

| ID | Tujuan terukur | Target rancangan penerimaan V1 | Pengukuran |
|---|---|---|---|
| G-01 | Memisahkan dan menjaga konsistensi stok penuh/kosong | 100% skenario uji stok utama menghasilkan saldo dan log pergerakan yang benar; tidak ada saldo negatif | UAT + rekonsiliasi database dan hasil perhitungan |
| G-02 | Membuat seluruh pesanan pengecer terlacak | 100% pesanan valid mempunyai nomor unik, waktu pengajuan, status, pemilik pesanan, dan histori perubahan | UAT dan audit sampel data uji |
| G-03 | Mencegah komitmen stok berlebihan | Tidak ada dua pesanan terkonfirmasi yang menghasilkan `reserved > stok_penuh`; pengujian paralel lulus | Uji permintaan bersamaan dan invarians database |
| G-04 | Menyediakan catatan piutang dan pembayaran yang dapat dihitung ulang | 100% saldo sampel uji sama dengan `total_transaksi - total_pembayaran`; tak ada pembayaran yang menggandakan atau melebihi saldo | UAT transaksi tunai/bon/cicilan/pelunasan |
| G-05 | Mendukung operasi di ponsel | Semua alur utama dapat diselesaikan pada viewport ponsel tanpa scroll horizontal yang menghambat atau kontrol tidak terjangkau | UAT Android dan inspeksi UI |
| G-06 | Menjaga kerahasiaan data per pengecer | 100% skenario akses lintas akun dan akses tanpa izin ditolak di backend | Uji otorisasi/API |
| G-07 | Memudahkan pemilik memantau kegiatan | Dashboard menampilkan stok tersedia, pesanan menunggu, penjualan hari ini, dan total piutang berdasarkan data tersimpan | UAT perbandingan kartu dashboard dengan data transaksi |
| G-08 | Menyediakan laporan operasional V1 | Laporan penjualan, pergerakan stok, piutang dapat difilter dan angka cocok dengan data sumber | UAT laporan periode dan rekonsiliasi |

**Catatan metrik:** laporan sumber tidak memuat *baseline* kuantitatif volume transaksi, selisih stok, atau kecepatan respons saat ini. Karena itu angka di atas adalah **target kualitas fitur dan pengujian awal**. Dampak bisnis (misalnya pengurangan waktu melayani order) baru boleh diklaim setelah pengukuran sebelum/sesudah implementasi.

## 2.2 Prioritas dan kriteria selesai

- **P0 — alur inti:** login/akses, akun pengecer, katalog, stok penuh/kosong, stok masuk, pesanan, reservasi, serah-terima, penjualan langsung, bon, saldo piutang, laporan piutang, keamanan dan integritas data.
- **P1 — tetap wajib di V1:** koreksi stok beralasan, riwayat/filter, ambang stok minimum, pembatalan yang mengembalikan reservasi, pembayaran sebagian, ringkasan transaksi pengecer, dashboard, laporan penjualan/stok, jejak audit.
- **Bukan scope V1:** semua fitur yang oleh laporan disebut 'COULD' atau pengembangan berikutnya.

**Definition of Done V1:** seluruh FR dan NFR yang tertulis pada PRD telah ditinjau, implementasi dan pengujian otomatis/manual diselesaikan pada tahap pengembangan terpisah, UAT kritis lulus, akses peran benar, transaksi stok/piutang konsisten, serta pertanyaan terbuka berisiko tinggi telah diputuskan. PRD ini **bukan perintah untuk mengimplementasikan**.

# 3. User Stories

Format: **Sebagai [peran], saya ingin [kebutuhan], sehingga [manfaat].** Setiap cerita memiliki kriteria penerimaan untuk menghindari interpretasi berbeda.

| ID | User story | Kriteria penerimaan utama | Tautan kebutuhan |
|---|---|---|---|
| US-01 | Sebagai pengecer baru, saya ingin mendaftar dan menunggu persetujuan admin sehingga saya bisa memiliki akun resmi | Registrasi berhasil memberi status *Menunggu Persetujuan*; belum bisa bertransaksi sebelum disetujui | FR-36, FR-37 |
| US-02 | Sebagai admin, saya ingin membuat dan menyetujui akun pengecer agar hanya pengecer tepercaya dapat memesan | Akun buatan admin dan hasil persetujuan memiliki status aktif; penolakan menyimpan alasan | FR-03, FR-37 |
| US-03 | Sebagai pengguna, saya ingin masuk dan keluar sesuai peran agar data saya aman | Kredensial valid masuk ke halaman sesuai role; logout mengakhiri sesi | FR-01, FR-02 |
| US-04 | Sebagai admin, saya ingin mengelola produk dan harga agar katalog sesuai penjualan pangkalan | Hanya admin dapat tambah/ubah/nonaktifkan; harga historis penjualan tidak berubah | FR-05, FR-23 |
| US-05 | Sebagai admin/karyawan, saya ingin mencatat pasokan dari agen dan pertukaran tabung agar saldo stok benar | Stok penuh bertambah, stok kosong yang dikirim ke agen berkurang, semuanya memiliki jejak | FR-06 s.d. FR-09 |
| US-06 | Sebagai pengecer, saya ingin melihat stok yang benar-benar tersedia agar tidak memesan barang yang tidak dapat dipenuhi | Katalog menampilkan `stok_penuh - reserved` dan membatasi jumlah pesanan | FR-13, FR-15, FR-19 |
| US-07 | Sebagai pengecer, saya ingin mengirim pesanan dan menerima nomor pesanan agar bisa memantau statusnya | Validasi produk/jumlah sukses menghasilkan order berstatus Menunggu Konfirmasi | FR-14, FR-16, FR-18 |
| US-08 | Sebagai admin/karyawan, saya ingin menyetujui/menolak pesanan agar alokasi stok terkontrol | Konfirmasi menyisihkan stok; penolakan beralasan tidak menyisihkan stok | FR-17, FR-19, FR-40 |
| US-09 | Sebagai admin/karyawan, saya ingin menyelesaikan serah-terima agar stok dan penjualan tercatat sekali | Order selesai menghasilkan satu transaksi, satu rangkaian perubahan stok, dan tidak dapat diselesaikan dua kali | FR-21, FR-23 |
| US-10 | Sebagai petugas, saya ingin mencatat penjualan pembeli langsung agar stok tetap akurat meskipun pembeli tidak punya akun | Penjualan tunai bisa dibuat tanpa akun pengecer, dengan catatan tabung kosong yang benar-benar diterima | FR-22, FR-09 |
| US-11 | Sebagai admin/karyawan, saya ingin mencatat bon dan cicilan pengecer agar sisa tagihan otomatis terhitung | Bon menunjuk transaksi dan pengecer; setiap pembayaran mengurangi saldo, termasuk pembayaran sebagian | FR-24 s.d. FR-28, FR-39 |
| US-12 | Sebagai pengecer, saya ingin memeriksa transaksi dan tagihan saya sendiri agar bisa mencocokkan nominal pembayaran | Hanya transaksi/tagihan milik akun tersebut yang tersedia | FR-04, FR-29 |
| US-13 | Sebagai admin, saya ingin memperbaiki stok dengan alasan agar selisih fisik dan sistem dapat diaudit | Koreksi mengubah saldo disertai alasan, nilai sebelum/sesudah, waktu dan pelaku | FR-10, FR-35 |
| US-14 | Sebagai admin, saya ingin melihat dashboard dan laporan supaya tahu kondisi usaha tanpa menghitung buku satu per satu | Kartu ringkasan dan laporan merefleksikan transaksi, stok, pesanan serta piutang pada periode/filter yang dipilih | FR-31 s.d. FR-34 |
| US-15 | Sebagai admin, saya ingin melihat aktivitas perubahan penting agar bisa menelusuri selisih | Audit menampilkan pelaku, waktu, jenis tindakan, entitas dan ringkasan perubahan | FR-35 |
| US-16 | Sebagai admin/karyawan, saya ingin mencari pesanan, transaksi, dan riwayat stok agar cepat menemukan catatan lama | Filter yang didukung bekerja tanpa mengubah data | FR-11, FR-30, FR-41 |
| US-17 | Sebagai admin, saya ingin menentukan batas stok minimum agar mengetahui kapan stok menipis | Produk yang stok tersedia di bawah ambang diberi indikator peringatan | FR-12 |

# 4. Functional Requirements

## 4.1 Konvensi persyaratan

- **MUST** dan **SHOULD** pada dokumen sumber **keduanya masuk V1**, mengikuti keputusan 5A; label prioritas asli dipertahankan untuk urutan pekerjaan.
- **FR-01 hingga FR-35** mempertahankan identitas kebutuhan dari laporan sumber dengan penjelasan yang diperjelas.
- **FR-36 dan seterusnya** adalah penjabaran keputusan pengguna atau kebutuhan pendukung supaya alur bisa dikerjakan dan diuji.
- Kolom **Penerimaan** menyatakan perilaku yang dapat diuji; contoh error/validasi berlaku di frontend **dan** backend, dengan backend sebagai sumber keputusan.
- Semua nilai uang memakai **Rupiah (IDR)** dan jumlah tabung berupa **bilangan bulat**. Kuantitas transaksi harus positif; saldo stok boleh nol, tidak boleh negatif.

## 4.2 Matriks hak akses V1

| Aktivitas | Admin | Karyawan | Pengecer |
|---|:---:|:---:|:---:|
| Masuk/keluar dan ubah kata sandi sendiri | Ya | Ya | Ya |
| Daftar akun pengecer sendiri | Tidak perlu | Tidak | Ya (publik, sebelum login) |
| Setujui/tolak/nonaktifkan akun pengecer | Ya | Tidak | Tidak |
| Buat akun pengecer dari panel internal | Ya | Tidak | Tidak |
| Kelola akun karyawan | Ya | Tidak | Tidak |
| Tambah/ubah/nonaktifkan produk dan harga | Ya | Tidak | Tidak |
| Lihat seluruh stok penuh/kosong | Ya | Ya | Tidak (hanya stok tersedia untuk dipesan) |
| Input pasokan/tabung kosong ke agen | Ya | Ya | Tidak |
| Koreksi stok dan set ambang minimum | Ya | Tidak | Tidak |
| Lihat riwayat stok | Ya | Ya (baca-saja) | Tidak |
| Buat pesanan pengecer | Tidak melalui akun pengecer | Tidak melalui akun pengecer | Ya |
| Konfirmasi/tolak pesanan | Ya | Ya | Tidak |
| Batalkan pesanan sebelum selesai | Ya | Ya | Tidak langsung (lihat BR-10) |
| Selesaikan serah-terima pesanan | Ya | Ya | Tidak |
| Catat penjualan langsung | Ya | Ya | Tidak |
| Catat bon, pembayaran sebagian/pelunasan | Ya | Ya | Tidak |
| Lihat seluruh laporan penjualan/piutang | Ya | Tidak | Tidak |
| Lihat transaksi/tagihan miliknya sendiri | Tidak berlaku | Tidak berlaku | Ya |
| Lihat dashboard ringkasan seluruh usaha & audit | Ya | Tidak | Tidak |

**Catatan:** karyawan dapat melihat daftar/detail pesanan dan transaksi yang dibutuhkan untuk bekerja, tetapi tidak diberi akses ke laporan agregat atau saldo seluruh pengecer secara massal kecuali jika diperlukan dalam proses pencatatan pembayaran. Pembatasan pencarian piutang untuk karyawan ditentukan lebih rinci pada Bagian 9; backend harus mencegah ekspor/agregasi laporan tanpa izin.

## 4.3 Akun, autentikasi, dan otorisasi

| ID | Prioritas | Kebutuhan wajib | Penerimaan yang dapat diuji |
|---|---|---|---|
| **FR-01** | MUST | Sistem menyediakan login/logout bagi akun aktif memakai username/email yang tercatat dan kata sandi. | Akun aktif dengan kata sandi benar masuk; kredensial salah ditolak tanpa membocorkan akun; logout membuat token/sesi tidak dapat dipakai ulang. |
| **FR-02** | MUST | Backend memvalidasi tiga role (`admin`, `karyawan`, `pengecer`) untuk setiap operasi terlindungi; halaman awal sesuai role. | API endpoint admin ditolak untuk karyawan/pengecer walaupun URL atau request dipanggil manual. |
| **FR-03** | MUST | Admin dapat membuat, melihat, memperbarui data minimum, mengaktifkan/menonaktifkan akun pengecer; data minimal nama pengecer/nama usaha, kontak, username unik dan status. | Akun nonaktif ditolak untuk login/transaksi baru; riwayat order/bon lama tetap tersimpan dan terhubung. |
| **FR-04** | MUST | Pengecer hanya dapat melihat pesanan, penjualan, dan piutang miliknya sendiri. | Mengganti ID order, sale, atau tagihan milik akun lain menghasilkan `403` atau `404` tanpa data rahasia. |
| **FR-36** | MUST (tambahan 1C) | Website menyediakan registrasi mandiri pengecer: nama penanggung jawab/usaha, nomor kontak, username unik, kata sandi, konfirmasi kata sandi. Tidak meminta NIK/KTP. | Pendaftaran valid membuat akun *Menunggu Persetujuan*; data duplikat/tidak valid ditolak; password tidak tersimpan sebagai teks biasa. |
| **FR-37** | MUST (tambahan 1C) | Admin dapat menyetujui/menolak akun hasil daftar mandiri dengan alasan penolakan; admin juga dapat membuat akun pengecer langsung aktif. | Pengecer yang belum disetujui tidak dapat memesan/melihat data terlindungi; persetujuan aktif hanya setelah admin menyimpan keputusan; aksi terekam audit. |
| **FR-38** | MUST (pendukung) | Admin mengelola akun karyawan (buat, nonaktifkan, reset akses) dengan role tetap karyawan; setiap pengguna aktif dapat mengubah kata sandinya sendiri. | Hanya admin dapat menciptakan akun internal; akun nonaktif tidak dapat mengakses API walau sesi lama masih ada; sandi baru berlaku setelah penyimpanan berhasil. |

**Aturan aktivasi:** akun yang didaftarkan sendiri tidak otomatis aktif. Admin harus menyetujui. **Asumsi rancangan:** akun yang dibuat oleh admin dapat langsung aktif dan mekanisme lupa kata sandi dilakukan melalui bantuan admin, bukan email/SMS otomatis (integrasi otomatis tidak ada di V1). Detail persetujuan akun tetap dapat diperhalus tanpa mengubah prinsip akses.

## 4.4 Produk, stok, dan pasokan

| ID | Prioritas | Kebutuhan wajib | Penerimaan yang dapat diuji |
|---|---|---|---|
| **FR-05** | MUST | Admin dapat menambah/mengubah/menonaktifkan produk dengan nama, jenis/ukuran (3 kg, 5,5 kg, 12 kg), harga IDR, status aktif; produk nonaktif tidak dapat ditambahkan ke order baru. | Karyawan/pengecer gagal mengubah harga; produk nonaktif tidak tampak sebagai item yang dapat dipesan; penjualan lama tetap menyimpan harga lamanya. |
| **FR-06** | MUST | Catat dan tampilkan stok tabung penuh, stok kosong, serta stok penuh yang dialokasikan **per produk**. | LPG 3 kg dengan 12 penuh/8 kosong tampil sebagai dua saldo berbeda, bukan 20 tabung tersedia. |
| **FR-07** | MUST | Admin/karyawan mencatat penerimaan pasokan: tanggal-waktu, produk, jumlah tabung penuh diterima, tabung kosong dikirim ke agen, petugas, catatan opsional. | Menerima 20 penuh dan mengirim 10 kosong dari saldo 12 penuh/15 kosong menghasilkan 32 penuh/5 kosong; satu log penerimaan terbuat. |
| **FR-08** | MUST | Stok berubah otomatis lewat pasokan, penjualan/serah-terima, penerimaan tabung kosong, dan koreksi berizin. | Pembaruan saldo dan log bergerak sebagai satu operasi konsisten; kegagalan menyimpan salah satunya membatalkan seluruh perubahan. |
| **FR-09** | MUST | Sistem mencatat pertukaran tabung: penuh keluar dan kosong masuk sesuai jumlah aktual pada penjualan/serah-terima. | Penjualan 2 tabung penuh dan penerimaan 2 tabung kosong dari saldo 10/0 menghasilkan 8 penuh/2 kosong; jumlah kosong aktual tidak diasumsikan otomatis sama. |
| **FR-10** | SHOULD | Hanya admin bisa mengoreksi stok penuh/kosong dengan jumlah akhir atau selisih, disertai alasan wajib dan histori sebelum/sesudah. | Koreksi +2 atau -2 tervalidasi; saldo tidak negatif; tercatat admin, waktu dan alasan; karyawan ditolak. |
| **FR-11** | SHOULD | Admin/karyawan dapat melihat histori stok dan filter menurut produk, tanggal, jenis pergerakan, serta melihat detail sumber transaksi. | Pencarian menurut filter menampilkan pergerakan yang sesuai; tidak mengubah saldo. |
| **FR-12** | SHOULD | Admin menetapkan stok minimum per produk; sistem menandai bila stok tersedia untuk dipesan berada di bawah ambang tersebut. | Saat tersedia 4 dan ambang 5 muncul peringatan; saat tersedia 5 tidak muncul (aturan `tersedia < ambang`). |

**Rumus stok yang wajib konsisten:**

```text
stok_penuh_tersedia = stok_penuh_fisik - stok_penuh_dialokasikan
stok_penuh_fisik >= 0
stok_kosong_fisik >= 0
0 <= stok_penuh_dialokasikan <= stok_penuh_fisik
```

Transaksi stok yang memengaruhi `penuh_fisik`, `kosong_fisik`, atau `dialokasikan` harus menyimpan penyebab yang dapat ditelusuri. Tidak ada pengubahan saldo langsung yang menghapus sejarah. **Asumsi rancangan:** stok awal tiap produk dimasukkan sebagai aktivitas pembukaan saldo dengan log; cara mendapatkan angka pembukaan dikonfirmasi saat onboarding.

## 4.5 Katalog, pesanan, dan reservasi

| ID | Prioritas | Kebutuhan wajib | Penerimaan yang dapat diuji |
|---|---|---|---|
| **FR-13** | MUST | Pengecer aktif dapat melihat produk aktif, ukuran, harga berlaku, dan jumlah tabung penuh yang bisa dipesan. | Angka katalog adalah `penuh - dialokasikan`; tidak menampilkan tabung kosong sebagai stok jual. |
| **FR-14** | MUST | Pengecer bisa memilih satu atau beberapa produk, jumlah per produk, meninjau subtotal dan total, lalu mengajukan satu pesanan. | Form menolak jumlah nol, negatif, pecahan, dan produk nonaktif; ringkasan konsisten dengan harga saat pengajuan. |
| **FR-15** | MUST | Backend memeriksa stok tersedia saat pengajuan order dan kembali saat konfirmasi. | Order 7 saat tersedia 5 ditolak dengan informasi stok tidak cukup; tidak menyimpan order parsial. |
| **FR-16** | MUST | Order valid mendapat ID internal dan nomor order unik, waktu, pengecer pembuat, item, harga saat pengajuan, dan status awal `MENUNGGU_KONFIRMASI`. | Dua order memiliki nomor berbeda; refresh/retry tidak menggandakan order yang sama akibat klik ganda. |
| **FR-17** | MUST | Admin/karyawan dapat melihat antrean dan detail order, lalu mengonfirmasi atau menolak; penolakan wajib punya alasan. | Pengecer dapat melihat hasil dan alasan jika ditolak; konfirmasi hanya bisa jika stok benar-benar mencukupi. |
| **FR-18** | MUST | Pengecer bisa melihat status sekarang, waktu perubahan, nomor order, rincian, dan riwayat pesanan sendiri. | Perubahan status oleh petugas terlihat setelah reload halaman; akun lain tidak bisa melihatnya. |
| **FR-19** | MUST | Saat konfirmasi, sistem mengalokasikan kuantitas order dari stok tersedia tanpa mengurangi stok penuh fisik. | Fisik 10/alokasi 0; konfirmasi order 4 menghasilkan fisik 10/alokasi 4/tersedia 6. |
| **FR-20** | SHOULD | Jika order ditolak atau dibatalkan sebelum serah-terima, reservasi sebelumnya (jika ada) dibebaskan dan histori perubahan disimpan. | Order terkonfirmasi 4 dibatalkan menghasilkan alokasi berkurang 4 dan stok tersedia kembali bertambah 4; penjualan tidak terbentuk. |
| **FR-21** | MUST | Admin/karyawan menyelesaikan order setelah serah-terima aktual, mencatat jumlah tabung kosong diterima, lalu sistem membentuk penjualan **tepat satu kali**. | Order selesai memotong stok penuh fisik dan alokasi masing-masing sesuai kuantitas, menaikkan kosong aktual, membuat satu penjualan, dan penekanan tombol ulang tidak menduplikasi. |
| **FR-40** | MUST (tambahan 4B) | Karyawan berizin dapat mengonfirmasi dan menolak pesanan, termasuk melihat stok yang dibutuhkan untuk memutuskan, tetapi tidak mengubah produk atau mengoreksi stok. | Endpoint konfirmasi menerima karyawan; endpoint produk dan koreksi stok menolak role karyawan. |
| **FR-41** | SHOULD (pendukung) | Daftar pesanan mendukung pencarian nomor order dan filter tanggal, pengecer, dan status. | Order yang cocok ditampilkan, disusun terbaru dahulu; pencarian tidak mengubah status. |

### 4.5.1 State machine pesanan

| Status awal | Aksi dan aktor | Status akhir | Dampak pada stok/alur |
|---|---|---|---|
| — | Pengecer aktif mengajukan order valid | `MENUNGGU_KONFIRMASI` | Belum ada reservasi dan belum ada penjualan |
| `MENUNGGU_KONFIRMASI` | Admin/karyawan menyetujui | `DIKONFIRMASI` | Tambah reservasi sesuai item; stok fisik tidak berkurang |
| `MENUNGGU_KONFIRMASI` | Admin/karyawan menolak dengan alasan | `DITOLAK` | Tidak ada reservasi dan penjualan |
| `MENUNGGU_KONFIRMASI` atau `DIKONFIRMASI` | Admin/karyawan membatalkan dengan alasan | `DIBATALKAN` | Lepas reservasi jika sudah dikonfirmasi; tak ada penjualan |
| `DIKONFIRMASI` | Admin/karyawan mencatat serah-terima | `SELESAI` | Kurangi fisik penuh, lepas reservasi, catat kosong masuk, bentuk penjualan dan pembayaran/bon |
| `DITOLAK`, `DIBATALKAN`, atau `SELESAI` | Aksi status lain | Tidak berubah | Tolak perubahan tidak sah; jaga catatan historis |

**Aturan tambahan:** order yang menunggu konfirmasi tidak menjamin stok. Jika stok berubah sebelum disetujui, konfirmasi harus gagal dengan informasi stok terkini. Selesaikan pesanan hanya sekali dan dengan jumlah barang sesuai order. **Asumsi rancangan V1:** tidak ada serah-terima sebagian (*partial fulfillment*) dan pengecer tidak dapat membatalkan sendiri setelah mengajukan; pengecer dapat menghubungi pangkalan, lalu petugas membatalkan dengan alasan. Poin ini masuk daftar keputusan terbuka pada Bagian 9.

### 4.5.2 Alur utama pemesanan

1. Pengecer yang sudah disetujui login dan membuka katalog.
2. Sistem membaca stok tersedia (`penuh - dialokasikan`) per produk.
3. Pengecer membuat keranjang, mengecek ringkasan dan mengirim pesanan.
4. Backend memvalidasi akun, produk aktif, harga tersimpan, jumlah dan stok; membuat order `MENUNGGU_KONFIRMASI`.
5. Admin/karyawan melihat antrean dan memilih setujui/tolak.
6. Untuk **setujui**, backend mengecek ulang stok kemudian membuat alokasi secara atomik; untuk **tolak**, wajib alasan.
7. Saat barang sungguh diserahkan, petugas mencatat kosong yang kembali dan pembayaran, lalu menyelesaikan order.
8. Satu transaksi penjualan terbentuk, stok dan reservasi diperbarui, piutang terbuat bila pembayaran belum penuh.
9. Pengecer dapat melihat order, riwayat transaksi, dan sisa tagihannya sendiri.

## 4.6 Penjualan, bon, pembayaran, dan piutang

| ID | Prioritas | Kebutuhan wajib | Penerimaan yang dapat diuji |
|---|---|---|---|
| **FR-22** | MUST | Admin/karyawan mencatat penjualan langsung kepada pembeli yang tidak memiliki akun pengecer. | Penjualan tunai sah dapat disimpan tanpa `retailer_id`, menurunkan stok penuh dan menaikkan kosong yang benar-benar diterima; tidak meminta NIK/KTP. |
| **FR-23** | MUST | Setiap sale mencatat nomor transaksi, tanggal/waktu, produk, jumlah, harga saat transaksi, subtotal/total, asal (order/penjualan langsung), dan pengguna pencatat. | Harga yang kemudian diubah pada katalog tidak memengaruhi transaksi historis atau nilai bon terdahulu. |
| **FR-24** | MUST | Transaksi pengecer mendukung pembayaran **tunai** atau **bon**; pilihan bon dapat memuat pembayaran awal dan sisanya menjadi tagihan. | Tunai memerlukan pembayaran penuh; bon menerima pembayaran awal dari Rp0 hingga total dan membuat sisa tagihan yang benar. |
| **FR-25** | MUST | Bon terhubung ke satu sale dan satu pengecer, dengan jumlah awal, total bayar dan sisa tagihan. | Bon Rp200.000 dengan pembayaran awal Rp0 membentuk saldo Rp200.000 yang hanya muncul bagi pengecer terkait dan staf berizin. |
| **FR-26** | SHOULD | Admin/karyawan dapat mencatat pembayaran sebagian maupun pelunasan pada bon belum lunas dengan nominal dan tanggal, metode/catatan, serta petugas. | Pembayaran Rp50.000 dari saldo Rp200.000 menghasilkan sisa Rp150.000 dan riwayat satu pembayaran. |
| **FR-27** | MUST | Sisa piutang dihitung dari `total_sale - jumlah_pembayaran_berhasil` dan status otomatis diturunkan dari saldo. | Saldo tidak negatif; pembayaran melebihi sisa ditolak; saldo nol memberi status `LUNAS`. |
| **FR-28** | MUST | Admin dapat melihat semua piutang dan rincian pembayaran per pengecer dan per transaksi. | Admin dapat memfilter pengecer/status dan membandingkan total dengan sale serta payment; perubahan tidak menghilangkan histori. |
| **FR-29** | SHOULD | Pengecer melihat transaksi/bon sendiri: total, semua pembayaran yang dicatat, sisa, dan status. | Akun Pengecer A tidak dapat membuka data Pengecer B melalui UI atau API. |
| **FR-30** | SHOULD | Daftar transaksi/pembayaran memiliki filter tanggal, pengecer, status bayar, dan nomor transaksi. | Hasil filter sesuai kondisi dan mencakup transaksi lunas/belum lunas tanpa duplikasi. |
| **FR-39** | MUST (tambahan 2B) | Sistem mengizinkan pembayaran sebagian pada saat bon pertama dicatat maupun pembayaran susulan sampai lunas; semua pembayaran bersifat transaksi terpisah. | Bon total Rp200.000 dengan bayar awal Rp50.000 lalu Rp150.000 memiliki dua catatan pembayaran, total dibayar Rp200.000 dan saldo Rp0. |
| **FR-42** | MUST (pendukung) | Penjualan, pembayaran, dan pergerakan stok dilindungi dari pemrosesan ganda akibat klik berulang, refresh, atau retry jaringan. | Permintaan identik yang dikirim dua kali tidak membentuk dua sale/payment atau mengurangi stok dua kali. |

### 4.6.1 Aturan keuangan V1

1. **Penjualan langsung:** pembayaran tunai penuh saat transaksi; tidak membuat akun/tagihan pengecer.
2. **Penjualan pengecer — tunai:** nilai pembayaran sama dengan total sale; status `LUNAS`.
3. **Penjualan pengecer — bon:** pembayaran awal dapat `0 <= pembayaran_awal < total_sale`; selisih menjadi piutang. Jika pembayaran penuh, status `LUNAS` (tidak meninggalkan piutang aktif).
4. **Pembayaran susulan:** nominal harus `> 0` dan `<= saldo_saat_ini`; setiap pembayaran berhasil dicatat dengan pengguna dan waktu.
5. **Status bayar:** `BELUM_DIBAYAR` bila jumlah pembayaran 0 dan saldo >0; `DIBAYAR_SEBAGIAN` bila 0 < bayar < total; `LUNAS` bila saldo 0.
6. **Sumber kebenaran:** saldo dihitung dari sale dan pembayaran yang sah, bukan angka sisa yang bisa diedit manual.
7. **Tidak ada hapus diam-diam:** riwayat pembayaran tidak dihapus tanpa jejak. Mekanisme koreksi/void pembayaran salah input merupakan **pertanyaan terbuka**, bukan kemampuan yang boleh dibuat sembarang.
8. **Tidak ada konsinyasi:** penjualan bon bukan konsinyasi yang dihitung berdasarkan barang laku di pengecer.

### 4.6.2 Contoh perhitungan yang harus lulus

| Kondisi | Total sale | Pembayaran awal | Bayar susulan | Sisa | Status |
|---|---:|---:|---:|---:|---|
| Tunai pengecer | Rp200.000 | Rp200.000 | Rp0 | Rp0 | LUNAS |
| Bon belum dibayar | Rp200.000 | Rp0 | Rp0 | Rp200.000 | BELUM_DIBAYAR |
| Bon dibayar sebagian | Rp200.000 | Rp0 | Rp50.000 | Rp150.000 | DIBAYAR_SEBAGIAN |
| Bon dengan uang muka | Rp200.000 | Rp50.000 | Rp0 | Rp150.000 | DIBAYAR_SEBAGIAN |
| Bon lunas | Rp200.000 | Rp50.000 | Rp150.000 | Rp0 | LUNAS |

## 4.7 Dashboard, laporan, dan audit

| ID | Prioritas | Kebutuhan wajib | Penerimaan yang dapat diuji |
|---|---|---|---|
| **FR-31** | SHOULD | Dashboard admin menampilkan stok tersedia per produk/ringkasan, jumlah pesanan menunggu, total penjualan hari ini, dan total saldo piutang; gunakan zona waktu lokal pangkalan. | Setiap angka sesuai perhitungan data aktif pada tanggal lokal yang sama; semua kartu mempunyai label satuan dan waktu pembaruan. |
| **FR-32** | SHOULD | Admin melihat laporan penjualan berdasarkan rentang tanggal, produk, dan jenis transaksi (langsung/order; tunai/bon jika data ada). | Total pendapatan penjualan pada laporan adalah jumlah sale pada filter, bukan jumlah uang diterima; uang diterima ditandai terpisah. |
| **FR-33** | SHOULD | Admin melihat laporan pergerakan stok dengan saldo masuk, keluar, koreksi, dan referensi transaksi. | Laporan dapat menjelaskan perubahan saldo tiap produk dalam periode yang dipilih. |
| **FR-34** | MUST | Admin melihat laporan piutang per pengecer dengan total tagihan awal, pembayaran kumulatif, dan saldo berjalan. | Penjumlahan saldo tiap tagihan sama dengan total piutang dashboard; filter tidak mengubah perhitungan dasar. |
| **FR-35** | SHOULD | Simpan audit untuk perubahan akun, produk/harga, stok, status pesanan, sale, dan pembayaran: pelaku, waktu, aksi, entitas, ringkasan sebelum/sesudah yang relevan. | Admin dapat menelusuri aktor dan kronologi; karyawan/pengecer tidak dapat mengubah log audit. |
| **FR-43** | SHOULD (pendukung) | Laporan dan daftar memiliki keadaan *loading*, kosong dan gagal memuat yang jelas; data kosong menampilkan `0` atau pesan, bukan nilai salah. | Periode tanpa transaksi menampilkan total Rp0 dan pesan tidak ada data, tanpa error aplikasi. |
| **FR-44** | MUST (pendukung) | Seluruh tindakan yang mengubah stok/order/uang harus memberikan hasil sukses/gagal yang benar dan tidak membuat pengguna mengira tersimpan saat server gagal. | Putus jaringan sebelum konfirmasi backend menampilkan status belum pasti atau gagal; saat dibuka ulang hanya data yang benar-benar tercatat ditampilkan. |

## 4.8 Aturan bisnis lintas fitur (*business rules*)

| ID | Aturan yang berlaku di V1 | Sumber/status |
|---|---|---|
| BR-01 | Stok penuh dan kosong dihitung terpisah per ukuran produk. | Laporan; disetujui sebagai kebutuhan inti |
| BR-02 | Saldo hanya berubah karena peristiwa tercatat dan bisa diaudit. | Laporan; diwajibkan V1 |
| BR-03 | Order diajukan terlebih dahulu; belum merupakan penjualan. | Laporan; diwajibkan V1 |
| BR-04 | Reservasi stok terjadi **setelah** admin/karyawan menyetujui order; penolakan/pembatalan melepas alokasi. | Keputusan 3A + 4B |
| BR-05 | Penjualan hanya tercipta saat serah-terima diselesaikan, tepat satu kali. | Laporan; diwajibkan V1 |
| BR-06 | Bon terhubung dengan pengecer, sale, dan pembayaran; mendukung cicilan dan pelunasan. | Laporan + keputusan 2B |
| BR-07 | Pengecer hanya mengakses catatan miliknya, termasuk jika mengubah ID di URL/API. | Laporan; diwajibkan V1 |
| BR-08 | Tidak menyimpan NIK/KTP; proses MAP tetap eksternal. | Laporan; batas keras |
| BR-09 | Pengecer mendaftar sendiri dengan persetujuan admin **atau** didaftarkan oleh admin. | Keputusan 1C |
| BR-10 | Karyawan dapat konfirmasi/tolak, input pasokan, menyelesaikan pesanan, penjualan, dan pembayaran; hanya admin mengelola produk, koreksi stok dan akun. | Keputusan 4B + asumsi pembatasan pendukung |
| BR-11 | Tidak ada saldo stok penuh/ kosong negatif, alokasi tak boleh melebihi stok penuh, dan pembayaran tidak boleh melebihi saldo. | Penjabaran integritas sistem |
| BR-12 | V1 harus mencakup semua kebutuhan MUST dan SHOULD pada laporan, tetapi tidak mengaktifkan fitur COULD. | Keputusan 5A |

## 4.9 Skenario uji penerimaan (*acceptance tests*)

Daftar ini menjadi minimum UAT, bukan laporan hasil tes. Seluruh status awal **Belum diuji**.

| TC | Skenario / data uji | Hasil yang wajib terjadi | FR terkait |
|---|---|---|---|
| TC-01 | Admin aktif login dengan sandi benar; sandi salah | Login berhasil hanya untuk kredensial sah | 01–02 |
| TC-02 | Pengecer A membuka tagihan ID milik B | Akses ditolak dan detail B tidak bocor | 04, 29 |
| TC-03 | Stok LPG 3 kg = 12 penuh, 8 kosong | Angka disajikan terpisah | 06 |
| TC-04 | Awal 12 penuh/15 kosong; pasokan +20 penuh, -10 kosong | Akhir 32 penuh/5 kosong; log tersimpan | 07–08 |
| TC-05 | Stok tersedia 5; ajukan pesanan 7 | Ditolak dengan stok tidak cukup, tanpa order salah | 14–15 |
| TC-06 | Stok 10; pesan 4 | Order bernomor unik, status Menunggu Konfirmasi | 16 |
| TC-07 | Stok fisik 10/alokasi 0; konfirmasi 4 | Fisik 10, alokasi 4, tersedia 6 | 17, 19 |
| TC-08 | Order 3 ditolak dari stok tersedia 10 | Alasan tersimpan; stok tetap 10 | 17, 20 |
| TC-09 | Penjualan langsung 2 penuh, 2 kosong diterima; awal 10/0 | Akhir 8 penuh/2 kosong; sale sekali | 09, 22 |
| TC-10 | Bon Rp200.000 tanpa bayar | Piutang Rp200.000 pada pengecer yang benar | 24–25 |
| TC-11 | Bon Rp200.000; bayar Rp50.000 | Saldo Rp150.000, status Dibayar Sebagian | 26–27, 39 |
| TC-12 | Saldo Rp150.000; lunasi Rp150.000 | Saldo Rp0, status Lunas, histori tercatat | 26–27 |
| TC-13 | Selesaikan order sama dua kali | Tepat satu penjualan dan satu perubahan stok sah | 21, 42 |
| TC-14 | Sisa Rp100.000; bayar -Rp1 atau Rp120.000 | Ditolak dan saldo tetap Rp100.000 | 26–27 |
| TC-15 | Dua pengecer dengan beberapa bon/pembayaran | Laporan piutang menampilkan nilai/saldo benar per pengecer | 28, 34 |
| TC-16 | Pengecer daftar sendiri, belum disetujui, mencoba memesan | Pendaftaran tercatat, pesan ditolak sampai admin setuju | 36–37 |
| TC-17 | Admin membuat akun pengecer lalu aktifkan | Akun dapat login dan membuat pesanan | 03, 37 |
| TC-18 | Karyawan setujui order, lalu mencoba ubah harga/koreksi stok | Konfirmasi sukses; ubah harga dan koreksi ditolak backend | 05, 10, 40 |
| TC-19 | Fisik 10/alokasi 4; order 4 terkonfirmasi dibatalkan | Fisik 10/alokasi 0/tersedia 10; sale tak dibuat | 20 |
| TC-20 | Fisik 10/alokasi 4; order 4 selesai; kosong aktual 3 | Fisik 6/alokasi 0; kosong bertambah 3; sale sekali | 09, 21 |
| TC-21 | Bon Rp200.000, bayar awal Rp50.000, bayar akhir Rp150.000 | Dua payment, sisa Rp0, status Lunas | 39 |
| TC-22 | Dua petugas serentak mengonfirmasi order yang bersama-sama melebihi stok tersedia | Maksimal reservasi sebesar stok penuh; satu aksi gagal dengan pesan konflik/stok | 19, 42 |
| TC-23 | Admin koreksi stok dengan alasan; karyawan mencoba koreksi | Koreksi admin berhasil dan berjejak; karyawan ditolak | 10, 35 |
| TC-24 | Stok tersedia 4, ambang 5; kemudian tersedia 5 | Peringatan saat 4; tidak saat 5 | 12 |
| TC-25 | Filter laporan penjualan dan stok pada periode tertentu | Item dan total sesuai tanggal, produk dan jenis | 31–34 |
| TC-26 | Putus koneksi setelah menekan bayar; ulangi permintaan | Tidak ada pembayaran/sale ganda dan status ditampilkan sesuai backend | 42, 44 |
| TC-27 | Akun dinonaktifkan saat masih memiliki sesi | Tidak dapat mengakses operasi terlindungi; data historis utuh | 03, 38 |
| TC-28 | Form pembeli langsung atau pendaftaran mencoba menambahkan NIK/KTP | Tidak ada field atau penyimpanan NIK/KTP, termasuk di log | BR-08 |

# 5. Non-Goals (Out of Scope)

Batasan berikut berlaku untuk **V1**, meskipun sebagian mungkin relevan pada rilis lanjutan.

| ID | Tidak termasuk V1 | Alasan/pembatasan |
|---|---|---|
| NG-01 | Pengumpulan, validasi, unggah, atau penyimpanan NIK dan foto KTP | Proses identitas LPG 3 kg tetap dilakukan melalui mekanisme resmi MAP; jangan menambah kolom atau log yang memuat identitas tersebut |
| NG-02 | Integrasi API atau sinkronisasi otomatis dengan MAP/Pertamina | Tidak ada akses resmi/API yang disepakati; website bukan pengganti pelaporan pemerintah |
| NG-03 | Pengiriman/penerimaan pesan melalui WhatsApp API, bot, SMS atau email otomatis | Kanal WhatsApp pribadi tetap di luar sistem; V1 mengandalkan status order yang dicek melalui website |
| NG-04 | Payment gateway, kartu debit/kredit, virtual account otomatis, atau verifikasi transfer bank otomatis | Pembayaran dicatat manual oleh pengguna internal; sistem tidak memproses dana |
| NG-05 | Sensor/IoT, timbangan, atau kamera untuk menghitung tabung otomatis | Saldo berasal dari peristiwa yang dicatat pengguna dan koreksi beralasan |
| NG-06 | Marketplace publik multi-pangkalan, multi-penjual, atau pembelian konsumen langsung secara online | Fokus satu pangkalan dan hubungan dengan pengecer; pembeli datang dicatat petugas |
| NG-07 | Pengiriman, pelacakan kurir, optimasi rute, biaya ongkir otomatis, dan pelacakan lokasi | Alur sumber berfokus pada pemesanan dan serah-terima, belum mencakup sistem logistik |
| NG-08 | Akuntansi lengkap: jurnal umum, neraca, laba-rugi, pajak dan rekonsiliasi bank | Dashboard/laporan V1 hanya meliputi penjualan, stok, dan piutang operasional |
| NG-09 | Konsinyasi yang bergantung pada jumlah barang terjual di pengecer | Keputusan pembayaran 2B adalah bon/cicilan, bukan konsinyasi (2C) |
| NG-10 | Retur pasca-penjualan, penggantian barang rusak, pengembalian dana, nota kredit kompleks | Kebijakan belum dikonfirmasi. Pembatalan V1 hanya **sebelum** serah-terima selesai |
| NG-11 | Ekspor Excel/PDF, pengiriman laporan otomatis, dan pengingat jatuh tempo otomatis | Dalam laporan sumber merupakan opsi rilis berikutnya, bukan MUST/SHOULD V1 |
| NG-12 | Native Android/iOS app, mode offline penuh, dan sinkronisasi data setelah bekerja tanpa jaringan | V1 berjalan di browser dan membutuhkan internet; koneksi putus harus ditangani dengan aman |
| NG-13 | Harga berbeda untuk tiap pengecer, promosi/kupon, poin loyalitas, atau rekomendasi produk | Tidak disebutkan sebagai kebutuhan dari wawancara awal |
| NG-14 | Penghapusan permanen catatan transaksi/piutang untuk menyembunyikan kesalahan | Riwayat operasional harus terjaga; kebutuhan pembetulan formal perlu aturan terpisah |

**Penegasan batas ruang lingkup:** fitur *koreksi stok*, riwayat pergerakan, stok minimum, pembayaran sebagian, dashboard, laporan penjualan/stok/piutang, dan audit **tetap termasuk V1** karena pemesan memilih 5A, meskipun sebagian pada laporan diberi prioritas SHOULD.

# 6. Design Considerations

## 6.1 Prinsip antarmuka

1. **Mobile-first:** desain diutamakan untuk layar ponsel Android karena pemilik menggunakan Android dengan koneksi kuota. Semua aksi operasional utama tersedia tanpa perlu desktop.
2. **Bahasa sederhana:** gunakan label seperti *Stok Penuh*, *Stok Kosong*, *Dipesan*, *Menunggu Konfirmasi*, *Bon*, *Dibayar Sebagian*, *Lunas*. Hindari istilah internal database pada UI.
3. **Peran dipisahkan:** tampilkan menu menurut peran; menyembunyikan tombol tidak cukup untuk keamanan—backend wajib memeriksa izin.
4. **Konfirmasi tindakan berdampak:** persetujuan/penolakan order, penyelesaian penjualan, koreksi stok dan pembayaran harus menampilkan ringkasan sebelum pengguna menyimpan.
5. **Kejelasan angka:** setiap jumlah tabung menyertakan produk/ukuran dan satuan `tabung`; setiap nilai uang ditampilkan `Rp` dengan pemisah ribuan.
6. **Keterlacakan:** halaman detail penting menampilkan nomor referensi, status, tanggal/waktu, pelaku bila berizin, dan riwayat perubahan yang relevan.
7. **Aksesibilitas dasar:** fokus keyboard terlihat; label input jelas; pesan salah tidak hanya dibedakan dengan warna; tombol dan area sentuh nyaman pada ponsel; teks tetap dapat dibaca tanpa memperbesar halaman secara berlebihan.

## 6.2 Peta halaman V1

| Area/peran | Halaman minimum | Fungsi dan komponen kunci |
|---|---|---|
| Publik | Login; Daftar Pengecer | Form identitas usaha/kontak, username, sandi; tautan masuk; pesan menunggu persetujuan |
| Pengecer | Katalog | Daftar produk aktif, harga, stok tersedia untuk dipesan, pilih jumlah, keranjang/ringkasan |
| Pengecer | Pesanan Saya; Detail Pesanan | Nomor pesanan, status, tanggal, item, total, alasan penolakan, riwayat status |
| Pengecer | Transaksi dan Tagihan Saya | Nilai transaksi, pembayaran yang tercatat, status dan sisa bon; filter dasar |
| Pengecer | Profil | Data usaha/kontak, ubah kata sandi dan logout |
| Admin | Dashboard | Kartu stok tersedia, order menunggu, penjualan hari ini, total piutang, penanda stok minimum |
| Admin | Pengguna/Pengecer/Karyawan | Daftar akun, persetujuan registrasi, tambah/edit/nonaktifkan, status akun |
| Admin | Produk | Tambah/ubah/nonaktifkan, harga dan ambang minimum |
| Admin + Karyawan | Stok | Daftar penuh/kosong/reservasi, penerimaan pasokan, riwayat pergerakan; koreksi hanya admin |
| Admin + Karyawan | Pesanan Masuk | Filter/antrean, detail item, konfirmasi/tolak, pembatalan, penyelesaian dan serah-terima |
| Admin + Karyawan | Penjualan Langsung | Pilih produk/jumlah, input kosong kembali, total, pembayaran tunai, simpan |
| Admin + Karyawan | Pembayaran Bon | Cari tagihan sesuai izin, nominal diterima, riwayat pembayaran, sisa tagihan |
| Admin | Laporan Penjualan, Stok, Piutang | Filter periode/produk/pengecer, rekap angka, daftar rinci |
| Admin | Riwayat Audit | Filter tanggal, pelaku, tindakan, objek; tampilan baca-saja |

## 6.3 Detail interaksi dan keadaan UI

### A. Form registrasi pengecer

- Input minimum: nama penanggung jawab, nama usaha/pengecer, kontak, username, kata sandi dan konfirmasi kata sandi.
- Saat validasi gagal, tandai field terkait dan jelaskan apa yang harus diperbaiki.
- Saat berhasil, tampilkan: **"Pendaftaran berhasil. Akun menunggu persetujuan admin."** Jangan mengarahkan ke fitur pemesanan sebelum disetujui.
- Admin mendapat daftar akun *Menunggu Persetujuan* pada panel, bukan notifikasi WhatsApp otomatis.

### B. Katalog dan keranjang pengecer

- Setiap kartu produk menampilkan nama, ukuran, harga, dan `Tersedia: N tabung`.
- Jumlah yang dapat dipesan menggunakan stok **setelah dikurangi alokasi**. Jika stok 0, tombol tambah ke keranjang tidak bisa menghasilkan jumlah positif.
- Ringkasan menampilkan item, harga, kuantitas, subtotal dan total sebelum pengguna menekan *Ajukan Pesanan*.
- Setelah sukses tampilkan nomor order dan status **Menunggu Konfirmasi**, bukan "pembayaran berhasil" atau "barang pasti tersedia".

### C. Antrean order admin/karyawan

- Daftar menonjolkan order *Menunggu Konfirmasi*, lalu status lainnya dapat difilter.
- Halaman detail menampilkan stok tersedia terkini, item dan jumlah yang diajukan.
- Aksi **Konfirmasi** memunculkan ringkasan reservasi yang akan dibentuk. Aksi **Tolak** mewajibkan alasan.
- Jika stok habis selama proses konfirmasi, tampilkan pesan seperti **"Stok berubah. Muat ulang dan periksa jumlah tersedia sebelum mengonfirmasi."**
- Aksi *Selesaikan* hanya tersedia untuk order `DIKONFIRMASI`; petugas harus memasukkan jumlah kosong yang benar-benar diterima serta pembayaran/bon sebelum menyimpan.

### D. Form penjualan dan pembayaran

- Penjualan langsung tidak meminta identitas pembeli atau NIK/KTP.
- Tampilkan jumlah tabung penuh keluar dan tabung kosong masuk secara **terpisah**.
- Untuk order pengecer, petugas memilih **Tunai** atau **Bon** dan nominal diterima; tampilkan **Sisa Tagihan** secara langsung sebelum simpan.
- Saat membayar bon, tampilkan nilai awal, total dibayar, saldo sebelum, nominal pembayaran baru dan saldo sesudah; tombol simpan dinonaktifkan ketika nominal tidak valid.
- Setelah sukses tampilkan nomor referensi pembayaran. Jika koneksi terputus, jangan menyatakan uang sudah tercatat sebelum respons backend diverifikasi.

### E. Laporan dan dashboard

- Kartu ringkasan **Penjualan Hari Ini** dan **Total Piutang** diberi label berbeda karena omzet bukan uang kas yang sudah diterima.
- Jika filter tidak menghasilkan data, tampilkan keadaan kosong yang informatif dan angka 0 yang sesuai.
- Peringatan stok minimum menggunakan teks dan indikator, bukan warna saja.

## 6.4 Rancangan visual dan mockup

Laporan sumber menyertakan diagram use case, user flow, arsitektur dan sequence diagram tingkat tinggi, **bukan desain layar final**. Karena belum ada tautan mockup UI yang disepakati, developer tidak boleh menganggap pilihan warna, posisi tombol, ikon, dan tipografi sebagai ketentuan dari mitra. Wireframe dapat dirancang setelah pemilik menyetujui peta halaman dan istilah UI. Prioritaskan kinerja, formulir ringkas, keterbacaan, dan ketepatan status daripada animasi.

## 6.5 Contoh pesan sistem

| Situasi | Contoh pesan bagi pengguna |
|---|---|
| Registrasi mandiri selesai | `Pendaftaran diterima. Tunggu persetujuan admin sebelum memesan.` |
| Akun belum disetujui | `Akun belum aktif. Hubungi admin pangkalan untuk informasi persetujuan.` |
| Stok kurang | `Jumlah pesanan melebihi stok yang tersedia. Tersedia: 5 tabung.` |
| Order berhasil diajukan | `Pesanan berhasil diajukan: ORD-... Menunggu konfirmasi.` |
| Order ditolak | `Pesanan ditolak. Alasan: [alasan petugas].` |
| Pembayaran melebihi sisa | `Nominal pembayaran tidak boleh melebihi sisa tagihan Rp150.000.` |
| Simpan gagal atau jaringan terputus | `Belum dapat memastikan transaksi tersimpan. Periksa riwayat sebelum mencoba lagi.` |
| Perubahan tak diizinkan | `Anda tidak memiliki izin untuk tindakan ini.` |

# 7. Technical Considerations

> Bagian ini berisi batasan, model konsep, dan saran kontrak antarlapisan untuk membantu developer junior. Ini **bukan kode implementasi**, skema SQL final, maupun keputusan detail framework yang tak dapat diubah.

## 7.1 Arsitektur yang disarankan dari laporan

```text
[Ponsel/Browser pengguna]
          |
          | HTTPS
          v
   [Frontend Vue.js]
          |
          | REST API / JSON melalui HTTPS
          v
 [Backend Express.js / Node.js]
    | autentikasi/otorisasi
    | validasi dan aturan bisnis
    | transaksi stok/order/pembayaran
          |
          | akses database sisi server
          v
   [PostgreSQL / Supabase]

[MAP resmi]     [WhatsApp pribadi]
   TERPISAH         TERPISAH
```

- **Frontend:** halaman, pengisian data, status loading/gagal, dan pemanggilan API; tidak menjadi sumber kebenaran saldo atau izin.
- **Backend:** satu-satunya lapisan yang mengesahkan stok tersedia, perubahan status, penjualan, pembayaran, autentikasi dan akses data. Jangan mengandalkan perhitungan frontend untuk keputusan final.
- **Database:** PostgreSQL terkelola melalui Supabase menyimpan relasi dan transaksi; koneksi database hanya dari backend menggunakan rahasia server.
- **Eksternal:** WhatsApp dan MAP tidak terintegrasi, tidak menjadi pemanggil API, dan tidak ikut proses transaksi internal.

## 7.2 Model data konseptual

| Tabel konseptual | Atribut minimum/relasi utama | Aturan penting |
|---|---|---|
| `users` | `id`, `username` unik, `password_hash`, `role`, `name`, `status`, `created_at`, `updated_at` | Role hanya admin/karyawan/pengecer; hash aman; akun nonaktif tak dapat mengakses API |
| `retailers` | `id`, `user_id` (unik), `business_name`, `contact`, `approval_status`, `approved_by`, `approved_at` | Hanya akun pengecer aktif dapat order; riwayat tetap ada setelah nonaktif |
| `products` | `id`, `name`, `size_or_type`, `price_idr`, `is_active`, `stock_minimum` | Harga nonnegatif; ukuran tidak tercampur; produk lama tidak dihapus jika punya transaksi |
| `inventory_balances` | `product_id` unik, `full_qty`, `empty_qty`, `reserved_qty`, `updated_at` | Bilangan bulat nonnegatif, `reserved_qty <= full_qty` |
| `stock_movements` | `id`, `product_id`, `source_type`, `source_id`, `full_delta`, `empty_delta`, `reserved_delta`, `reason`, `actor_id`, `created_at` | Riwayat perubahan dan referensi sumber; tidak menimpa entri lama tanpa jejak |
| `stock_receipts` + `stock_receipt_items` | `id`, waktu, actor; per item produk, penuh masuk, kosong keluar | Dapat diringkas dalam stock_movements; jangan memproses dua kali |
| `orders` | `id`, `order_number` unik, `retailer_id`, `status`, `created_at`, `confirmed_at`, `completed_at`, `rejection_reason`, `cancellation_reason` | Relasi ke pengecer; status mengikuti tabel transisi |
| `order_items` | `id`, `order_id`, `product_id`, `qty`, `unit_price_snapshot`, `subtotal` | Snapshot harga saat order; bilangan bulat positif |
| `sales` | `id`, `sale_number` unik, `order_id` nullable/unik, `retailer_id` nullable, `sale_type`, `total`, `payment_status`, `created_by`, `created_at` | `order_id` unik mencegah penjualan ganda dari satu order; pembeli langsung tidak perlu retailer |
| `sale_items` | `id`, `sale_id`, `product_id`, `qty`, `unit_price_snapshot`, `subtotal`, `empty_received_qty` | Harga tetap historis; item merekam kuantitas barang yang diserahkan |
| `payments` | `id`, `sale_id`, `amount`, `payment_method`, `paid_at`, `recorded_by`, `reference_key`, `notes` | Nominal positif; satu payment tidak boleh diproses ganda; perlu jejak jika dikoreksi |
| `order_status_history` | `order_id`, `from_status`, `to_status`, `actor_id`, `changed_at`, `reason` | Mendukung detail perjalanan order dan audit |
| `audit_logs` | `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_summary`, `after_summary`, `created_at` | Hanya baca oleh admin, tidak memuat sandi/NIK/KTP/token |

**Catatan model:** Nama tabel dan atribut adalah **proposal** dari entitas konseptual laporan, ditambah kebutuhan keputusan registrasi mandiri dan histori status. Struktur fisik final boleh berbeda bila perilaku, relasi, integritas, dan keterlacakan tetap sama.

### 7.2.1 Relasi dan constraint yang disarankan

- Satu `user` dengan role pengecer terhubung ke paling banyak satu profil `retailer`; tiap `retailer` memiliki banyak `orders`, `sales` dan bon.
- Satu `order` memiliki satu atau banyak `order_items`, lalu menghasilkan **maksimal satu** `sale` setelah selesai.
- Satu `sale` memiliki satu atau banyak `sale_items` dan nol atau banyak `payments`.
- Satu `product` mempunyai satu baris saldo stok dan banyak pergerakan stok.
- Terapkan *foreign key*, *unique constraint* pada nomor order/transaksi, dan *check constraint* yang sesuai untuk jumlah, harga, serta status.
- Jangan menggunakan `FLOAT` untuk nominal uang; gunakan tipe numerik presisi atau integer Rupiah dengan kebijakan pembulatan yang konsisten. Untuk harga LPG pada V1, integer Rupiah cukup jika tidak ada pecahan.
- Indeks pencarian dianjurkan pada `(retailer_id, created_at)` pesanan, `(status, created_at)` pesanan, tanggal transaksi, dan relasi piutang; sesuaikan setelah ukuran data diketahui.

## 7.3 Konsistensi dan transaksi data

**Operasi kritis wajib berlangsung secara atomik (seluruhnya berhasil atau seluruhnya batal):**

1. **Persetujuan order:** baca saldo stok terkini dengan mekanisme penguncian/transaksi yang aman, validasi seluruh item, ubah status, tambah alokasi, catat histori dan audit.
2. **Penolakan/pembatalan:** periksa state saat ini, ubah status, kurangi alokasi bila ada, catat alasan dan histori.
3. **Penyelesaian order:** cek state `DIKONFIRMASI`; buat sale dan sale items; kurangi stok fisik penuh dan alokasi; tambahkan tabung kosong aktual; buat pembayaran/bon sesuai input; ubah status `SELESAI`; tulis seluruh log. Tidak boleh menghasilkan sale ganda.
4. **Penjualan langsung:** validasi saldo tersedia dan kuantitas, kurangi penuh, tambah kosong aktual, tulis sale, pembayaran tunai dan log dalam satu transaksi.
5. **Pembayaran piutang:** periksa saldo terkini (dari sale + payments), pastikan nominal tak melebihi saldo, tambah payment, perbarui status turunan/denormalisasi jika dipakai, tulis audit.
6. **Koreksi stok:** hanya admin, lakukan penyesuaian dan log dalam satu transaksi; tidak boleh membuat `reserved > full` atau saldo negatif.

**Permintaan paralel:** dua petugas mengonfirmasi dua order yang bersaing tidak boleh memesan stok yang sama. Hindari pola baca stok di awal lalu memperbarui tanpa penguncian pada akhir. Gunakan transaksi database dan strategi concurrency yang diuji.

**Idempotensi:** pengiriman ulang akibat klik dua kali atau koneksi putus tidak boleh membuat dua sale/payment. Disarankan idempotency key per operasi tulis atau *unique constraint* terhadap referensi bisnis, disertai respons konsisten ketika request yang sama diulang. Untuk `sale` dari order, `order_id` harus unik; untuk payment, butuh `reference_key` atau kunci request yang stabil.

**Jika terjadi kegagalan:** jangan membuat sukses palsu di UI; lakukan baca ulang detail transaksi sebelum pengguna menekan kirim lagi. Error harus dibedakan antara *validasi gagal*, *akses ditolak*, *konflik stok/status*, dan *kesalahan server/jaringan*.

## 7.4 Kontrak API tingkat tinggi (contoh, bukan implementasi final)

Semua endpoint di bawah berbasis JSON/HTTPS dan harus mengembalikan kode status serta pesan yang jelas. Path final dapat diubah saat desain API.

| Method & endpoint konseptual | Aktor | Tanggung jawab |
|---|---|---|
| `POST /auth/login`; `POST /auth/logout` | Semua akun | Mulai/akhiri sesi |
| `POST /retailer-registrations` | Publik | Registrasi pengecer berstatus pending |
| `GET /retailers/pending`; `PATCH /retailers/{id}/approval` | Admin | Lihat/setujui/tolak pendaftaran |
| `POST /retailers`; `PATCH /retailers/{id}` | Admin | Buat/ubah/nonaktifkan pengecer |
| `POST /staff`; `PATCH /staff/{id}` | Admin | Mengelola akun karyawan |
| `GET /products`; `POST /products`; `PATCH /products/{id}` | Read: akun berizin; write: admin | Katalog, pengaturan produk dan harga |
| `GET /inventory`; `GET /stock-movements` | Admin/karyawan | Saldo dan histori penuh/kosong |
| `POST /stock-receipts` | Admin/karyawan | Mencatat pasokan agen |
| `POST /stock-adjustments` | Admin | Koreksi beralasan |
| `POST /orders`; `GET /orders/my` | Pengecer | Ajukan dan pantau pesanan sendiri |
| `GET /orders`; `POST /orders/{id}/confirm` | Admin/karyawan | Antrean dan konfirmasi secara atomik |
| `POST /orders/{id}/reject`; `POST /orders/{id}/cancel` | Admin/karyawan | Tolak/batalkan beserta alasan |
| `POST /orders/{id}/complete` | Admin/karyawan | Serah-terima dan pembentukan sale sekali |
| `POST /sales/direct` | Admin/karyawan | Penjualan langsung tunai |
| `GET /sales`; `GET /receivables` | Admin (laporan); karyawan sesuai kebutuhan operasional | Data transaksi dan tagihan yang diizinkan |
| `POST /sales/{id}/payments` | Admin/karyawan | Catat cicilan/pelunasan |
| `GET /my/transactions`; `GET /my/receivables` | Pengecer | Transaksi dan bon milik akun login |
| `GET /dashboard`; `GET /reports/...`; `GET /audit-logs` | Admin | Ringkasan, laporan, dan histori audit |

**Penting:** pengecer tidak mengirim `retailer_id` sembarang sebagai sumber kepemilikan; backend harus menentukan identitas pengecer dari sesi login. Untuk resource milik pihak lain, backend harus menolak permintaan walaupun klien menyertakan ID yang valid. Respons sebaiknya memuat `request_id`/nomor referensi untuk membantu penelusuran error tanpa mengekspos data sensitif.

## 7.5 Non-functional requirements (NFR)

Persyaratan berikut mengadaptasi NFR-01 sampai NFR-14 dari laporan, dengan penerimaan pengujian agar dapat ditindaklanjuti. Target angka adalah **target rancangan**, belum hasil pengukuran aplikasi.

| ID | Kualitas | Kebutuhan/kriteria penerimaan |
|---|---|---|
| **NFR-01** | Usability | Seluruh istilah dan pesan operasional berbahasa Indonesia yang mudah dipahami; uji pengguna dapat menyelesaikan pemesanan, pasokan dan bayar bon tanpa penjelasan teknis database. |
| **NFR-02** | Mobile-first | Katalog, order, stok, penjualan, dan pembayaran usable pada viewport ponsel Android modern (mis. 360–430 px); tidak ada tabel/form utama yang terpotong tanpa cara navigasi. |
| **NFR-03** | Autentikasi | Password disimpan dengan algoritme hash password yang layak (mis. Argon2id atau bcrypt berkonfigurasi aman), bukan plaintext; sesi/token memiliki kedaluwarsa, logout, dan proteksi terhadap penyalahgunaan. |
| **NFR-04** | Otorisasi | Cek role dan kepemilikan data **pada setiap endpoint**; percobaan mengganti ID URL/API tidak dapat membuka data pengecer lain. |
| **NFR-05** | Privasi | Simpan identitas dan kontak minimum untuk operasi; tidak ada NIK/KTP pada form, database, payload, analytics atau log; batasi paparan kontak. |
| **NFR-06** | Integritas | Pergantian stok, reservasi, penyelesaian order dan pembayaran menggunakan database transaction; validasi saldo dan konflik serentak. |
| **NFR-07** | Validasi | Kuantitas unit harus integer positif, delta koreksi sesuai aturan, saldo tak negatif, harga nonnegatif dan pembayaran dalam rentang 0–sisa sesuai konteks. Validasi server wajib. |
| **NFR-08** | Performa | Target awal halaman operasional umum merespons sekitar **3 detik atau lebih cepat** pada jaringan normal dan volume data uji wajar; lakukan uji sesuai profil jaringan/perangkat yang didokumentasikan. |
| **NFR-09** | Jaringan tidak stabil | Kegagalan jaringan menampilkan pesan dapat dipahami; tidak menganggap transaksi sukses tanpa konfirmasi; retry tidak menduplikasi transaksi. |
| **NFR-10** | Backup & pemulihan | Tetapkan jadwal pencadangan sesuai paket PostgreSQL/Supabase, prosedur restore, dan uji restore sebelum rilis. Frekuensi dan target pemulihan final ditetapkan bersama pemilik/hosting. |
| **NFR-11** | Auditabilitas | Catatan perubahan kritis memiliki pelaku/waktu; histori uang dan stok tidak dapat dihapus tanpa jejak. |
| **NFR-12** | Maintainability | Frontend, backend, dan data dipisahkan; endpoint, aturan bisnis, error, dan alur perubahan status didokumentasikan dan diuji. |
| **NFR-13** | Konfigurasi aman | Secret/kredensial database dan token signing hanya di environment/config server; jangan berada di bundle frontend atau repo publik. Gunakan HTTPS produksi. |
| **NFR-14** | Kompatibilitas | Uji di browser modern Android dan desktop yang digunakan mitra; periksa tampilan utama, input form, format tanggal/IDR dan status. |

### 7.5.1 Aturan keamanan minimum tambahan

- Gunakan akun database dengan izin minimum yang diperlukan backend. Jika Supabase menyediakan mekanisme keamanan tambahan, konfigurasikan konsisten dengan arsitektur backend-only.
- Pembatasan percobaan login/registrasi (*rate limiting*) dan pemantauan penyalahgunaan menjadi pertimbangan implementasi keamanan; jangan mengizinkan enumerasi akun melalui pesan error.
- Jangan mencatat password, token, data kartu pembayaran, NIK, KTP, atau informasi rahasia di audit log.
- Data historis order, sale, dan payment harus tetap terhubung walaupun produk atau akun dinonaktifkan.
- Tampilan format lokal gunakan **Asia/Jakarta** untuk pengguna pangkalan; waktu tersimpan disarankan menggunakan timestamp yang tidak ambigu lalu dikonversi ke zona lokal.

## 7.6 Pengujian dan ketergantungan pengembangan

| Tahap validasi | Fokus | Persyaratan kelulusan minimum |
|---|---|---|
| Unit test aturan bisnis | Rumus stok, status order, saldo bon, validasi numerik | Semua kasus normal dan batas lulus |
| Integration/API test | Auth/role/ownership, relasi data, transaksi database | Tidak ada write parsial atau akses tidak sah |
| Concurrency & retry test | Dua order serentak, klik dua kali, jaringan terputus | Tidak ada overselling, duplikasi sale, duplikasi payment |
| UAT berbasis TC-01–TC-28 | Alur pemilik, karyawan, pengecer, laporan | Semua TC wajib lulus; hasil aktual dan bukti tes dicatat saat implementasi |
| UI/perangkat | Android browser dan desktop; layar kecil dan jaringan normal | Alur utama dapat digunakan, label/angka benar, error terjelaskan |
| Security check | Password, secret, endpoint admin, akses data lintas pengecer | Tidak ada kebocoran atau bypass role |
| Backup/restore dry run | Database dan catatan piutang | Data dapat dipulihkan sesuai prosedur yang didokumentasikan |

**Dependensi yang perlu tersedia sebelum development dimulai:** akses lingkungan dev database/hosting yang sah, data produk dan harga awal (boleh dummy dahulu), daftar peran internal, data uji stok, contoh skenario bon, serta kesepakatan terkait pertanyaan berisiko tinggi pada Bagian 9. Tanggal rilis, ukuran tim, dan volume produksi belum ditetapkan dalam laporan.

# 8. Success Metrics

## 8.1 Metrik kelulusan produk V1

| Metrik | Definisi dan cara ukur | Target awal | Status baseline |
|---|---|---|---|
| SM-01 — Ketepatan stok | Persentase skenario UAT stok dengan hasil saldo penuh, kosong, alokasi, dan histori benar | **100%** pada skenario wajib | Belum diukur |
| SM-02 — Reservasi valid | Jumlah kasus terkonfirmasi dengan alokasi > fisik, termasuk pada uji paralel | **0 kasus** | Belum diukur |
| SM-03 — Ketepatan bon | Persentase skenario bayar awal, sebagian, pelunasan, dan batas nominal yang saldonya tepat | **100%** pada skenario wajib | Belum diukur |
| SM-04 — Anti-duplikasi | Jumlah sale/payment ganda akibat retry atau dua kali klik dalam skenario uji | **0 kasus** | Belum diukur |
| SM-05 — Hak akses | Persentase uji akses role/ownership yang ditolak dengan benar | **100%** pada skenario wajib | Belum diukur |
| SM-06 — Kelengkapan order | Persentase pesanan uji valid yang memiliki nomor unik, identitas pengecer, timestamp dan status | **100%** | Belum diukur |
| SM-07 — Kecocokan laporan | Persentase total laporan/dashboard contoh yang sama dengan rekonsiliasi transaksi sumber | **100%** pada data uji | Belum diukur |
| SM-08 — Mobile usability | Persentase alur utama UAT yang dapat diselesaikan dari Android browser tanpa masalah pemblokir | **100%** alur kritis | Belum diukur |
| SM-09 — Respons halaman | Durasi pemuatan/respons halaman operasional pada jaringan normal dan data uji representatif | Sasaran **sekitar 3 detik atau kurang** sesuai NFR-08; metode uji didokumentasikan | Belum diukur |
| SM-10 — UAT keseluruhan | Jumlah skenario kritis yang lulus dari TC-01–TC-28 | **28/28 lulus** sebelum diterima | Belum diuji |

**Perhatian:** target kualitas ini adalah *acceptance criteria* yang diusulkan untuk evaluasi sistem, bukan klaim bahwa produk sudah dibangun, sudah diuji, atau sudah berhasil dipakai mitra.

## 8.2 Metrik dampak pasca-uji coba (belum memiliki baseline)

Setelah sistem benar-benar dipakai dan pemilik bersedia mengukur, bandingkan sebelum/sesudah pada periode yang setara:

1. **Selisih stok:** jumlah dan besaran selisih antara stok fisik dan saldo sistem per minggu.
2. **Waktu penanganan pesanan:** median waktu dari order diajukan sampai dikonfirmasi/ditolak.
3. **Pesanan yang terlewat:** jumlah pesanan yang tidak pernah diproses pada periode tertentu.
4. **Akurasi bon:** jumlah koreksi/sengketa nominal piutang dan lamanya menemukan catatan pembayaran.
5. **Adopsi pengguna:** persentase pengecer terdaftar aktif dan persentase penjualan yang dicatat pada hari transaksi.
6. **Kelengkapan pencatatan:** persentase penjualan langsung, serah-terima order, dan pasokan yang memiliki catatan hari yang sama.

Belum tepat menetapkan janji seperti "turun 50%" atau "naik 10%" tanpa data dasar dari mitra. Tetapkan angka keberhasilan bisnis setelah **baseline 2–4 minggu** dan volume transaksi nyata diketahui; durasi baseline ini merupakan usulan pengukuran, bukan data wawancara.

## 8.3 Instrumen evaluasi yang disarankan

- **UAT:** gunakan TC-01–TC-28; rekam penguji, tanggal, masukan, hasil aktual, status dan bukti.
- **Rekonsiliasi:** bandingkan saldo stok fisik dengan saldo sistem serta total piutang dengan jumlah bon dikurangi pembayaran.
- **Log operasional:** hitung timestamp order, konfirmasi, selesai, dan pembayaran untuk metrik kecepatan proses; gunakan data agregat tanpa membuka data pribadi pengecer yang tidak perlu.
- **Wawancara ulang:** minta pemilik dan setidaknya sebagian pengecer mencoba tugas nyata lalu mencatat titik membingungkan pada ponsel.

# 9. Open Questions

**Keputusan yang sudah final dan tidak perlu ditanyakan lagi:** registrasi pengecer dua jalur (1C); bon dan pembayaran sebagian (2B); stok dialokasikan setelah konfirmasi (3A); karyawan boleh konfirmasi/tolak tetapi tidak kelola produk/koreksi stok (4B); semua MUST + SHOULD ada di V1 (5A).

Hal-hal berikut **belum didukung cukup detail oleh laporan dan jawaban pengguna**. Pengisian kolom 'Asumsi sementara' hanya untuk memperjelas rancangan kerja, bukan mengklaim keputusan mitra.

| ID | Pertanyaan yang harus diputuskan | Asumsi sementara PRD | Risiko / pemilik keputusan |
|---|---|---|---|
| OQ-01 — Tinggi | Bagaimana aturan tabung kosong saat penjualan setiap ukuran: harus tukar 1:1, boleh tidak membawa kosong, atau ada biaya/aturan tambahan? | Catat kosong aktual; tidak otomatis 1:1 | Salah stok dan aturan penjualan; **pemilik pangkalan** |
| OQ-02 — Tinggi | Apakah pesanan yang dikonfirmasi mempunyai batas waktu pengambilan atau bisa menggantung? | Tidak ada auto-expiry pada V1; pembatalan manual petugas | Alokasi stok tertahan terlalu lama; **pemilik** |
| OQ-03 — Tinggi | Jika jumlah serah-terima berbeda dari order, apakah harus ubah order, batalkan dan pesan ulang, atau dukung penyerahan sebagian? | V1 menyelesaikan hanya jumlah sesuai order | Operasi tak tertampung saat stok berubah; **pemilik + tim** |
| OQ-04 — Tinggi | Siapa yang boleh membatalkan order terkonfirmasi dan apakah pengecer boleh meminta pembatalan melalui sistem? | Admin/karyawan dapat membatalkan sebelum selesai dengan alasan; pengecer menghubungi pangkalan di luar aplikasi | Potensi sengketa reservasi dan pengalaman pengecer; **pemilik** |
| OQ-05 — Tinggi | Apa prosedur pembetulan jika salah input pembayaran, bon, atau penjualan yang **sudah selesai**? | Jangan edit/hapus transaksi diam-diam; koreksi formal belum ditetapkan | Integritas dan audit keuangan; **pemilik + tim** |
| OQ-06 — Tinggi | Adakah aturan batas kuota, harga jual, syarat pembelian, dan pembuktian untuk LPG 3 kg yang memengaruhi operasional internal website? | Tidak menyimpan NIK/KTP dan MAP tetap terpisah; tanpa logika kuota yang belum disepakati | Risiko ketidakpatuhan jika aturan produk disalahartikan; **pemilik/pihak berwenang** |
| OQ-07 — Sedang | Apakah setiap pengecer memiliki tanggal jatuh tempo bon, batas kredit, atau larangan order jika tunggakan tinggi? | V1 mencatat saldo dan status, tanpa penolakan berdasarkan plafon kredit atau pengingat jatuh tempo | Kebijakan bon tidak mencerminkan praktik nyata; **pemilik** |
| OQ-08 — Sedang | Bagaimana mengatasi uang diterima karyawan dan setoran ke pemilik: perlu otorisasi atau rekonsiliasi kas tersendiri? | Karyawan bisa input pembayaran; semua dicatat atas nama pelaku | Potensi selisih kas/penagihan; **pemilik** |
| OQ-09 — Sedang | Seberapa jauh karyawan boleh menelusuri seluruh piutang, selain detail yang diperlukan untuk menerima pembayaran? | Karyawan dapat membuka detail bon untuk transaksi operasional; laporan keseluruhan khusus admin | Paparan informasi keuangan berlebihan; **pemilik** |
| OQ-10 — Sedang | Bagaimana proses stok awal (stock opname pertama) dan siapa yang memverifikasi fisik penuh/kosong? | Admin memasukkan saldo pembukaan berlog untuk setiap produk | Kesalahan saldo hari pertama; **pemilik** |
| OQ-11 — Sedang | Apakah produk berukuran 3 kg, 5,5 kg, 12 kg cukup sebagai daftar awal dan apakah pembelian tabung baru (tanpa pertukaran) diizinkan? | Satu katalog per ukuran/jenis, stok penuh/kosong per produk | Ketidaksesuaian variasi penjualan; **pemilik** |
| OQ-12 — Sedang | Apakah nomor kontak pengecer cukup tanpa verifikasi OTP, dan bagaimana pemulihan kata sandi pengguna mandiri? | Verifikasi akun dilakukan manual oleh admin; pemulihan akun melalui admin, tanpa SMS/email otomatis | Potensi akun tidak terverifikasi dan beban dukungan; **pemilik + tim** |
| OQ-13 — Sedang | Berapa batas ukuran dataset, beban pengguna bersamaan, perangkat/browser target, serta anggaran Supabase/hosting? | Pengujian memakai dataset wajar dan Android browser modern; target waktu respons ~3 detik | Skalabilitas dan biaya; **tim teknis + pemilik** |
| OQ-14 — Sedang | Frekuensi backup, retensi data, dan target pemulihan saat database bermasalah? | Ikuti kemampuan paket hosting, lakukan simulasi restore sebelum rilis | Risiko hilangnya piutang dan downtime; **tim teknis + pemilik** |
| OQ-15 — Rendah | Desain visual, nama/branding website, logo, format nomor pesanan, dan detail navigasi akhir? | Gunakan label bahasa Indonesia, nomor unik dan tata letak mobile-first | Tidak menghambat logika inti; **pemilik + perancang** |
| OQ-16 — Rendah | Apakah tanggal pasokan Rabu/Sabtu perlu ditampilkan sebagai informasi jadwal? | Jadwal hanya konteks operasional, bukan fitur kalender/pengingat V1 | Ekspektasi fitur tambahan; **pemilik** |

## 9.1 Urutan validasi sebelum pengembangan

1. **Konfirmasi aturan serah-terima dan pertukaran tabung** (OQ-01 s.d. OQ-04), terutama transaksi tanpa kosong dan pembatalan stok yang sudah dialokasikan.
2. **Konfirmasi kebijakan keuangan dan koreksi transaksi** (OQ-05, OQ-07, OQ-08, OQ-09) agar data bon dapat dipertanggungjawabkan.
3. **Validasi kesesuaian operasi dengan peraturan LPG 3 kg dan penggunaan MAP** (OQ-06); tidak ada fitur yang boleh mengklaim menggantikan proses resmi.
4. **Siapkan data awal, mekanisme akun, dan lingkungan uji** (OQ-10 s.d. OQ-14), kemudian finalisasi mockup (OQ-15).
5. Setelah keputusan disepakati, perbarui asumsi di PRD dan test case terkait **sebelum** mulai implementasi.

---

**Penutup:** PRD ini merupakan spesifikasi kebutuhan **versi pertama**, disusun dari laporan analisis kebutuhan yang dilampirkan dan lima pilihan klarifikasi pengguna. Bagian yang belum terkonfirmasi ditampilkan sebagai risiko/pertanyaan terbuka. Tidak ada implementasi aplikasi, migrasi database, atau pengujian nyata yang dilakukan sebagai bagian dari penyusunan dokumen ini.
