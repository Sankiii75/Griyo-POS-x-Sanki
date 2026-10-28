# Design System: Griyo POS Lite

Panduan komponen UI untuk aplikasi pencatat penjualan (HTML, CSS, JS, IndexedDB). Gaya visual diambil dari referensi UI kit aplikasi perbankan mobile: header biru tua, kartu putih, aksen biru muda, sudut membulat, dan tombol bergaya kapsul.

> Semua nilai warna dan ukuran di bawah adalah **perkiraan dari gambar referensi**, bukan nilai resmi dari desainer. Sesuaikan bila ada brand guideline sendiri.

## 1. Prinsip desain

- **Mobile-first:** dirancang untuk layar 360 px ke atas; di layar lebar, konten dibatasi lebar maksimum 480 px dan diletakkan di tengah.
- **Header gelap, isi terang:** area judul dan ringkasan berwarna biru tua, area kerja (form, daftar) berwarna putih.
- **Satu aksi utama per layar:** tombol biru tua penuh untuk aksi utama, tombol outline untuk aksi sekunder.
- **Angka uang selalu menonjol:** ukuran besar, tebal, rata kanan pada daftar.

## 2. Design tokens

```css
:root {
  /* Warna utama */
  --navy-900: #14386f;   /* gradasi gelap header */
  --navy-700: #1b4a8b;   /* header, tombol utama, keypad */
  --blue-500: #1fa5e8;   /* aksen, tab aktif, avatar, link */
  --blue-100: #e8f4fc;   /* latar ringan, hover baris */

  /* Netral */
  --white: #ffffff;
  --page-bg: #e6e5e3;    /* latar di luar "ponsel" (desktop) */
  --border: #c5cfdd;     /* garis input & tombol outline */
  --text: #26344f;       /* teks utama */
  --text-muted: #8591a6; /* label, keterangan, placeholder */
  --gray-600: #596273;   /* ikon "lainnya", tab nonaktif */

  /* Semantik */
  --positive: #2a9d8f;   /* pemasukan / sukses */
  --negative: #e8503a;   /* pengeluaran / hapus / error */
  --warning: #f5a623;    /* peringatan */

  /* Kategori (ikon bulat) */
  --cat-water: #1fa5e8;
  --cat-electric: #f5a623;
  --cat-gas: #ee5a3c;
  --cat-shop: #e8506e;
  --cat-card: #2a9d8f;
  --cat-more: #6a5cf0;

  /* Tipografi */
  --font: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  --fs-xs: 11px;  --fs-sm: 13px;  --fs-md: 15px;
  --fs-lg: 18px;  --fs-xl: 24px;  --fs-2xl: 32px;

  /* Jarak & bentuk */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;
  --sp-4: 16px; --sp-5: 24px; --sp-6: 32px;
  --radius-sm: 4px;   /* input, tombol */
  --radius-md: 12px;  /* kartu */
  --radius-lg: 28px;  /* bingkai layar (opsional) */
  --shadow: 0 8px 24px rgba(20, 56, 111, .18);
  --tap: 44px;        /* tinggi minimum target sentuh */
}
```

**Tipografi**

| Peran | Ukuran | Berat | Gaya |
| --- | --- | --- | --- |
| Judul header (mis. TRANSAKSI) | 15 px | 500 | HURUF KAPITAL, letter-spacing 0.08em |
| Saldo / total besar | 24–32 px | 700 | Warna putih atau navy |
| Label field | 11 px | 500 | HURUF KAPITAL, warna `--text-muted` |
| Isi teks | 13–15 px | 400 | Warna `--text` |
| Nama di daftar | 13 px | 500 | Baris kedua 11 px `--text-muted` |
| Teks tombol | 11–12 px | 600 | HURUF KAPITAL, letter-spacing 0.1em |

## 3. Komponen

### 3.1 App Bar (header halaman)

Bilah biru tua setinggi 56 px: ikon menu di kiri, tombol kembali, judul halaman rata tengah, ikon pengaturan di kanan.

```html
<header class="appbar">
  <button class="icon-btn" aria-label="Menu">☰</button>
  <h1 class="appbar__title">PRODUK</h1>
  <button class="icon-btn" aria-label="Pengaturan">⚙</button>
</header>
```

```css
.appbar { display:flex; align-items:center; justify-content:space-between;
  height:56px; padding:0 var(--sp-4); background:var(--navy-700); color:#fff; }
.appbar__title { font-size:var(--fs-md); font-weight:500;
  letter-spacing:.08em; text-transform:uppercase; }
.icon-btn { width:var(--tap); height:var(--tap); background:none; border:0; color:inherit; font-size:20px; }
```

