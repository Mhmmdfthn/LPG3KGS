# Hasil pengujian UAT backend

Tanggal: 9 November 2026. Lingkungan: Windows x64, Node.js 24.18.0, PGlite (in-memory), `npm test`.

Perintah:

```powershell
npm test
```

Hasil: **27 lulus, 0 gagal, 2 skip**. Dua test multi-koneksi dilewati karena memerlukan `TEST_DATABASE_URL`.

Seluruh TC-01–TC-13 diuji pada level API di `tests/backend.test.ts`. TC-01 dan TC-12 memakai test yang sudah ada; TC-02–TC-11 dan TC-13 memiliki test khusus.

| ID | Skenario Pengujian | Data / Kondisi Uji | Hasil yang Diharapkan | Status / Hasil |
|---|---|---|---|---|
| TC-01 | Login dengan akun aktif | Akun dummy pemilik aktif; kata sandi benar dan salah | Sistem membuka dashboard pemilik dan memberi hak akses sesuai role | **Lulus** — sandi salah → 401; login benar → 200 + token; `GET /auth/me` → 200 role `admin`; pengecer `GET /inventory` → 403. Catatan: tampilan dashboard adalah UI, tidak diuji di level API |
| TC-02 | Pengecer tidak dapat melihat data pengecer lain | Pengecer B membuka `GET /orders/:id`, `/sales/:id`, `/receivables/:id` milik Pengecer A; lalu `?retailer_id=` milik A | API menolak akses dan tidak mengembalikan data milik Pengecer B | **Lulus** — ketiga akses ditolak (404), body tidak memuat nomor invoice; manipulasi `retailer_id` → 403; `/my/transactions` Pengecer B kosong. Catatan: kode memakai 404, bukan 403, agar ID tidak dapat ditebak |
| TC-03 | Stok penuh/kosong ditampilkan terpisah | Produk LPG 3 kg: 12 penuh, 8 kosong | Halaman stok menampilkan angka sesuai data dummy untuk kedua kondisi | **Lulus** — `GET /inventory` mengembalikan `full_qty=12` dan `empty_qty=8` sebagai dua field terpisah |
| TC-04 | Penerimaan pasokan memperbarui stok | Saldo awal 12 penuh/15 kosong; catat 20 penuh diterima dan 10 kosong diserahkan | Saldo menjadi 32 penuh/5 kosong; riwayat pergerakan tercatat | **Lulus** — `full_qty=32`, `empty_qty=5`; 1 baris `stock_movements` bertipe `RECEIPT`, alasan dan `created_at` tersimpan |
| TC-05 | Pesanan melebihi stok tersedia | Stok tersedia 5 tabung; pengecer mengajukan 7 | Sistem memberi pesan stok tidak cukup dan tidak membuat pesanan melebihi stok | **Lulus** — `available_qty=5`; pesanan 7 → 409 "Jumlah pesanan melebihi stok tersedia. LPG 3 kg: 5 tabung."; jumlah `orders` tetap 0 |
| TC-06 | Pemesanan valid menunggu konfirmasi | Stok tersedia 10; pengecer memesan 4 | Pesanan tersimpan dengan nomor unik dan status Menunggu Konfirmasi | **Lulus** — nomor `ORD-<UUID huruf besar>` sesuai pola, berbeda dari pesanan kedua; status `MENUNGGU_KONFIRMASI`; total Rp200.000; `reserved_qty` masih 0 |
| TC-07 | Konfirmasi pesanan menyisihkan stok | Stok penuh 10, stok disisihkan 0; konfirmasi pesanan 4 | Status Dikonfirmasi dan stok tersedia menjadi 6, tanpa mengurangi stok fisik | **Lulus** — `full_qty=10`, `reserved_qty=4`, `available_qty=6`, status `DIKONFIRMASI` |
| TC-08 | Pesanan ditolak tidak menyisihkan stok | Stok tersedia 10; pesanan 3 ditolak | Status Ditolak, alasan tersimpan, jumlah tersedia tetap 10 | **Lulus** — status `DITOLAK`; entri riwayat memuat alasan "Stok dialokasikan untuk pesanan lain"; `available_qty` tetap 10 |
| TC-09 | Penjualan langsung memperbarui stok | Saldo 10 penuh/0 kosong; catat penjualan 2 penuh dan penerimaan 2 kosong | Saldo menjadi 8 penuh/2 kosong; transaksi tercatat satu kali | **Lulus** — `full_qty=8`, `empty_qty=2`; `empty_returned=2` pada item penjualan; tabel `sales` berisi 1 baris |
| TC-10 | Bon menghasilkan sisa piutang | Total transaksi dummy Rp200.000; belum ada pembayaran | Sisa piutang Rp200.000 dan terhubung ke pengecer serta transaksi sumbernya | **Lulus** — `total=200000`, `paid=0`, `balance=200000`, status `BELUM_DIBAYAR`, `retailer_id` sesuai pengecer; total piutang pada `GET /receivables` Rp200.000 |
| TC-11 | Pembayaran sebagian memperbarui saldo | Piutang Rp200.000; catat pembayaran Rp50.000 | Total pembayaran Rp50.000; sisa piutang Rp150.000; status Dibayar Sebagian | **Lulus** — `total=200000`, `balance=150000`, `payment_status=DIBAYAR_SEBAGIAN` |
| TC-12 | Pelunasan mengubah status piutang | Sisa piutang Rp150.000; catat pelunasan Rp150.000 | Sisa piutang Rp0 dan status Lunas; pembayaran masuk riwayat | **Lulus** — setelah pelunasan `balance=0`, `payment_status=LUNAS`, dan `payments` berisi 2 baris (cicilan + pelunasan) |
| TC-13 | Pesanan selesai tidak menggandakan transaksi | Pesanan Dikonfirmasi diselesaikan sekali, lalu dicoba diselesaikan lagi dengan Idempotency-Key sama | Hanya ada satu transaksi penjualan dan satu set pergerakan stok | **Lulus** — kedua respons 200 dengan `sale.id` sama; tabel `sales` berisi 1 baris; stok 12 → 8 (potong sekali); `reserved_qty=0`; percobaan dengan key berbeda → 409 |

## Catatan

- TC-02: implementasi mengembalikan **404** untuk ID milik pengecer lain, bukan 403. Ini disengaja agar keberadaan data tidak bocor. Jika spesifikasi UAT mewajibkan 403, perilaku ini perlu diubah.
- TC-05: pemblokiran tombol pesanan adalah perilaku frontend. Pengujian ini membuktikan backend menolak pesanan yang melebihi stok.
- TC-01: yang diuji adalah autentikasi dan otorisasi API; tampilan dashboard tidak termasuk.
- Test balapan multi-koneksi belum dijalankan pada lingkungan ini; jalankan dengan `TEST_DATABASE_URL` yang menunjuk PostgreSQL untuk mengaktifkannya.
