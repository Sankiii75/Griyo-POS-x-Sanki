# PRD Aplikasi Pencatat Penjualan (Griyo POS Lite)

Oct 28, 2026 · @sankiii

Aplikasi web offline-first untuk mencatat produk, transaksi penjualan, dan laporan, dibangun dengan HTML, CSS, JavaScript murni, dan IndexedDB tanpa server.

## 1. Latar belakang dan tujuan

Pemilik usaha kecil (warung, toko kelontong, kedai) butuh cara cepat mencatat penjualan harian tanpa kasir mahal, tanpa internet, dan tanpa akun. Aplikasi ini meniru alur dasar Griyo POS: kelola produk, jual lewat keranjang, lalu lihat laporan.

**Tujuan**

- Pengguna bisa menambah produk dan memulai transaksi pertama dalam kurang dari 2 menit.
- Semua data tersimpan di perangkat (IndexedDB) dan tetap ada setelah browser ditutup atau offline.
- Pengguna bisa menjumlahkan beberapa transaksi pilihan untuk rekap cepat.

**Di luar lingkup (versi 1)**

- Login/multi-pengguna, sinkronisasi cloud, dan backend server.
- Stok barang, diskon, pajak, pelanggan, cetak struk printer, dan pembayaran digital.
- Ekspor PDF/Excel (dicatat sebagai pengembangan berikutnya).

## 2. Pengguna dan alur utama

Pengguna tunggal: pemilik atau kasir toko kecil yang memakai ponsel atau laptop, tidak teknis, dan sering bekerja dengan satu tangan.

Alur utama: **Produk → Transaksi → Laporan**.

1. Pengguna membuka halaman Produk dan mengisi nama, harga beli, dan harga jual.
2. Di halaman Transaksi, pengguna memilih produk, mengatur jumlah, lalu menyimpan transaksi.
3. Di halaman Laporan, pengguna melihat riwayat, memilih beberapa transaksi, lalu membaca total nilai pilihan serta jumlah total produk dari semua transaksi yang dipilih.

## 3. Arsitektur dan data

Satu aplikasi statis tanpa framework dan tanpa build step; cukup dibuka dari file atau hosting statis. Tiga halaman berbagi satu modul database.

```
/index.html          → redirect ke transaksi.html
/produk.html         → halaman Produk
/transaksi.html      → halaman Transaksi
/laporan.html        → halaman Laporan
/css/style.css       → gaya bersama + responsif
/js/db.js            → buka IndexedDB, helper CRUD (Promise)
/js/produk.js        → logika halaman Produk
/js/transaksi.js     → logika halaman Transaksi
/js/laporan.js       → logika halaman Laporan
/js/util.js          → format Rupiah, tanggal, escape HTML
```

Database IndexedDB bernama `griyo_lite`, versi 1, dengan dua object store:

| Store | Key | Field | Index |
| --- | --- | --- | --- |
| `products` | `id` (autoIncrement) | `nama` (string), `hargaBeli` (integer Rp), `hargaJual` (integer Rp), `createdAt`, `updatedAt` (epoch ms) | `nama` |
| `transactions` | `id` (autoIncrement) | `waktu` (epoch ms), `items` (array), `total` (integer Rp), `totalModal` (integer Rp) | `waktu` |

Setiap elemen `items` menyimpan salinan (snapshot): `productId`, `nama`, `hargaBeli`, `hargaJual`, `qty`, `subtotal`. Dengan snapshot, laporan lama tidak berubah ketika produk kemudian diedit atau dihapus.

Semua nilai uang disimpan sebagai bilangan bulat rupiah, bukan desimal, untuk menghindari kesalahan pembulatan. Jam, hari, bulan, dan tahun diturunkan dari `waktu` saat ditampilkan, tidak disimpan terpisah.

## 4. Halaman Produk

Pengguna mengelola daftar produk (Create, Read, Update, Delete) lewat satu formulir dan satu tabel.

**Formulir**

| Field | Tipe | Aturan |
| --- | --- | --- |
| Nama produk | teks | Wajib, 1–100 karakter, tidak boleh sama dengan produk lain (tanpa membedakan huruf besar/kecil) |
| Harga beli (Rp) | angka bulat | Wajib, ≥ 0 |
| Harga jual (Rp) | angka bulat | Wajib, ≥ 0; jika lebih kecil dari harga beli, tampilkan peringatan tapi tetap boleh disimpan |