### 3.2 Navigasi utama (tiga tab)

Ganti ikon hamburger menjadi bilah tab tetap di bawah layar: **Transaksi · Produk · Laporan**. Tab aktif memakai `--blue-500`, nonaktif `--text-muted`.

```css
.tabbar { position:fixed; bottom:0; left:0; right:0; display:flex;
  background:#fff; border-top:1px solid var(--border); }
.tabbar a { flex:1; min-height:var(--tap); display:grid; place-items:center;
  font-size:var(--fs-xs); color:var(--text-muted); text-decoration:none; }
.tabbar a[aria-current="page"] { color:var(--blue-500); font-weight:600; }
```

### 3.3 Tombol

| Varian | Tampilan | Dipakai untuk |
| --- | --- | --- |
| Primary | Latar `--navy-700`, teks putih, kapital | Simpan, Simpan transaksi |
| Secondary (outline) | Latar putih, garis `--navy-700`, teks navy | Batal |
| Danger | Garis/teks `--negative` | Hapus |
| Link | Teks `--blue-500`, bergaris bawah | Edit, lihat rincian |

```css
.btn { min-height:var(--tap); padding:0 var(--sp-5); border-radius:var(--radius-sm);
  font-size:var(--fs-xs); font-weight:600; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; }
.btn--primary { background:var(--navy-700); color:#fff; border:1px solid var(--navy-700); }
.btn--secondary { background:#fff; color:var(--navy-700); border:1px solid var(--navy-700); }
.btn--danger { background:#fff; color:var(--negative); border:1px solid var(--negative); }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.btn-row { display:flex; align-items:center; gap:var(--sp-3); } /* "SIMPAN  atau  BATAL" */
```

### 3.4 Input teks, angka, dan select

Label kapital kecil di atas, kotak outline 1 px, tinggi 44 px. Keadaan fokus: garis `--blue-500`. Keadaan error: garis `--negative` dan pesan 11 px di bawah.

```html
<label class="field">
  <span class="field__label">Nama produk</span>
  <input class="field__input" type="text" maxlength="100" required>
  <span class="field__error" hidden>Nama produk wajib diisi</span>
</label>
```

```css
.field { display:block; margin-bottom:var(--sp-4); }
.field__label { display:block; margin-bottom:var(--sp-1); font-size:var(--fs-xs);
  font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); }
.field__input { width:100%; min-height:var(--tap); padding:0 var(--sp-3);
  border:1px solid var(--border); border-radius:var(--radius-sm); font-size:var(--fs-md); }
.field__input:focus { outline:0; border-color:var(--blue-500); box-shadow:0 0 0 3px rgba(31,165,232,.2); }
.field--error .field__input { border-color:var(--negative); }
.field__error { color:var(--negative); font-size:var(--fs-xs); }
.field__input--money { text-align:right; font-weight:600; } /* seperti kolom 2,195.00 */
```

Input uang: awalan `Rp` di kiri, angka rata kanan, diformat dengan titik ribuan.

### 3.5 Kartu ringkasan (saldo)

Kartu putih membulat yang menumpuk di tepi bawah header biru, berisi label kecil, angka besar, dan satu tombol. Dipakai di Laporan untuk **panel hasil pilihan (SUM)**.

```html
<section class="summary">
  <p class="summary__label">TOTAL PENJUALAN TERPILIH</p>
  <p class="summary__value">Rp 45.500</p>
  <dl class="summary__meta">
    <div><dt>Transaksi</dt><dd>3</dd></div>
    <div><dt>Total produk</dt><dd>9</dd></div>
    <div><dt>Laba kotor</dt><dd>Rp 12.000</dd></div>
  </dl>
  <button class="btn btn--primary">Hapus pilihan</button>
</section>
```

```css
.summary { margin:-32px var(--sp-4) var(--sp-4); padding:var(--sp-4); text-align:center;
  background:#fff; border-radius:var(--radius-md); box-shadow:var(--shadow); }
.summary__label { font-size:var(--fs-xs); letter-spacing:.1em; color:var(--blue-500); }
.summary__value { font-size:var(--fs-2xl); font-weight:700; color:var(--navy-700); }
.summary__meta { display:flex; justify-content:space-around; margin:var(--sp-3) 0;
  font-size:var(--fs-sm); color:var(--text-muted); }
.summary__meta dd { color:var(--text); font-weight:600; }
```

### 3.5b Header ringkasan (blok biru)

Blok biru di bawah App Bar yang memuat ikon dan angka besar berwarna putih (seperti layar Payment). Dipakai untuk menampilkan **total keranjang** di halaman Transaksi.

