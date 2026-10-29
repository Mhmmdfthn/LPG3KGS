# LPG3KGS — backend Nuxt

Backend REST API berbahasa Indonesia berdasarkan [PRD](docs/prd-sistem-pemesanan-manajemen-lpg.md). Menggunakan **Nuxt 4 / Nitro, TypeScript, PostgreSQL, Zod, dan bcrypt**. Implementasi ini berfokus pada backend; antarmuka operasional belum dibuat.

## Menjalankan

Prasyarat: Node.js 24 LTS versi 24.15+ (alternatif 22.22.3+) dan PostgreSQL 17+ (lokal, Docker, atau Supabase). Pada Windows PowerShell yang memblokir `npm.ps1`, gunakan `npm.cmd`.

```powershell
cd LPG3KGS
npm.cmd ci
Copy-Item .env.example .env
# Opsional jika Docker tersedia:
docker compose up -d
```

Isi `DATABASE_URL` dan `SEED_ADMIN_PASSWORD` di `.env`. Kata sandi minimal 10 karakter, maksimal 72 byte. Untuk Supabase gunakan koneksi PostgreSQL langsung atau session pooler yang mendukung transaksi; pakai SSL sesuai pengaturan penyedia. Jangan menonaktifkan verifikasi sertifikat TLS.

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

API tersedia di `http://localhost:3000/api`; cek `GET /api/health`. Seed dapat diulang tanpa mengganti sandi admin yang sudah ada. Tiga produk awal dibuat **nonaktif dengan harga nol dan stok nol**; admin harus mengatur harga, mengaktifkan produk, lalu mencatat stok pembukaan melalui koreksi beralasan. Harga aktual tidak diasumsikan.

## Fitur

- Sesi tersimpan di database, logout, ganti/reset sandi, penonaktifan sesi, pembatasan login/registrasi.
- Registrasi pengecer pending dan persetujuan/penolakan admin; akun pengecer serta karyawan dari admin.
- Produk dan harga; stok penuh/kosong/reservasi; pasokan, tabung kosong ke agen, koreksi, ambang minimum, histori.
- Pesanan, konfirmasi, penolakan, pembatalan, dan serah-terima satu kali; stok terkunci dalam transaksi database.
- Penjualan langsung tunai; bon, uang muka, cicilan, pelunasan; saldo dihitung dari penjualan dikurangi pembayaran.
- Isolasi data pengecer, dashboard Jakarta, laporan penjualan/stok/piutang, audit, filter, pagination.
- Idempotensi wajib untuk perubahan stok/pesanan/uang; retry harus memakai kunci yang sama.

Kontrak endpoint, contoh payload, dan keputusan V1 ada di [dokumentasi API](docs/backend-api.md). Contoh request yang dapat dicoba ada di [requests.http](docs/requests.http). Hasil tes dan batas verifikasi dicatat di [backend-verification.md](docs/backend-verification.md).

## Pemeriksaan

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Tes default menjalankan API HTTP dengan PostgreSQL WASM (PGlite), termasuk rollback, role/ownership, stock ledger, uang, idempotensi, filter dan zona waktu. Dua tes **konkurensi multi-koneksi** hanya dijalankan bila `TEST_DATABASE_URL` tersedia; PGlite satu koneksi tidak membuktikan perilaku row lock antar-koneksi.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://lpg:lpg@localhost:5432/lpg'
npm.cmd test
Remove-Item Env:TEST_DATABASE_URL
```

Pengujian PostgreSQL membuat schema acak `test_*`, lalu menghapus schema itu setelah selesai. Gunakan database khusus pengujian dengan izin `CREATE SCHEMA`. Tidak ada tabel aplikasi yang di-truncate di luar schema uji.

## Produksi dan pemulihan

Jalankan migrasi sebagai langkah deployment terpisah, kemudian `npm.cmd run build` dan `npm.cmd start`. Isi `DATABASE_URL`, `NUXT_APP_ORIGIN=https://domain-anda`, dan `NUXT_SESSION_HOURS` di environment proses. `npm start` tidak otomatis membaca `.env`; gunakan pengelola proses/hosting atau `node --env-file=.env .output/server/index.mjs`. HTTPS wajib agar cookie produksi dapat dikirim. Jangan publikasikan PostgreSQL ke internet; contoh Compose hanya mengikat port ke loopback.

Gunakan akun migrasi terpisah dari akun runtime. Runtime hanya membutuhkan SELECT/INSERT/UPDATE untuk tabel operasional, DELETE untuk sesi, serta SELECT/INSERT untuk ledger stok, pembayaran dan audit. Jangan berikan hak menghapus histori atau mengubah schema. Jangan aktifkan akses tabel Supabase langsung dari browser.

Atur backup harian dan retensi sesuai hosting serta kesepakatan pemilik. Contoh manual dengan utilitas PostgreSQL:

```powershell
pg_dump --dbname=$env:DATABASE_URL --format=custom --file=lpg-backup.dump
# Restore ke database kosong khusus pemulihan, bukan menimpa produksi:
pg_restore --dbname=$env:RESTORE_DATABASE_URL --no-owner lpg-backup.dump
```

Uji restore sebelum rilis: cocokkan jumlah orders/sales/payments, total piutang, saldo stok, serta histori. Jadwal, retensi, RPO/RTO, dan hasil dry run harus ditetapkan/dicatat pemilik hosting. Artefak backup berisi kontak usaha: simpan di storage terbatas, di luar repositori. Untuk maintenance berkala, hapus sesi kedaluwarsa dan bucket `auth_limits` yang `reset_at`-nya sudah lewat; simpan idempotency key selama transaksi masih dapat di-retry.

Backend tidak mengumpulkan NIK/KTP dan tidak terhubung ke MAP, payment gateway atau WhatsApp. Asumsi operasional yang belum diputuskan pemilik tetap tercatat di [dokumentasi](docs/backend-api.md#asumsi-operasional).
