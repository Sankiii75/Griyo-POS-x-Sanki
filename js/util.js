/**
 * Griyo POS Lite - Utility Functions
 * Format uang, tanggal, modal konfirmasi, toast, dan keamanan DOM.
 */

// Format angka ke format Rupiah (contoh: Rp 15.000)
function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  const formatted = new Intl.NumberFormat('id-ID').format(num);
  return `Rp ${formatted}`;
}

// Parse string atau input angka ke integer
function parseRupiahInput(value) {
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  if (!value) return 0;
  const clean = value.toString().replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

// Format waktu epoch ms ke format Indonesia
function formatWaktu(epochMs) {
  const d = new Date(epochMs);
  
  // Nama hari
  const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
  
  // Tanggal bulan tahun
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
  
  // Jam (24 jam: contoh 11.45)
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const jam = `${hours}.${minutes}`;

  return {
    hari,
    tanggal,
    jam,
    full: `${hari}, ${tanggal} · ${jam}`,
    dateOnly: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  };
}

// Format nomor transaksi, misal #0012
function formatTransactionId(id) {
  return `#${String(id).padStart(4, '0')}`;
}

// Escape HTML untuk mencegah injeksi XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Warna kategori siklis untuk produk
const CAT_COLORS = [
  'var(--cat-water)',
  'var(--cat-electric)',
  'var(--cat-gas)',
  'var(--cat-shop)',
  'var(--cat-card)',
  'var(--cat-more)'
];

function getProductColor(indexOrId) {
  const idx = Math.abs(Number(indexOrId) || 0) % CAT_COLORS.length;
  return CAT_COLORS[idx];
}

// Dapatkan inisial produk (maksimal 2 huruf)
function getProductInitial(nama) {
  if (!nama) return '?';
  const parts = nama.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Tampilkan Toast notifikasi
let toastTimeout = null;
function showToast(message, duration = 3000) {
  let toastEl = document.getElementById('app-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'app-toast';
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add('toast--visible');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('toast--visible');
  }, duration);
}

// Dialog Konfirmasi Modal
function showConfirmDialog({
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isDanger = true
}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('app-confirm-dialog');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'app-confirm-dialog';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-card" role="dialog" aria-modal="true">
          <h3 class="modal-title"></h3>
          <p class="modal-message"></p>
          <div class="modal-actions">
            <button type="button" class="btn btn--secondary modal-btn-cancel"></button>
            <button type="button" class="btn modal-btn-confirm"></button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const titleEl = overlay.querySelector('.modal-title');
    const messageEl = overlay.querySelector('.modal-message');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');
    const confirmBtn = overlay.querySelector('.modal-btn-confirm');

    titleEl.textContent = title;
    messageEl.textContent = message;
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;

    if (isDanger) {
      confirmBtn.className = 'btn btn--danger modal-btn-confirm';
    } else {
      confirmBtn.className = 'btn btn--primary modal-btn-confirm';
    }

    overlay.classList.add('modal-overlay--active');
    confirmBtn.focus();

    function cleanup(result) {
      overlay.classList.remove('modal-overlay--active');
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeyDown);
      resolve(result);
    }

    function onCancel() {
      cleanup(false);
    }

    function onConfirm() {
      cleanup(true);
    }

    function onBackdrop(e) {
      if (e.target === overlay) cleanup(false);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup(false);
    }

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeyDown);
  });
}

// Pasang ke window untuk compatibility langsung file:// dan http://
if (typeof window !== 'undefined') {
  window.GriyoUtil = {
    formatRupiah,
    parseRupiahInput,
    formatWaktu,
    formatTransactionId,
    escapeHtml,
    getProductColor,
    getProductInitial,
    showToast,
    showConfirmDialog
  };
}

