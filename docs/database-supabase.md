# Pembaruan database: Supabase (PostgreSQL)

Tanggal: 2 November 2026. Lingkungan: Windows x64, Node.js 24.18.0, Nuxt 4.6.2, `pg` 8.23.1. Dokumen ini mencatat pemindahan database dari PostgreSQL lokal ke **Supabase** beserta hasil migrasi dan seed. Tidak ada kredensial (password, connection string utuh, project ref) yang ditulis di sini.

## Ringkasan

| Langkah | Hasil |
|---|---|
| Koneksi Supabase (session pooler, TLS terverifikasi) | Berhasil, `PostgreSQL 17.11` |
| `npm run db:migrate` | `001_initial.sql`, `002_backend_only.sql` diterapkan |
| Objek schema `public` | 15 tabel + 1 view (`sale_balances`) |
| `npm run db:seed` | 1 admin `ACTIVE`, 3 produk nonaktif, 3 baris `inventory` |
| Smoke test HTTP | `GET /api/health` 200, login admin 200, `GET /api/auth/me` 200, `GET /api/products` 200 (3 item) |

Supabase di sini **hanya dipakai sebagai PostgreSQL**. Autentikasi tetap ditangani Nitro (bcrypt + tabel `sessions`), bukan Supabase Auth, dan aplikasi tidak memakai PostgREST/`anon key`.

## Konfigurasi koneksi

Gunakan **Session pooler** Supabase (port `5432`, user `postgres.<project-ref>`), bukan host direct `db.<ref>.supabase.co`. Alasannya:

- Host direct hanya IPv6; jaringan yang hanya punya IPv4 (umum di Windows) gagal konek.
- Session pooler mendukung transaksi dan DDL, sehingga `db:migrate` serta `pool.transaction()` di `server/lib/db.ts` berjalan normal (transaction pooler port `6543` tidak cocok untuk DDL).
- Batas pool aplikasi (`max: 10`) berada di bawah kuota koneksi pooler.

Contoh isi `.env` (nilai asli tidak di-commit; `.env` sudah ada di `.gitignore`):

```env
DATABASE_URL=postgresql://postgres.<project-ref>:<PASSWORD-URL-ENCODED>@<pooler-host>:5432/postgres?sslmode=verify-full&sslrootcert=<path-ke-prod-ca-2021.crt>
NUXT_APP_ORIGIN=http://localhost:3000
NUXT_SESSION_HOURS=12
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=<minimal 10 karakter, maksimal 72 byte>
SEED_ADMIN_NAME=Pemilik Pangkalan
```

### Mengapa `sslmode=verify-full` + `sslrootcert`

- Supabase menandatangani sertifikat database dengan root CA miliknya sendiri (`Supabase Root 2021 CA`), yang tidak ada di trust store Node/OS. Tanpa CA tersebut koneksi gagal dengan `SELF_SIGNED_CERT_IN_CHAIN`.
- Sejak `pg` 8.13, `sslmode=require` (dan `prefer`, `verify-ca`) diperlakukan sebagai alias `verify-full` di driver Node — jadi `require` saja tidak menghilangkan error itu, hanya memindahkan masalahnya.
- Karena itu CA Supabase dipasang eksplisit lewat `sslrootcert`, sehingga verifikasi rantai sertifikat **dan** hostname tetap aktif. Jangan mengganti dengan `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, atau `uselibpqcompat=true` — semuanya mematikan verifikasi.
- Sertifikat (`prod-ca-2021.crt`) diunduh dari Dashboard Supabase (**Database → SSL Configuration**) atau diekstrak dari sertifikat server pooler, lalu diverifikasi sidik jarinya: root SHA-256 `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`.
- Karakter khusus pada password (`@ : / ? #`) wajib di-encode (`@` → `%40`, dan seterusnya).

## Langkah pembaruan

```powershell
cd LPG3KGS
npm.cmd ci                 # pasang dependensi sesuai lockfile
Copy-Item .env.example .env
# isi DATABASE_URL, SEED_ADMIN_PASSWORD pada .env
npm.cmd run db:migrate     # membuat/memperbarui schema
npm.cmd run db:seed        # admin awal + produk awal
npm.cmd run dev            # http://localhost:3000
```

Sifat operasi:

- `scripts/migrate.ts` menjalankan semua migrasi dalam **satu transaksi**, dilindungi `pg_advisory_xact_lock(1473001)`. Berkas yang sudah tercatat di `schema_migrations` dilewati, jadi aman dijalankan berulang.
- `scripts/seed.ts` memakai `pg_advisory_xact_lock(1473002)`. Seed ulang **tidak** mengganti password admin yang sudah ada, dan tidak menduplikasi produk bila `products` sudah berisi data.
- Produk hasil seed sengaja **nonaktif, harga 0, stok 0**. Harga bukan asumsi teknis: admin harus mengisi harga, mengaktifkan produk, lalu mencatat stok pembukaan melalui koreksi stok beralasan.