**Perilaku**

- **Create:** tombol Simpan menambah produk, lalu formulir dikosongkan dan fokus kembali ke Nama produk.
- **Read:** tabel menampilkan nama, harga beli, harga jual, dan margin (jual − beli), diurutkan A–Z. Kolom pencarian memfilter berdasarkan nama secara langsung.
- **Update:** tombol Edit mengisi formulir dengan data produk; tombol berubah menjadi Perbarui, ditambah Batal.
- **Delete:** tombol Hapus meminta konfirmasi. Transaksi lama tetap utuh karena memakai snapshot.
- Keadaan kosong: pesan "Belum ada produk" dengan ajakan mengisi formulir.

## 5. Halaman Transaksi

Halaman ini menampilkan seluruh produk dan keranjang belanja berdampingan (di layar kecil: keranjang menjadi panel di bawah dengan ringkasan tetap terlihat).

**Daftar produk**

- Menampilkan semua produk sebagai kartu atau baris: nama dan harga jual.
- Kolom pencarian memfilter produk berdasarkan nama.
- Ketuk produk atau tombol Tambah memasukkan 1 unit ke keranjang; jika sudah ada, jumlahnya bertambah 1.

**Keranjang**

- Setiap baris memuat nama, harga beli satuan, kontrol jumlah (−, kolom angka, +), subtotal, dan tombol hapus baris.
- Jumlah minimal 1 dan berupa bilangan bulat; mengurangi dari 1 meminta konfirmasi hapus baris.
- Total belanja dihitung ulang setiap perubahan dan ditampilkan dalam Rupiah.
- Tombol Kosongkan keranjang dengan konfirmasi.

**Menyimpan transaksi**

- Tombol Simpan transaksi aktif hanya bila keranjang tidak kosong.
- Sistem membuat satu catatan `transactions` dengan `waktu` = saat disimpan, snapshot semua item, `total`, dan `totalModal`.
- Setelah tersimpan, keranjang dikosongkan dan muncul notifikasi "Transaksi tersimpan" disertai total.
- Isi keranjang yang belum disimpan dipertahankan di `sessionStorage` agar tidak hilang saat halaman dimuat ulang.

Jika belum ada produk, halaman menampilkan tautan ke halaman Produk.

## 6. Halaman Laporan

Pengguna melihat riwayat pembelian (transaksi) lengkap dengan waktu, memilih beberapa baris, dan langsung melihat jumlah (SUM) dari pilihan itu.

**Tabel riwayat**

| Kolom | Isi |
| --- | --- |
| Pilih | Kotak centang per baris; kotak centang di header memilih/membatalkan semua baris yang sedang tampil |
| No. transaksi | `id` transaksi, misalnya #0012 |
| Hari | Nama hari, misalnya Rabu |
| Tanggal | Tanggal, bulan, dan tahun, misalnya 28 Oktober 2026 |
| Jam | Format 24 jam, misalnya 11.45 |
| Item | Ringkasan, misalnya "Kopi × 2, Roti × 1"; baris dapat dibuka untuk melihat rincian tiap item |
| Total (Rp) | Total transaksi |

Urutan bawaan: terbaru di atas. Waktu memakai zona waktu perangkat pengguna.

**Filter**

- Filter Tahun, Bulan, dan Hari (atau pilihan cepat: Hari ini, Bulan ini, Semua) mempersempit tabel.
- Mengubah filter menghapus pilihan baris yang sudah tidak tampil, agar SUM tidak menghitung baris tersembunyi.

**Hitung pilihan (SUM)**

Panel ringkasan tetap terlihat di atas/bawah tabel dan diperbarui saat kotak centang berubah:

- Jumlah transaksi terpilih.
- Jumlah total produk = jumlah `qty` dari semua item di seluruh transaksi terpilih (unit, bukan jenis produk).
- Total penjualan = jumlah `total` semua transaksi terpilih.
- Total modal = jumlah `totalModal`.
- Laba kotor = total penjualan − total modal.
- Tombol Hapus pilihan membatalkan semua centang. Bila tidak ada yang dipilih, panel menampilkan Rp 0, 0 produk, dan petunjuk "Pilih transaksi untuk dijumlahkan".

