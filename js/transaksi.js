/**
 * Griyo POS Lite - Transaksi Controller
 */

(function () {
  const { getAllProducts, addTransaction } = window.GriyoDB;
  const {
    formatRupiah,
    getProductColor,
    getProductInitial,
    showToast,
    showConfirmDialog
  } = window.GriyoUtil;

  // Kunci penyimpanan sementara keranjang di sessionStorage
  const STORAGE_CART_KEY = 'griyo_cart';

  // DOM Elemen
  const heroTotalVal = document.getElementById('hero-total-val');
  const heroTotalSub = document.getElementById('hero-total-sub');
  const cartBadge = document.getElementById('cart-item-count-badge');

  const searchInput = document.getElementById('trans-search-input');
  const productTiles = document.getElementById('product-tiles');
  const productCountLabel = document.getElementById('trans-product-count');
  const noProductsState = document.getElementById('no-products-state');
  const noMatchState = document.getElementById('no-match-state');
  const noMatchText = document.getElementById('no-match-text');

  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartEmptyMessage = document.getElementById('cart-empty-message');
  const footerTotalQty = document.getElementById('footer-total-qty');
  const footerGrandTotal = document.getElementById('footer-grand-total');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const btnSaveTransaction = document.getElementById('btn-save-transaction');

  // State lokal
  let catalog = [];
  let cart = [];
  let searchQuery = '';

  /**
   * Muat keranjang dari sessionStorage
   */
  function loadCartFromSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          cart = parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca sessionStorage keranjang:', e);
      cart = [];
    }
  }

  /**
   * Simpan keranjang ke sessionStorage
   */
  function saveCartToSession() {
    try {
      sessionStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Gagal menyimpan keranjang ke sessionStorage:', e);
    }
  }

  /**
   * Tambah 1 unit produk ke keranjang
   */
  function addToCart(product) {
    const existing = cart.find((item) => item.productId === product.id);

    if (existing) {
      existing.qty += 1;
      existing.subtotal = existing.qty * existing.hargaJual;
    } else {
      cart.push({
        productId: product.id,
        nama: product.nama,
        hargaBeli: product.hargaBeli,
        hargaJual: product.hargaJual,
        qty: 1,
        subtotal: product.hargaJual
      });
    }

    saveCartToSession();
    renderCart();

    showToast(`"${product.nama}" ditambahkan ke keranjang`, 1200);
  }

  /**
   * Ubah qty item dalam keranjang
   */
  async function updateCartQty(productId, newQty) {
    const index = cart.findIndex((item) => item.productId === productId);
    if (index === -1) return;

    const item = cart[index];

    if (newQty <= 0) {
      // Kurang dari 1 memicu konfirmasi hapus baris sesuai PRD
      const confirmed = await showConfirmDialog({
        title: 'Hapus Item?',
        message: `Hapus "${item.nama}" dari keranjang belanja?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        isDanger: true
      });

      if (confirmed) {
        cart.splice(index, 1);
      }
    } else {
      item.qty = Math.round(newQty);
      item.subtotal = item.qty * item.hargaJual;
    }

    saveCartToSession();
    renderCart();
  }

  /**
   * Hapus langsung item dari keranjang dengan konfirmasi
   */
  async function removeCartItem(productId) {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const confirmed = await showConfirmDialog({
      title: 'Hapus Item?',
      message: `Hapus "${item.nama}" dari keranjang belanja?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      isDanger: true
    });

    if (confirmed) {
      cart = cart.filter((i) => i.productId !== productId);
      saveCartToSession();
      renderCart();
    }
  }

  /**
   * Kosongkan seluruh isi keranjang
   */
  async function clearCart() {
    if (cart.length === 0) return;

    const confirmed = await showConfirmDialog({
      title: 'Kosongkan Keranjang?',
      message: 'Apakah Anda yakin ingin membatalkan dan mengosongkan semua pesanan di keranjang?',
      confirmText: 'Kosongkan',
      cancelText: 'Kembali',
      isDanger: true
    });

    if (confirmed) {
      cart = [];
      saveCartToSession();
      renderCart();
      showToast('Keranjang telah dikosongkan.');
    }
  }

  /**
   * Simpan transaksi ke IndexedDB
   */
  async function handleSaveTransaction() {
    if (cart.length === 0) {
      showToast('Keranjang belanja masih kosong.');
      return;
    }

    btnSaveTransaction.disabled = true;
    btnSaveTransaction.textContent = 'Menyimpan...';

    try {
      const total = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
      const totalModal = cart.reduce((acc, curr) => acc + (curr.hargaBeli * curr.qty), 0);

      const result = await addTransaction({
        items: cart,
        total,
        totalModal,
        waktu: Date.now()
      });

      // Kosongkan keranjang & session storage
      cart = [];
      saveCartToSession();
      renderCart();

      showToast(`Transaksi tersimpan, total ${formatRupiah(result.total)}!`, 4000);
    } catch (err) {
      console.error('Error saat menyimpan transaksi:', err);
      showToast(`Gagal menyimpan transaksi: ${err.message}`);
    } finally {
      btnSaveTransaction.textContent = 'Simpan Transaksi';
      btnSaveTransaction.disabled = cart.length === 0;
    }
  }

  /**
   * Render Grid Produk
   */
  function renderProductCatalog() {
    const filtered = catalog.filter((p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    productCountLabel.textContent = `${filtered.length} produk`;

    productTiles.textContent = '';

    if (catalog.length === 0) {
      noProductsState.hidden = false;
      productTiles.hidden = true;
      noMatchState.hidden = true;
      return;
    }

    noProductsState.hidden = true;

    if (filtered.length === 0) {
      productTiles.hidden = true;
      noMatchState.hidden = false;
      noMatchText.textContent = `Tidak ada produk yang cocok dengan "${searchQuery}".`;
      return;
    }

    noMatchState.hidden = true;
    productTiles.hidden = false;

    filtered.forEach((product, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tile';
      button.setAttribute('aria-label', `Tambah ${product.nama} (${formatRupiah(product.hargaJual)}) ke keranjang`);

      const icon = document.createElement('span');
      icon.className = 'tile__icon';
      icon.style.background = getProductColor(product.id || idx);
      icon.textContent = getProductInitial(product.nama);

      const name = document.createElement('span');
      name.className = 'tile__name';
      name.textContent = product.nama;

      const price = document.createElement('span');
      price.className = 'tile__price';
      price.textContent = formatRupiah(product.hargaJual);

      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(price);

      button.addEventListener('click', () => addToCart(product));

      productTiles.appendChild(button);
    });
  }

  /**
   * Render Keranjang Belanja dan Panel Total
   */
  function renderCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    // Update Hero & Footer
    heroTotalVal.textContent = formatRupiah(grandTotal);
    cartBadge.textContent = `${totalQty} Unit`;
    footerTotalQty.textContent = `${totalQty} unit (${cart.length} jenis)`;
    footerGrandTotal.textContent = formatRupiah(grandTotal);

    if (cart.length === 0) {
      heroTotalSub.textContent = 'Pilih produk di katalog untuk memulai transaksi';
      cartEmptyMessage.hidden = false;
      cartItemsContainer.hidden = true;
      btnClearCart.style.visibility = 'hidden';
      btnSaveTransaction.disabled = true;
    } else {
      heroTotalSub.textContent = `${cart.length} jenis produk di keranjang`;
      cartEmptyMessage.hidden = true;
      cartItemsContainer.hidden = false;
      btnClearCart.style.visibility = 'visible';
      btnSaveTransaction.disabled = false;
    }

    // Render baris item keranjang
    cartItemsContainer.textContent = '';

    cart.forEach((item) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item';

      const info = document.createElement('div');
      info.className = 'cart-item__info';

      const name = document.createElement('div');
      name.className = 'cart-item__name';
      name.textContent = item.nama;

      const price = document.createElement('div');
      price.className = 'cart-item__price';
      price.textContent = `${formatRupiah(item.hargaJual)} / unit`;

      const subtotal = document.createElement('div');
      subtotal.className = 'cart-item__subtotal';
      subtotal.textContent = formatRupiah(item.subtotal);

      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(subtotal);

      const controls = document.createElement('div');
      controls.className = 'cart-item__controls';

      const stepper = document.createElement('div');
      stepper.className = 'stepper';

      const minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.setAttribute('aria-label', `Kurangi jumlah ${item.nama}`);
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', () => updateCartQty(item.productId, item.qty - 1));

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = item.qty;
      qtyInput.setAttribute('aria-label', `Jumlah unit ${item.nama}`);
      qtyInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val <= 0) {
          updateCartQty(item.productId, 0);
        } else {
          updateCartQty(item.productId, val);
        }
      });

      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.setAttribute('aria-label', `Tambah jumlah ${item.nama}`);
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => updateCartQty(item.productId, item.qty + 1));

      stepper.appendChild(minusBtn);
      stepper.appendChild(qtyInput);
      stepper.appendChild(plusBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn';
      deleteBtn.style.color = 'var(--negative)';
      deleteBtn.setAttribute('aria-label', `Hapus ${item.nama} dari keranjang`);
      deleteBtn.title = 'Hapus item';
      deleteBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => removeCartItem(item.productId));

      controls.appendChild(stepper);
      controls.appendChild(deleteBtn);

      itemRow.appendChild(info);
      itemRow.appendChild(controls);

      cartItemsContainer.appendChild(itemRow);
    });
  }

  /**
   * Muat katalog produk dari IndexedDB
   */
  async function loadCatalog() {
    try {
      catalog = await getAllProducts();
      renderProductCatalog();
    } catch (err) {
      console.error('Error memuat katalog produk:', err);
      showToast('Gagal memuat katalog produk.');
    }
  }

  function init() {
    loadCartFromSession();
    renderCart();

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProductCatalog();
    });

    btnClearCart.addEventListener('click', clearCart);
    btnSaveTransaction.addEventListener('click', handleSaveTransaction);

    loadCatalog();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

