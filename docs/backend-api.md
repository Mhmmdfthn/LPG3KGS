# Kontrak backend LPG3KGS

Base URL: `/api`. Semua body berupa JSON; nama field memakai `snake_case`, jumlah tabung integer, uang integer Rupiah. Timestamp berupa ISO 8601; rentang tanggal laporan memakai hari kalender **Asia/Jakarta**, inklusif pada `from` dan `to`.

## Respons dan autentikasi

```json
{ "data": { "id": "uuid" }, "request_id": "uuid" }
```

```json
{ "error": { "code": 409, "message": "Pesanan sudah diproses." }, "request_id": "uuid" }
```

Sukses mengembalikan HTTP 200; gagal memakai 400 JSON rusak, 401 sesi/kredensial tidak sah, 403 akses ditolak, 404 resource tidak ditemukan/di luar kepemilikan, 409 konflik stok/status/unik/idempotensi, 413 terlalu besar, 415 media bukan JSON, 422 validasi, 429 terlalu banyak percobaan, atau 500 kesalahan internal. Detail SQL, kredensial dan stack tidak dikembalikan. `X-Request-Id` selalu dikirim. Semua respons API `Cache-Control: no-store`.

Login menerima `identity` (username atau email) dan `password`. Hasil berisi `token`, `expires_at`, dan `user`; token boleh dipakai sebagai `Authorization: Bearer <token>`. Cookie `lpg_session` juga diset dengan HttpOnly, SameSite=Strict dan Secure di produksi. Sesi default 12 jam, maksimal konfigurasi 168 jam. Logout mencabut sesi itu, perubahan/reset password mencabut semua sesi akun. Status aktif dibaca lagi pada setiap akses. Tidak ada refresh token.

Untuk cookie, request tulis harus mengirim header `Origin` sama dengan `NUXT_APP_ORIGIN`. Setiap request tulis yang mempunyai Origin lain ditolak, termasuk login. Tidak ada CORS lintas origin secara default. Untuk server/Postman gunakan Bearer. Jangan menyimpan Bearer token di log atau repository; utamakan cookie untuk frontend satu origin.

Field yang tidak ada dalam schema ditolak (termasuk `role`, `retailer_id`, `nik`, `ktp` pada registrasi/pesanan). Body dibatasi 64 KiB setelah parsing; reverse proxy produksi juga perlu membatasi ukuran request sebelum diteruskan. Username dinormalisasi lowercase, 3–50 karakter `[a-z0-9_.-]`. Password 10 karakter minimum, 72 byte maksimum, hash bcrypt cost 12. Login 10 percobaan per identitas dan 30 per IP per 15 menit; registrasi 5 per IP per 15 menit. IP dibaca dari koneksi langsung: header proxy yang tidak dipercaya tidak dipakai. Deploy banyak instance menggunakan bucket limit database yang sama.

## Idempotensi

Wajib kirim `Idempotency-Key: <8–128 karakter A-Z a-z 0-9 _ . : ->` untuk endpoint bertanda **K** pada tabel. Buat UUID untuk satu tindakan pengguna dan simpan kunci itu sampai hasilnya diketahui. Retry dengan akun, endpoint, key, dan payload sama mengembalikan hasil awal. Key sama dengan payload berbeda menghasilkan 409. Response disimpan dalam transaksi yang sama; kegagalan rollback juga membatalkan key. Key dibatasi per akun dan endpoint, sehingga operasi pengguna lain tidak dapat mengambil responsnya.

Setiap penyelesaian order juga dilindungi `UNIQUE(sales.order_id)` dan state machine. Menyelesaikan ulang dengan **key baru** menghasilkan 409, sedangkan key awal memberikan sale yang sama. Tidak ada update/delete sale/payment yang telah tersimpan.

## Endpoint

Peran: A = admin, K = karyawan, P = pengecer aktif. Kolom Retry K berarti idempotency key wajib.