```css
.hero { padding:var(--sp-5) var(--sp-4) 48px; background:linear-gradient(var(--navy-700), var(--navy-900)); color:#fff; }
.hero__label { font-size:var(--fs-xs); color:var(--blue-500); letter-spacing:.1em; text-transform:uppercase; }
.hero__value { font-size:var(--fs-xl); font-weight:700; }
```

### 3.6 Item daftar (riwayat dan produk)

Titik bulat berwarna di kiri, dua baris teks di tengah (nama + keterangan), nominal rata kanan. Hijau untuk positif, merah untuk negatif.

```html
<li class="row">
  <span class="row__dot"></span>
  <div class="row__main">
    <p class="row__title">Kopi × 2, Roti × 1</p>
    <p class="row__sub">Rabu, 28 Oktober 2026 · 11.45</p>
  </div>
  <span class="row__amount">Rp 22.500</span>
</li>
```

```css
.row { display:flex; align-items:center; gap:var(--sp-3); min-height:56px;
  padding:var(--sp-2) var(--sp-4); border-bottom:1px solid #eef1f6; }
.row__dot { width:20px; height:20px; border-radius:50%; background:var(--navy-700); flex:none; }
.row__title { font-size:var(--fs-sm); font-weight:500; }
.row__sub { font-size:var(--fs-xs); color:var(--text-muted); }
.row__amount { margin-left:auto; font-size:var(--fs-sm); font-weight:600; }
.row--selected { background:var(--blue-100); }
```

Untuk **Laporan**, tambahkan kotak centang 24 px di paling kiri baris; baris terpilih memakai `.row--selected`.

### 3.7 Tab segmen (filter status)

Dua tab kapsul di atas daftar: tab aktif biru muda berisi teks putih, tab nonaktif abu-abu. Dipakai untuk filter cepat di Laporan: **Hari ini · Bulan ini · Semua**.

```css
.segment { display:flex; gap:var(--sp-2); padding:var(--sp-3) var(--sp-4); background:var(--navy-700); }
.segment button { flex:1; min-height:40px; border:0; border-radius:var(--radius-md) var(--radius-md) 0 0;
  background:var(--gray-600); color:#fff; font-size:var(--fs-xs); font-weight:600; letter-spacing:.1em; text-transform:uppercase; }
.segment button[aria-selected="true"] { background:var(--blue-500); }
```

### 3.8 Paginasi

Panah kiri/kanan dengan bulatan bernomor; halaman aktif berlatar `--blue-500`. Dipakai bila riwayat melebihi 20 baris per halaman.

```css
.pager { display:flex; align-items:center; justify-content:center; gap:var(--sp-2); padding:var(--sp-4); }
.pager button { width:28px; height:28px; border-radius:50%; border:0; background:#e9edf3; font-size:var(--fs-xs); }
.pager button[aria-current="page"] { background:var(--blue-500); color:#fff; }
```

### 3.9 Keypad angka (jumlah produk)

Papan angka 3 kolom bertombol biru tua dengan garis pemisah putih, dipakai untuk mengisi **jumlah (qty)** di keranjang. Baris terakhir: `00`, `0`, `⌫`.

```html
<div class="keypad" role="group" aria-label="Keypad jumlah">
  <button>1</button><button>2</button><button>3</button>
  <button>4</button><button>5</button><button>6</button>
  <button>7</button><button>8</button><button>9</button>
  <button>00</button><button>0</button><button aria-label="Hapus">⌫</button>
</div>
```

```css
.keypad { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:#fff; }
.keypad button { min-height:52px; border:0; background:var(--navy-700); color:#fff; font-size:var(--fs-lg); }
.keypad button:active { background:var(--blue-500); }
```

### 3.10 Kartu produk berikon (grid kategori)

Ikon bulat 56 px berwarna dengan label di bawahnya, tersusun 3 kolom. Dipakai di halaman Transaksi sebagai **grid pilihan produk**: ketuk untuk menambah 1 unit ke keranjang. Warna ikon diambil dari token `--cat-*` (bergilir) atau inisial nama produk di dalam bulatan.

```html
<button class="tile">
  <span class="tile__icon" style="background:var(--cat-water)">K</span>
  <span class="tile__name">Kopi</span>
  <span class="tile__price">Rp 5.000</span>
</button>
```

```css
.tiles { display:grid; grid-template-columns:repeat(3,1fr); gap:var(--sp-4); padding:var(--sp-4); }
.tile { display:grid; justify-items:center; gap:var(--sp-1); background:none; border:0; min-height:var(--tap); }
.tile__icon { width:56px; height:56px; border-radius:50%; display:grid; place-items:center;
  color:#fff; font-size:var(--fs-lg); font-weight:700; }
.tile__name { font-size:var(--fs-xs); color:var(--text); }
.tile__price { font-size:var(--fs-xs); color:var(--text-muted); }
```