## Hasil migrasi

`schema_migrations` berisi:

```
001_initial.sql
002_backend_only.sql
```

Objek di schema `public`:

| Jenis | Objek |
|---|---|
| Tabel | `users`, `sessions`, `auth_limits`, `products`, `inventory`, `orders`, `order_items`, `order_history`, `sales`, `sale_items`, `payments`, `stock_movements`, `audit_logs`, `idempotency_keys`, `schema_migrations` |
| View | `sale_balances` (sumber saldo/piutang: total penjualan dikurangi pembayaran) |
| Index | `sessions_user_idx` dan index lain yang didefinisikan pada migrasi |

Migrasi `002_backend_only.sql` bersifat khusus Supabase: ia mencabut seluruh hak `PUBLIC` serta role `anon` dan `authenticated` pada semua tabel aplikasi (bila role tersebut ada). Ini mencegah data operasional terbaca lewat REST API Supabase meskipun project memiliki `anon key`. Role yang dipakai aplikasi adalah user database (`postgres.<project-ref>`) yang tidak terkena pencabutan ini.

## Hasil seed

| Data | Nilai |
|---|---|
| Akun admin | `admin` / role `admin` / status `ACTIVE` / nama `Pemilik Pangkalan` |
| Produk | `LPG 3 kg` (3.00), `Bright Gas 5,5 kg` (5.50), `Bright Gas 12 kg` (12.00) |
| Harga & status produk | `price = 0`, `active = false` (semua) |
| `inventory` | 3 baris, stok penuh/kosong/reserved = 0 |

Password admin hanya ada di `.env` (variabel `SEED_ADMIN_PASSWORD`), tidak didokumentasikan dan tidak di-commit.

## Verifikasi

Query yang dipakai untuk memastikan keadaan database:

```sql
select current_user, current_database(), version();
select count(*) from information_schema.tables where table_schema='public';
select name from schema_migrations order by name;
select username, role, status from users order by created_at;
select name, size_kg, price, active from products order by size_kg;
```

Hasil yang diharapkan: server `PostgreSQL 17.x` (Supabase memenuhi syarat minimum 17), 16 objek di `public` (15 tabel + 1 view), dua migrasi tercatat, satu admin `ACTIVE`, tiga produk nonaktif.

Uji lewat API (dev server):

```powershell
curl.exe http://localhost:3000/api/health
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{\"identity\":\"admin\",\"password\":\"<SEED_ADMIN_PASSWORD>\"}'
```

Endpoint lain yang dipakai untuk smoke test: `GET /api/auth/me` dan `GET /api/products` dengan header `Authorization: Bearer <token>`.

## Troubleshooting

| Gejala | Penyebab | Penanganan |
|---|---|---|
| `SELF_SIGNED_CERT_IN_CHAIN` | CA Supabase belum dipasang; `sslmode=require` pada `pg` ≥ 8.13 = `verify-full` | Tambahkan `sslrootcert` yang menunjuk `prod-ca-2021.crt`, jangan matikan verifikasi |
| `ENOTFOUND` / timeout ke `db.<ref>.supabase.co` | Host direct hanya IPv6 | Pakai host Session pooler |
| `password authentication failed` | Password mengandung karakter khusus yang belum di-encode, atau password direset | Encode password di URL; samakan dengan Dashboard |
| `Tenant or user not found` | User bukan `postgres.<project-ref>` atau ref salah | Ambil ulang connection string dari Dashboard |
| Project tiba-tiba tidak bisa diakses | Free tier mem-pause project setelah lama idle | Buka Dashboard untuk membangunkan project |
| `port 3000` membalas 503 | Proses dev server lama masih memegang port | `Get-NetTCPConnection -LocalPort 3000 -State Listen \| ForEach-Object { taskkill /PID $_.OwningProcess /T /F }` |

## Keamanan dan operasional

- `.env` berisi password database dan password admin — jangan pernah di-commit, jangan dikirim lewat chat publik. Bila sempat bocor, reset password database di Dashboard lalu perbarui `.env`.
- Connection string hanya dipakai sisi server (Nitro). Tidak ada akses database langsung dari browser.
- Saat deploy: jalankan migrasi sebagai langkah terpisah, lalu `npm.cmd run build` dan `npm.cmd start` dengan `DATABASE_URL`, `NUXT_APP_ORIGIN=https://domain-anda`, dan `NUXT_SESSION_HOURS` di environment proses (`npm start` tidak membaca `.env`; gunakan `node --env-file=.env .output/server/index.mjs` atau process manager).
- Sediakan backup harian. Contoh dengan utilitas PostgreSQL:
  ```powershell
  pg_dump --dbname=$env:DATABASE_URL --format=custom --file=lpg-backup.dump
  ```
  Uji restore ke database kosong sebelum rilis.
- Untuk maintenance, hapus sesi kedaluwarsa dan bucket `auth_limits` yang `reset_at`-nya sudah lewat; simpan idempotency key selama transaksi masih dapat di-retry.