| Method | Path | Peran | Fungsi | Retry |
|---|---|---|---|---|
| GET | `/health` | publik | Status API dan koneksi DB | |
| POST | `/auth/login` | publik | Login | |
| POST | `/auth/logout` | A/K/P | Cabut sesi | |
| GET | `/auth/me` | A/K/P | Profil sendiri | |
| POST | `/auth/change-password` | A/K/P | Ganti sandi dan cabut sesi | |
| POST | `/retailer-registrations` | publik | Daftar pending | |
| GET | `/retailers/pending` | A | Antrean persetujuan | |
| PATCH | `/retailers/{id}/approval` | A | Setujui/tolak pending | |
| GET, POST | `/retailers` | A | Daftar/buat pengecer aktif | |
| PATCH | `/retailers/{id}` | A | Profil atau ACTIVE/INACTIVE | |
| POST | `/retailers/{id}/reset-password` | A | Reset akses | |
| GET, POST | `/staff` | A | Daftar/buat karyawan | |
| PATCH | `/staff/{id}` | A | Profil atau ACTIVE/INACTIVE | |
| POST | `/staff/{id}/reset-password` | A | Reset akses | |
| GET | `/products` | A/K/P | Katalog; P hanya produk aktif + stok tersedia | |
| POST | `/products` | A | Buat produk dengan stok nol | |
| PATCH | `/products/{id}` | A | Harga/profil/ambang/status aktif | |
| GET | `/inventory` | A/K | Penuh, kosong, reserved, tersedia, peringatan | |
| GET | `/stock-movements` | A/K | Histori dan referensi ledger | |
| POST | `/stock-receipts` | A/K | Pasokan penuh dan kosong ke agen | K |
| POST | `/stock-adjustments` | A | Koreksi delta beralasan | K |
| POST | `/orders` | P | Ajukan tanpa reservasi | K |
| GET | `/orders/my` | P | Order sendiri | |
| GET | `/orders` | A/K | Antrean/riwayat operasional | |
| GET | `/orders/{id}` | A/K/P sendiri | Detail, items, histori, referensi sale | |
| POST | `/orders/{id}/confirm` | A/K | Reservasi atomik | K |
| POST | `/orders/{id}/reject` | A/K | Tolak pending beralasan | K |
| POST | `/orders/{id}/cancel` | A/K | Batalkan pending/confirmed; lepas reservasi | K |
| POST | `/orders/{id}/complete` | A/K | Serah-terima, sale, kosong aktual, pembayaran | K |
| POST | `/sales/direct` | A/K | Penjualan langsung tunai | K |
| GET | `/sales` | A/K | Daftar transaksi operasional, tanpa agregasi | |
| GET | `/sales/{id}` | A/K/P sendiri | Detail items dan seluruh payment | |
| POST | `/sales/{id}/payments` | A/K | Bayar cicilan/pelunasan | K |
| GET | `/receivables` | A/K terbatas | Daftar saldo belum lunas | |
| GET | `/receivables/{sale_id}` | A/K/P sendiri | Rincian transaksi dan saldo | |
| GET | `/payments` | A/P sendiri | Riwayat pembayaran/filter | |
| GET | `/my/transactions` | P | Transaksi sendiri | |
| GET | `/my/receivables` | P | Bon sendiri | |
| GET | `/dashboard` | A | Stok, order pending, omzet/kas hari ini, piutang | |
| GET | `/reports/sales` | A | Summary dan daftar penjualan | |
| GET | `/reports/stock` | A | Delta per produk dan ledger | |
| GET | `/reports/receivables` | A | Agregat piutang per pengecer dan total | |
| GET | `/audit-logs` | A | Jejak perubahan | |

Karyawan hanya boleh memakai `/receivables` dengan `retailer_id` atau `q` nomor transaksi lengkap. Daftar `/sales` untuk karyawan tidak memuat saldo kumulatif; rincian saldo diakses melalui detail transaksi atau pencarian pengecer. Karyawan tidak mendapat summary dashboard, laporan usaha atau ekspor. Pengecer yang mencoba ID resource akun lain mendapat 404. Kepemilikan pesanan baru selalu berasal dari sesi.