### 3.11 Stepper jumlah (baris keranjang)

Kontrol `−  [ angka ]  +` dengan kotak angka rata kanan, tinggi 40 px, tombol ± sebagai tombol outline.

```css
.stepper { display:inline-flex; align-items:center; gap:var(--sp-1); }
.stepper button { width:40px; height:40px; border:1px solid var(--border); background:#fff; border-radius:var(--radius-sm); font-size:var(--fs-lg); }
.stepper input { width:56px; height:40px; text-align:right; border:1px solid var(--border); border-radius:var(--radius-sm); font-weight:600; }
```

### 3.12 Avatar / ikon identitas

Lingkaran 80 px putih dengan siluet biru muda, dipakai di halaman Pengaturan (nama toko). Pada versi 1 opsional.

### 3.13 Notifikasi dan konfirmasi

- **Toast:** kapsul `--navy-700`, teks putih, muncul 3 detik di atas tab bar ("Transaksi tersimpan, total Rp 22.500").
- **Dialog konfirmasi:** kartu putih `--radius-md`, dua tombol sejajar (Batal outline, Hapus danger).
- **Keadaan kosong:** ikon abu-abu, satu kalimat, dan satu tombol primary.

```css
.toast { position:fixed; left:50%; bottom:72px; transform:translateX(-50%); padding:var(--sp-3) var(--sp-5);
  background:var(--navy-700); color:#fff; border-radius:999px; font-size:var(--fs-sm); box-shadow:var(--shadow); }
```

## 4. Pemetaan komponen ke halaman

| Halaman | Komponen yang dipakai |
| --- | --- |
| **Produk** | App Bar · Input teks dan uang (nama, harga beli, harga jual) · Tombol Primary + Secondary (Simpan / Batal) · Item daftar dengan tautan Edit/Hapus · Kolom cari · Dialog konfirmasi hapus · Keadaan kosong |
| **Transaksi** | App Bar · Kolom cari · Grid kartu produk · Baris keranjang (Item daftar + Stepper) · Header ringkasan (total) · Keypad angka (opsional untuk qty) · Tombol Primary "Simpan transaksi" · Toast |
| **Laporan** | App Bar · Tab segmen (Hari ini / Bulan ini / Semua) · Filter tahun/bulan/hari (select) · Item daftar dengan kotak centang · Kartu ringkasan SUM (jumlah transaksi, jumlah total produk, total penjualan, laba kotor) · Paginasi |

## 5. Aksesibilitas

- Target sentuh minimal 44 × 44 px (`--tap`).
- Kontras teks putih di atas `--navy-700` dan teks `--text` di atas putih memenuhi WCAG AA; **teks `--blue-500` di atas putih hanya untuk teks besar atau tebal** (kontrasnya di bawah 4.5:1 untuk teks kecil), jadi untuk link kecil gunakan `--navy-700`.
- Jangan hanya mengandalkan warna hijau/merah untuk membedakan angka; tambahkan tanda `+` atau `−`.
- Semua tombol ikon memiliki `aria-label`; tab aktif memakai `aria-current="page"` atau `aria-selected`.
- Fokus keyboard selalu terlihat (lingkaran `--blue-500`).

## 6. Responsif

| Lebar | Perilaku |
| --- | --- |
| < 480 px | Satu kolom penuh, tab bar tetap di bawah |
| 480–768 px | Konten di tengah dengan lebar maks 480 px, latar `--page-bg` |
| > 768 px | Halaman Transaksi dua kolom: grid produk di kiri, keranjang di kanan (320 px) |

## 7. Catatan implementasi

- Satu berkas `css/style.css` berisi token di `:root` dan seluruh komponen di atas, dipakai bersama oleh `produk.html`, `transaksi.html`, dan `laporan.html`.
- Ikon memakai SVG inline atau karakter Unicode agar aplikasi tetap berjalan **tanpa internet** (tanpa CDN ikon atau font eksternal).
- Format uang lewat `Intl.NumberFormat('id-ID')` (`Rp 15.000`); gambar referensi memakai gaya Inggris (`$4,180.20`) sehingga **perlu disesuaikan**.
- Teks pengguna dimasukkan dengan `textContent`, bukan `innerHTML`.
- Elemen dekoratif pada gambar referensi yang **tidak dipakai** di versi 1: halaman login, tambah kartu, QR/barcode, dan penukaran mata uang.
