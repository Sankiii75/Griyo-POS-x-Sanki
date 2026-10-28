/**
 * Griyo POS Lite - PWA Controller
 * Menangani pendaftaran Service Worker dan prompt instalasi aplikasi.
 */

(function () {
  let deferredPrompt = null;

  // 1. Daftarkan Service Worker jika protokol mendukung (http/https)
  if ('serviceWorker' in navigator) {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker aktif dengan scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Registrasi Service Worker gagal:', error);
          });
      });
    }
  }

  // 2. Tangani event instalasi PWA (beforeinstallprompt)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Mencegah browser menampilkan mini-infobar default otomatis
    e.preventDefault();
    deferredPrompt = e;

    // Tampilkan tombol / banner pasang jika belum terpasang
    renderInstallBanner();
  });

  // 3. Deteksi saat aplikasi telah berhasil diinstal
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplikasi Griyo POS Lite berhasil diinstal.');
    deferredPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    if (window.GriyoUtil && window.GriyoUtil.showToast) {
      window.GriyoUtil.showToast('Aplikasi berhasil dipasang di perangkat!');
    }
  });

  /**
   * Tampilkan banner instalasi yang ramah pengguna
   */
  function renderInstallBanner() {
    // Jangan tampilkan jika sudah dalam mode standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-banner';
    banner.innerHTML = `
      <div class="pwa-banner__content">
        <img src="icons/icon-192.png" alt="Griyo POS" class="pwa-banner__icon" width="36" height="36">
        <div class="pwa-banner__text">
          <p class="pwa-banner__title">Pasang Griyo POS Lite</p>
          <p class="pwa-banner__desc">Akses cepat & bekerja offline tanpa browser</p>
        </div>
      </div>
      <div class="pwa-banner__actions">
        <button type="button" class="btn btn--secondary pwa-btn-dismiss" style="min-height:34px; padding:0 10px; font-size:11px;">Nanti</button>
        <button type="button" class="btn btn--primary pwa-btn-install" style="min-height:34px; padding:0 14px; font-size:11px;">Pasang</button>
      </div>
    `;

    document.body.appendChild(banner);

    const installBtn = banner.querySelector('.pwa-btn-install');
    const dismissBtn = banner.querySelector('.pwa-btn-dismiss');

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner.remove();
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Pengguna menyetujui instalasi.');
      } else {
        console.log('[PWA] Pengguna membatalkan instalasi.');
      }
      deferredPrompt = null;
    });

    dismissBtn.addEventListener('click', () => {
      banner.remove();
    });
  }
})();