Contoh: transaksi #0010 (Rp 15.000), #0011 (Rp 22.500), dan #0012 (Rp 8.000) dipilih → total penjualan Rp 45.500. Bila ketiganya masing-masing berisi 4, 3, dan 2 unit produk, jumlah total produk yang tampil adalah 9.

## 7. Kebutuhan non-fungsional

- **Offline:** seluruh fungsi berjalan tanpa internet; tidak ada panggilan jaringan, font, atau CDN eksternal.
- **Responsif:** nyaman dipakai dari lebar layar 360 px; target sentuh tombol minimal 44 px; navigasi tiga tab (Transaksi, Produk, Laporan) selalu terlihat.
- **Performa:** daftar 1.000 produk dan 10.000 transaksi tetap termuat di bawah 1 detik; pencarian dan filter memberi hasil di bawah 200 ms.
- **Format:** uang ditampilkan sebagai Rupiah dengan titik pemisah ribuan (`Rp 15.000`) lewat `Intl.NumberFormat('id-ID')`; tanggal berbahasa Indonesia.
- **Keamanan data:** teks yang berasal dari pengguna dimasukkan ke halaman lewat `textContent`, bukan `innerHTML`, untuk mencegah injeksi HTML.
- **Ketahanan:** setiap operasi IndexedDB menangani galat dan menampilkan pesan yang jelas; jika browser memblokir IndexedDB (misalnya mode privat), tampilkan peringatan bahwa data tidak dapat disimpan.
- **Persistensi:** meminta `navigator.storage.persist()` agar data tidak dihapus otomatis oleh browser.
- **Browser:** Chrome, Edge, Firefox, dan Safari dua versi terbaru.

**Risiko yang perlu diketahui:** data hanya ada di satu browser pada satu perangkat dan hilang bila pengguna menghapus data situs. Fitur cadangan (ekspor/impor JSON) disarankan sebagai prioritas pertama setelah versi 1.

## 8. Kriteria penerimaan dan tahapan

Versi 1 dianggap selesai bila semua kriteria berikut lolos diuji manual.

- [ ] Produk dapat ditambah, dilihat, diubah, dan dihapus; data tetap ada setelah halaman dimuat ulang.
- [ ] Nama produk kosong, harga negatif, atau nama ganda ditolak dengan pesan yang jelas.
- [ ] Halaman Transaksi menampilkan seluruh produk; menambah produk yang sama dua kali menaikkan jumlah, bukan membuat baris baru.
- [ ] Total keranjang selalu sama dengan jumlah (harga jual × jumlah) semua baris.
- [ ] Menyimpan transaksi membuat satu catatan, mengosongkan keranjang, dan muncul di Laporan dengan hari, tanggal, bulan, tahun, dan jam yang benar.
- [ ] Mengedit harga atau menghapus produk tidak mengubah transaksi lama di Laporan.
- [ ] Memilih beberapa transaksi menampilkan SUM yang benar dan langsung berubah saat centang ditambah atau dilepas.
- [ ] Filter tahun/bulan/hari bekerja, dan SUM hanya menghitung baris yang tampil.
- [ ] Seluruh alur berjalan dengan internet dimatikan dan nyaman di layar ponsel.

**Tahapan pengerjaan**

| Tahap | Isi | Estimasi |
| --- | --- | --- |
| 1 | Kerangka tiga halaman, navigasi, `db.js` dan skema IndexedDB | 1 hari |
| 2 | Halaman Produk (CRUD, validasi, pencarian) | 1 hari |
| 3 | Halaman Transaksi (daftar produk, keranjang, simpan) | 1–2 hari |
| 4 | Halaman Laporan (riwayat, filter, pilih, SUM) | 1–2 hari |
| 5 | Responsif, pengujian manual, perbaikan | 1 hari |

Pertanyaan terbuka: apakah transaksi perlu bisa dihapus atau diedit dari Laporan, dan apakah perlu kolom uang dibayar dan kembalian di halaman Transaksi? Keduanya belum dimasukkan ke versi 1.
