# Verifikasi backend

Tanggal: 29 Oktober 2026. Lingkungan: Windows x64, Node.js 24.18.0, Nuxt 4.6.2. Ini hasil pengujian backend, **bukan hasil UAT pengguna atau pengujian antarmuka**.

| Pemeriksaan | Hasil |
|---|---|
| TypeScript (`npm run typecheck`) | Lulus |
| Build produksi (`npm run build`) | Lulus |
| HTTP API + PostgreSQL 18.4 multi-koneksi | 18 tes lulus, tanpa skip |
| HTTP API + PGlite, `npm test` default | 16 tes lulus; 2 tes multi-koneksi dilewati sesuai desain |
| Migrasi dijalankan dua kali | Tidak membuat ulang schema/tabel yang sudah dimigrasi |
| Seed dijalankan dua kali | Satu admin dan tiga produk, tanpa duplikasi/reset sandi |
| Smoke test `.output/server/index.mjs` | Health dengan DB, login admin, katalog terautentikasi lulus |

Tes PostgreSQL memakai server portabel sementara yang hanya mendengarkan loopback, schema uji acak, dan dihentikan setelah pengujian. PostgreSQL tidak diinstal sebagai layanan sistem. Untuk mereproduksi pada PostgreSQL lokal/CI, atur `TEST_DATABASE_URL` lalu jalankan `npm test`, seperti dijelaskan di README.

## Cakupan terhadap PRD

| TC PRD | Pemeriksaan otomatis backend |
|---|---|
| 01 | Login benar/salah, logout, kedaluwarsa sesi |
| 02 | Detail order/sale/bon akun lain menghasilkan 404 |
| 03–04 | Saldo penuh/kosong terpisah, pasokan dan kosong ke agen, rollback |
| 05–07 | Jumlah tidak sah/berlebih ditolak, order pending tanpa reservasi, konfirmasi menambah reserved |
| 08 | Penolakan beralasan tanpa perubahan stok |
| 09 | Penjualan langsung, kosong aktual, tunai penuh, retry |
| 10–12 | Bon, pembayaran sebagian, pelunasan dan status turunan |
| 13 | Serah-terima dua kali hanya menghasilkan satu sale |
| 14 | Pembayaran negatif/nol/berlebih ditolak |
| 15 | Dua pengecer, principal/paid/balance dan filter direkonsiliasi |
| 16–17 | Registrasi pending, persetujuan dan akun aktif buatan admin |
| 18 | Karyawan konfirmasi; kelola produk/koreksi stok ditolak |
| 19–20 | Pembatalan melepas reserved; serah-terima mengurangi penuh/reserved dan menambah kosong aktual |
| 21 | Uang muka dan pelunasan menghasilkan dua payment |
| 22 | Dua koneksi mengonfirmasi order yang bersaing: satu berhasil, satu konflik |
| 23–24 | Koreksi berjejak, batas reserved, peringatan hanya di bawah ambang |
| 25 | Laporan/filter/pagination, pemisahan omzet dan kas, batas hari Jakarta |
| 26 | Retry sale/payment paralel memakai key sama menghasilkan satu record |
| 27 | Nonaktif/reset/ganti sandi mencabut sesi lama |
| 28 | Field NIK/KTP ekstra pada registrasi/penjualan ditolak; log tidak memuat password/token |

Kasus tambahan mencakup kegagalan multi-produk tanpa write parsial, snapshot harga/nama historis, patch produk yang tidak menimpa field lain, proteksi CSRF cookie, JSON rusak, dan pembatasan percobaan login. File tes: `tests/backend.test.ts`.

## Dependensi dan pekerjaan sebelum produksi

Zod telah diperbarui ke 4.6.7. Audit online terakhir tidak menemukan advisory moderate/high/critical; masih ada **5 temuan low dalam satu rantai dependensi build** `deepmerge → @rollup/plugin-node-resolve → nitropack → @nuxt/nitro-server → nuxt`. [Advisory deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) belum mencantumkan versi patch pada tanggal pemeriksaan. Tidak dilakukan downgrade paksa Nuxt untuk menutupi temuan itu. Periksa kembali pembaruan upstream sebelum deployment.

Belum dilakukan: UAT dengan pemilik/karyawan/pengecer, UI/perangkat mobile, uji beban pada volume produksi, restore backup hosting, dan validasi asumsi bisnis Bagian 9 PRD. Migrasi kedua mencabut akses tabel aplikasi dari role API `anon`/`authenticated` bila tersedia di Supabase; konfigurasi nyata hosting dan role runtime tetap perlu disesuaikan lingkungan deployment.