## Body request

Registrasi (`password_confirmation` wajib hanya untuk daftar mandiri), POST retailers/staff:

```json
{
  "username": "warung_sumber", "password": "contoh-sandi-kuat-123",
  "password_confirmation": "contoh-sandi-kuat-123",
  "name": "Budi", "business_name": "Warung Sumber",
  "contact": "081234567890", "email": "budi@example.com"
}
```

`business_name` dan `email` opsional. PATCH akun menerima field profil yang sama kecuali password, ditambah `status: ACTIVE|INACTIVE`; tidak boleh mengubah role. Pending harus melalui approval. Approval: `{"approved":true}` atau `{"approved":false,"reason":"Kontak belum terverifikasi"}`. Reset: `{"password":"sandi-baru-kuat-123"}`. Ganti sandi: `{"current_password":"...","new_password":"..."}`.

Produk:

```json
{ "name":"LPG 3 kg", "size_kg":3, "price":20000, "minimum_stock":5, "active":true }
```

Angka harga contoh hanya data uji. `minimum_stock` default 0, `active` default true pada pembuatan; PATCH hanya mengubah field yang dikirim. Stok tidak dapat diubah melalui produk. `available_qty=full_qty-reserved_qty`; `low_stock` benar hanya saat tersedia **lebih kecil** dari ambang. Nilai uang dan total satu transaksi dibatasi `2.147.483.647` Rupiah. Agregat laporan dikirim sebagai **string desimal** supaya penjumlahan banyak transaksi tidak kehilangan presisi.

Stok masuk (minimal satu delta positif; `empty_sent` dapat dikirim tanpa penuh masuk):

```json
{ "items":[{ "product_id":"UUID", "full_received":20, "empty_sent":10 }], "reason":"Pasokan agen" }
```

Koreksi (delta bertanda, boleh untuk saldo pembukaan):

```json
{ "product_id":"UUID", "full_delta":12, "empty_delta":15, "reason":"Saldo pembukaan setelah hitung fisik" }
```

Ajukan order:

```json
{ "items":[{ "product_id":"UUID", "quantity":4 }] }
```

Satu produk sekali per array, maksimal 50 produk; jumlah unit 1–1.000.000. Harga dan nama disalin dari katalog saat pengajuan. Konfirmasi body `{}`; penolakan/pembatalan body `{"reason":"..."}` (3–500 karakter).

Serah-terima order:

```json
{
  "payment_type":"BON", "amount_paid":50000, "method":"TUNAI",
  "returns":[{ "product_id":"UUID", "empty_returned":3 }],
  "note":"Uang muka diterima petugas"
}
```

`returns` wajib mencakup tepat semua produk order, termasuk yang kosong aktualnya nol. Jumlah penuh mengikuti order; tidak ada serah-terima sebagian. Tunai mengharuskan `amount_paid=total`; bon menerima 0 sampai total. Bon yang dibayar penuh langsung `LUNAS`. Produk/harga yang berubah tidak mengubah nilai historis order/sale.

Penjualan langsung:

```json
{ "items":[{ "product_id":"UUID", "quantity":2, "empty_returned":1 }], "amount_paid":40000, "method":"TUNAI" }
```

Tanpa identitas pembeli/akun; harus lunas dan tidak boleh mengambil stok reserved. `method` mendukung `TUNAI`, `TRANSFER`, atau `LAINNYA` (pencatatan manual, tanpa verifikasi bank).

Bayar lanjutan:

```json
{ "amount":150000, "method":"TUNAI", "paid_at":"2026-10-29T10:00:00+07:00", "note":"Pelunasan" }
```

