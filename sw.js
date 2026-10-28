/**
 * Griyo POS Lite - Service Worker
 * Menyediakan kapabilitas offline penuh (Cache-First + Network Fallback & Update)
 */

const CACHE_NAME = 'griyo-pos-lite-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './transaksi.html',
  './produk.html',
  './laporan.html',
  './css/style.css',
  './js/util.js',
  './js/db.js',
  './js/produk.js',
  './js/transaksi.js',
  './js/laporan.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-icon-512.png',
  './icons/icon.svg'
];

// 1. Install Event: Pre-cache seluruh aset aplikasi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching aset aplikasi offline...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Menghapus cache lawas:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Stale-While-Revalidate untuk aset lokal
self.addEventListener('fetch', (event) => {
  // Hanya tangani request HTTP/HTTPS dengan metode GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jika request berasal dari origin yang sama
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Fetch dari network untuk memperbarui cache secara background
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika network offline dan permintaan adalah navigasi halaman, fallback ke transaksi.html
            if (event.request.mode === 'navigate') {
              return caches.match('./transaksi.html');
            }
          });

        // Kembalikan versi cache jika ada, jika belum ada tunggu network
        return cachedResponse || fetchPromise;
      })
    );
  }
});

