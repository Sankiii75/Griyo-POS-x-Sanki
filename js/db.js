/**
 * Griyo POS Lite - IndexedDB Manager
 * Database: griyo_lite (v1)
 * Object stores: products, transactions
 */

const DB_NAME = 'griyo_lite';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Inisialisasi IndexedDB dan request storage persistence
 */
function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      const err = new Error('Browser Anda tidak mendukung IndexedDB atau sedang dinonaktifkan.');
      console.error(err);
      reject(err);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object store: products
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        productStore.createIndex('nama', 'nama', { unique: false });
      }

      // Object store: transactions
      if (!db.objectStoreNames.contains('transactions')) {
        const transStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transStore.createIndex('waktu', 'waktu', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;

      // Minta persistensi storage agar tidak dibersihkan otomatis oleh browser
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((persistent) => {
          if (persistent) {
            console.log('Penyimpanan IndexedDB bersifat persisten.');
          } else {
            console.log('Penyimpanan IndexedDB tidak dijamin persisten.');
          }
        }).catch((e) => console.warn('Gagal meminta persistensi storage:', e));
      }

      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(new Error('Gagal membuka IndexedDB. Kemungkinan browser dalam mode privat atau memblokir penyimpanan lokal.'));
    };
  });

  return dbPromise;
}

// ----------------------------------------------------
// CRUD: Products
// ----------------------------------------------------

async function getAllProducts() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result || [];
      // Urutkan A-Z secara lokal berdasarkan nama
      list.sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
      resolve(list);
    };

    request.onerror = () => reject(request.error);
  });
}

async function getProductById(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const request = store.get(Number(id));

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function addProduct(data) {
  const db = await getDB();
  const all = await getAllProducts();

  // Validasi keunikan nama case-insensitive
  const trimmedName = data.nama.trim();
  const duplicate = all.some(
    (p) => p.nama.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Produk dengan nama "${trimmedName}" sudah ada.`);
  }

  const now = Date.now();
  const newProduct = {
    nama: trimmedName,
    hargaBeli: Math.max(0, Math.round(Number(data.hargaBeli) || 0)),
    hargaJual: Math.max(0, Math.round(Number(data.hargaJual) || 0)),
    createdAt: now,
    updatedAt: now
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.add(newProduct);

    request.onsuccess = () => resolve({ id: request.result, ...newProduct });
    request.onerror = () => reject(request.error);
  });
}

async function updateProduct(id, data) {
  const db = await getDB();
  const existing = await getProductById(id);
  if (!existing) {
    throw new Error('Produk tidak ditemukan.');
  }

  const all = await getAllProducts();
  const trimmedName = data.nama.trim();
  const duplicate = all.some(
    (p) => p.id !== id && p.nama.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Produk lain dengan nama "${trimmedName}" sudah ada.`);
  }

  const updated = {
    ...existing,
    nama: trimmedName,
    hargaBeli: Math.max(0, Math.round(Number(data.hargaBeli) || 0)),
    hargaJual: Math.max(0, Math.round(Number(data.hargaJual) || 0)),
    updatedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.put(updated);

    request.onsuccess = () => resolve(updated);
    request.onerror = () => reject(request.error);
  });
}

async function deleteProduct(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.delete(Number(id));

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ----------------------------------------------------
// CRUD: Transactions
// ----------------------------------------------------

async function getAllTransactions() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readonly');
    const store = transaction.objectStore('transactions');
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result || [];
      // Urutan bawaan: terbaru di atas (waktu menurun)
      list.sort((a, b) => b.waktu - a.waktu);
      resolve(list);
    };

    request.onerror = () => reject(request.error);
  });
}

async function addTransaction(data) {
  const db = await getDB();

  if (!data.items || !data.items.length) {
    throw new Error('Keranjang belanja kosong.');
  }

  const waktu = data.waktu || Date.now();
  
  // Pastikan snapshot item lengkap dan terisolasi
  const itemsSnapshot = data.items.map((item) => {
    const qty = Math.max(1, Math.round(Number(item.qty) || 1));
    const hargaBeli = Math.max(0, Math.round(Number(item.hargaBeli) || 0));
    const hargaJual = Math.max(0, Math.round(Number(item.hargaJual) || 0));
    const subtotal = hargaBeli * qty;

    return {
      productId: item.productId,
      nama: String(item.nama || '').trim(),
      hargaBeli,
      hargaJual,
      qty,
      subtotal
    };
  });

  const total = itemsSnapshot.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalModal = total;

  const newTrans = {
    waktu,
    items: itemsSnapshot,
    total,
    totalModal
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readwrite');
    const store = transaction.objectStore('transactions');
    const request = store.add(newTrans);

    request.onsuccess = () => resolve({ id: request.result, ...newTrans });
    request.onerror = () => reject(request.error);
  });
}

async function deleteTransaction(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('transactions', 'readwrite');
    const store = transaction.objectStore('transactions');
    const request = store.delete(Number(id));

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Pasang ke window untuk direct file:// dan http://
if (typeof window !== 'undefined') {
  window.GriyoDB = {
    getDB,
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getAllTransactions,
    addTransaction,
    deleteTransaction
  };
}