`paid_at` opsional, default waktu server; tidak boleh sebelum penjualan atau di masa depan. Nominal harus positif dan tidak melebihi saldo terkini yang dibaca setelah sale dikunci. Status: `BELUM_DIBAYAR`, `DIBAYAR_SEBAGIAN`, `LUNAS`; `balance=total-sum(payments.amount)`. Pembayaran awal hanya menghasilkan payment bila nominal >0. Total sale nol langsung lunas tanpa payment.

## Daftar, filter dan laporan

Daftar mengembalikan `items` dan `pagination: {page,limit,total}`. Default page=1, limit=25; limit maksimum 100. Agregat laporan menghitung seluruh data yang cocok, bukan hanya halaman. Query tak dikenal ditolak; filter yang tidak relevan untuk jenis daftar sebaiknya tidak dikirim.

| Resource | Filter yang dipakai |
|---|---|
| Akun | `q` username/nama/usaha, `status` |
| Produk/inventory | `q` nama, `product_id` |
| Orders | `from`, `to`, `retailer_id`, `status`, `q` nomor |
| Sales/receivables/report sales | `from`, `to`, `retailer_id`, `product_id`, `source`, `payment_type`, `payment_status`, `q` nomor |
| Stock movements/report stock | `from`, `to`, `product_id`, `type` |
| Payments | `from`, `to` pada tanggal bayar, `retailer_id`, `payment_status`, `q` nomor payment/sale |
| Audit | `from`, `to`, `actor_id`, `action` |

Status order: `MENUNGGU_KONFIRMASI`, `DIKONFIRMASI`, `DITOLAK`, `DIBATALKAN`, `SELESAI`. Tipe pergerakan: `RECEIPT`, `ADJUSTMENT`, `RESERVE`, `RELEASE`, `SALE`. Source: `ORDER`, `DIRECT`. Daftar receivables default hanya saldo >0; gunakan `payment_status=LUNAS` untuk melihat yang lunas. Laporan receivables menghitung semua transaksi pengecer (termasuk yang lunas) supaya principal, paid dan balance bisa direkonsiliasi; tanggal memfilter tanggal sale, pembayaran kumulatif dihitung sampai saat query, bukan saldo historis akhir periode.

Laporan sales membedakan `total_sales` (omzet pada tanggal sale), `cumulative_payments` (semua pembayaran atas sale terpilih), `remaining_balance`, dan `cash_received_in_period` (pembayaran pada tanggal bayar). Filter produk memilih **seluruh transaksi yang memuat produk itu**, sehingga total tetap total nota, bukan subtotal satu produk. Laporan stock berisi jumlah perubahan penuh/kosong/reservasi per produk serta entri sebelum/sesudah dan `reference_id`; filter jenis hanya menjumlahkan jenis terpilih. Dashboard dan laporan menggunakan snapshot repeatable-read supaya angka antar-query konsisten.

## Asumsi operasional

Mengikuti asumsi sementara PRD Bagian 9:

- Kosong dicatat aktual, tanpa pemaksaan tukar 1:1 atau biaya tambahan otomatis.
- Tidak ada auto-expiry order, serah-terima sebagian, atau pembatalan mandiri pengecer.
- Admin/karyawan boleh membatalkan pending/confirmed dengan alasan; status terminal tidak dapat diubah.
- Tidak ada plafon kredit, jatuh tempo wajib, pengingat, atau koreksi/void sale dan payment yang kebijakannya belum disepakati.
- Produk nonaktif tidak dapat dipesan/dijual/dikonfirmasi baru. Order yang sudah dikonfirmasi dapat diselesaikan dengan snapshot historisnya.
- Pemulihan akses melalui admin; tidak ada email/SMS/OTP.
- Stok awal dicatat sebagai koreksi admin beralasan, tanpa overwrite database.
- NIK/KTP dan integrasi MAP tetap di luar aplikasi.

Asumsi ini perlu divalidasi pemilik sebelum penggunaan operasional. Pengujian UI/perangkat dan UAT pengguna belum berlaku pada tahap backend.
