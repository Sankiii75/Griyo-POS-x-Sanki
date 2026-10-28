# Griyo POS Lite (Aplikasi Pencatat Penjualan)

Aplikasi kasir dan pencatat penjualan offline-first yang cepat, ringan, tanpa server, dan tanpa dependensi eksternal (murni HTML, CSS, JavaScript, dan IndexedDB).

## Fitur Utama

1. **Kelola Produk (`produk.html`)**
   - Formulir tambah dan edit produk disajikan dalam modal popup interaktif yang bersih dan fokus.
   - Tambah produk dengan nama, harga beli (modal), dan harga jual.
   - Peringatan jika harga jual lebih kecil dari modal (tetap diizinkan simpan).
   - Validasi nama ganda (case-insensitive) dan harga minimal 0.
   - Edit produk dan hapus produk dengan dialog konfirmasi.
   - Pencarian produk langsung berdasarkan nama (real-time filter).
   - Diurutkan A–Z secara otomatis.

2. **Kasir & Transaksi (`transaksi.html`)**
   - Katalog produk dalam grid visual dengan inisial warna bertema.
   - Pencarian cepat produk.
   - Keranjang belanja interaktif: setiap baris memuat nama, harga beli satuan, kontrol jumlah (`−`, angka, `+`), subtotal, dan tombol hapus baris.
   - Mengurangi kuantitas dari 1 ke 0 meminta konfirmasi penghapusan baris.
   - Fitur **Kosongkan Keranjang** dengan dialog konfirmasi.
   - Auto-save keranjang di `sessionStorage` sehingga tidak hilang saat halaman di-refresh.
   - Simpan transaksi dengan mencatat snapshot produk (nama, harga beli, harga jual saat transaksi dilakukan) agar laporan masa lalu tidak terpengaruh jika produk di kemudian hari diedit atau dihapus.

3. **Laporan & Rekap Penjualan (`laporan.html`)**
   - Riwayat transaksi tersusun dari yang terbaru.
   - Format waktu Indonesia lengkap: Hari, Tanggal Bulan Tahun, dan Jam (24 jam).
   - Tampilan rincian item (accordion) per transaksi: menampilkan harga beli, harga jual, dan laba per item serta total beli, total jual, dan selisih/laba per transaksi.
   - **Fitur Rekap Cepat (SUM):** Centang satu atau beberapa transaksi untuk langsung menghitung:
     - Jumlah Harga Beli (Modal)
     - Jumlah Harga Jual
     - Selisih / Laba (Untung/Rugi)
     - Jumlah Transaksi Terpilih & Total Unit Produk
     - Persentase Margin (%)
   - Tombol **Hapus Pilihan** dan checkbox **Pilih Semua yang Tampil**.
   - Filter cepat: **Hari Ini**, **Bulan Ini**, **Semua**, serta pemilih **Tanggal Khusus**.
   - Mengubah filter otomatis membersihkan pilihan yang tersembunyi agar hasil SUM selalu akurat.
   - Paginasi otomatis (20 transaksi per halaman).

4. **100% Offline & Ringan**
   - Tidak menggunakan font eksternal, framework besar, atau CDN pihak ketiga.
   - Menggunakan ikon SVG dan karakter Unicode inline.
   - Data disimpan persisten di browser pengguna menggunakan IndexedDB (`griyo_lite` v1).

## Struktur Berkas

```
/index.html          → Redirect otomatis ke transaksi.html
/produk.html         → Halaman kelola produk
/transaksi.html      → Halaman kasir dan keranjang transaksi
/laporan.html        → Halaman riwayat laporan dan rekap (SUM)
/css/style.css       → Styling bersama, tokens, dan responsif (mobile & desktop)
/js/db.js            → Inisialisasi IndexedDB dan fungsi CRUD (Promise)
/js/produk.js        → Logika kelola produk
/js/transaksi.js     → Logika kasir dan keranjang belanja
/js/laporan.js       → Logika riwayat, filter, dan rekap SUM
/js/util.js          → Format Rupiah, waktu Indonesia, toast, modal konfirmasi
/buka_aplikasi.bat   → Pintasan cepat membuka aplikasi di peramban Windows
```

## Cara Menjalankan

1. Cukup klik ganda pada file `index.html` atau `buka_aplikasi.bat`.
2. Atau buka menggunakan ekstensi Live Server di editor / server web statis pilihan Anda.

