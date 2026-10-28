/**
 * Griyo POS Lite - Produk Controller
 * Mengelola master produk dengan modal popup formulir
 */

(function () {
  const {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
  } = window.GriyoDB;

  const {
    formatRupiah,
    parseRupiahInput,
    getProductColor,
    getProductInitial,
    showToast,
    showConfirmDialog
  } = window.GriyoUtil;

  // Elemen DOM Modal & Form
  const modalOverlay = document.getElementById('product-modal-overlay');
  const form = document.getElementById('product-form');
  const editIdInput = document.getElementById('edit-id');
  const namaInput = document.getElementById('input-nama');
  const beliInput = document.getElementById('input-beli');
  const jualInput = document.getElementById('input-jual');
  const formHeading = document.getElementById('form-heading');
  const warningMargin = document.getElementById('warning-margin');
  const btnSubmitProduct = document.getElementById('btn-submit-product');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');

  // Tombol Buka Modal
  const btnOpenAddHeader = document.getElementById('btn-open-add-header');
  const btnOpenAddBar = document.getElementById('btn-open-add-bar');
  const btnEmptyAdd = document.getElementById('btn-empty-add');

  // Elemen Pencarian & Daftar
  const searchInput = document.getElementById('search-input');
  const productList = document.getElementById('product-list');
  const productCountLabel = document.getElementById('product-count-label');
  const emptyState = document.getElementById('empty-state');

  // State lokal
  let allProducts = [];
  let currentFilter = '';

  /**
   * Buka Modal Popup Tambah / Edit Produk
   */
  function openModal(isEdit = false, product = null) {
    clearAllErrors();

    if (isEdit && product) {
      editIdInput.value = product.id;
      namaInput.value = product.nama;
      beliInput.value = new Intl.NumberFormat('id-ID').format(product.hargaBeli);
      jualInput.value = new Intl.NumberFormat('id-ID').format(product.hargaJual);
      formHeading.textContent = `Edit Produk: ${product.nama}`;
      btnSubmitProduct.textContent = 'Perbarui Produk';
      checkMarginWarning();
    } else {
      form.reset();
      editIdInput.value = '';
      formHeading.textContent = 'Tambah Produk Baru';
      btnSubmitProduct.textContent = 'Simpan Produk';
      warningMargin.hidden = true;
    }

    modalOverlay.classList.add('modal-overlay--active');
    setTimeout(() => namaInput.focus(), 60);
  }

  /**
   * Tutup Modal Popup
   */
  function closeModal() {
    modalOverlay.classList.remove('modal-overlay--active');
    clearAllErrors();
  }

  /**
   * Format input uang dengan pemisah ribuan saat diketik
   */
  function setupCurrencyInput(inputEl) {
    inputEl.addEventListener('input', (e) => {
      const rawVal = parseRupiahInput(e.target.value);
      if (rawVal === 0 && e.target.value === '') {
        inputEl.value = '';
      } else {
        inputEl.value = new Intl.NumberFormat('id-ID').format(rawVal);
      }
      checkMarginWarning();
    });
  }

  /**
   * Cek apakah harga jual lebih kecil dari harga beli
   */
  function checkMarginWarning() {
    const beli = parseRupiahInput(beliInput.value);
    const jual = parseRupiahInput(jualInput.value);

    if (beliInput.value.trim() !== '' && jualInput.value.trim() !== '' && jual < beli) {
      warningMargin.hidden = false;
    } else {
      warningMargin.hidden = true;
    }
  }

  /**
   * Tampilkan pesan error pada field tertentu
   */
  function setFieldError(fieldId, errorId, message) {
    const fieldEl = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    if (!fieldEl || !errorEl) return;

    if (message) {
      fieldEl.classList.add('field--error');
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      fieldEl.classList.remove('field--error');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function clearAllErrors() {
    setFieldError('field-nama', 'error-nama', '');
    setFieldError('field-beli', 'error-beli', '');
    setFieldError('field-jual', 'error-jual', '');
  }

  /**
   * Render daftar produk ke DOM dengan aman
   */
  function renderProductList() {
    const filtered = allProducts.filter((p) =>
      p.nama.toLowerCase().includes(currentFilter.toLowerCase())
    );

    productCountLabel.textContent = `${filtered.length} produk ditampilkan (total: ${allProducts.length})`;

    productList.textContent = '';

    if (allProducts.length === 0) {
      emptyState.hidden = false;
      productList.hidden = true;
      return;
    }

    emptyState.hidden = true;
    productList.hidden = false;

    if (filtered.length === 0) {
      const noMatchLi = document.createElement('li');
      noMatchLi.className = 'row';
      noMatchLi.style.justifyContent = 'center';
      noMatchLi.style.color = 'var(--text-muted)';
      noMatchLi.textContent = `Tidak ada produk dengan kata kunci "${currentFilter}".`;
      productList.appendChild(noMatchLi);
      return;
    }

    filtered.forEach((product, idx) => {
      const li = document.createElement('li');
      li.className = 'row';

      // Dot berwarna dengan inisial
      const dot = document.createElement('span');
      dot.className = 'row__dot';
      dot.style.background = getProductColor(product.id || idx);
      dot.textContent = getProductInitial(product.nama);

      // Info Utama Produk
      const main = document.createElement('div');
      main.className = 'row__main';

      const title = document.createElement('p');
      title.className = 'row__title';
      title.textContent = product.nama;

      const sub = document.createElement('p');
      sub.className = 'row__sub';
      const margin = product.hargaJual - product.hargaBeli;
      const marginSign = margin >= 0 ? '+' : '';
      sub.textContent = `Beli: ${formatRupiah(product.hargaBeli)} · Margin: ${marginSign}${formatRupiah(margin)}`;

      main.appendChild(title);
      main.appendChild(sub);

      // Harga Jual di kanan
      const amountWrap = document.createElement('div');
      amountWrap.style.textAlign = 'right';

      const amount = document.createElement('span');
      amount.className = 'row__amount';
      amount.textContent = formatRupiah(product.hargaJual);

      // Badge status margin
      const badgeWrap = document.createElement('div');
      const badge = document.createElement('span');
      badge.className = `badge ${margin >= 0 ? 'badge--positive' : 'badge--negative'}`;
      badge.textContent = margin >= 0 ? 'Untung' : 'Rugi';
      badgeWrap.appendChild(badge);

      amountWrap.appendChild(amount);
      amountWrap.appendChild(badgeWrap);

      // Tombol Aksi Edit & Hapus
      const actions = document.createElement('div');
      actions.className = 'row__actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn';
      editBtn.setAttribute('aria-label', `Edit produk ${product.nama}`);
      editBtn.title = 'Edit Produk';
      editBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      `;
      // Buka modal dalam mode edit
      editBtn.addEventListener('click', () => openModal(true, product));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn';
      deleteBtn.style.color = 'var(--negative)';
      deleteBtn.setAttribute('aria-label', `Hapus produk ${product.nama}`);
      deleteBtn.title = 'Hapus Produk';
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => handleDeleteProduct(product));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(dot);
      li.appendChild(main);
      li.appendChild(amountWrap);
      li.appendChild(actions);

      productList.appendChild(li);
    });
  }

  /**
   * Tangani konfirmasi dan proses hapus produk
   */
  async function handleDeleteProduct(product) {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Produk?',
      message: `Apakah Anda yakin ingin menghapus "${product.nama}"? Riwayat transaksi lama yang memuat produk ini akan tetap tersimpan secara aman.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      isDanger: true
    });

    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      showToast(`Produk "${product.nama}" berhasil dihapus.`);

      // Jika modal sedang terbuka mengedit produk yang sama, tutup modal
      if (editIdInput.value === String(product.id)) {
        closeModal();
      }

      await loadProducts();
    } catch (err) {
      console.error(err);
      showToast(`Gagal menghapus: ${err.message}`);
    }
  }

  /**
   * Muat ulang data produk dari IndexedDB
   */
  async function loadProducts() {
    try {
      allProducts = await getAllProducts();
      renderProductList();
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Gagal memuat produk dari database lokal.');
    }
  }

  /**
   * Tangani submit form tambah / perbarui di dalam modal
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    const nama = namaInput.value.trim();
    const rawBeli = beliInput.value.trim();
    const rawJual = jualInput.value.trim();

    let hasError = false;

    if (!nama) {
      setFieldError('field-nama', 'error-nama', 'Nama produk wajib diisi.');
      hasError = true;
    } else if (nama.length > 100) {
      setFieldError('field-nama', 'error-nama', 'Nama produk maksimal 100 karakter.');
      hasError = true;
    }

    if (rawBeli === '') {
      setFieldError('field-beli', 'error-beli', 'Harga beli wajib diisi.');
      hasError = true;
    }

    if (rawJual === '') {
      setFieldError('field-jual', 'error-jual', 'Harga jual wajib diisi.');
      hasError = true;
    }

    if (hasError) return;

    const hargaBeli = parseRupiahInput(rawBeli);
    const hargaJual = parseRupiahInput(rawJual);
    const editId = editIdInput.value ? Number(editIdInput.value) : null;

    try {
      if (editId) {
        await updateProduct(editId, { nama, hargaBeli, hargaJual });
        showToast(`Produk "${nama}" berhasil diperbarui.`);
      } else {
        await addProduct({ nama, hargaBeli, hargaJual });
        showToast(`Produk "${nama}" berhasil disimpan.`);
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      console.error('Save error:', err);
      if (err.message && err.message.includes('sudah ada')) {
        setFieldError('field-nama', 'error-nama', err.message);
        namaInput.focus();
      } else {
        showToast(`Gagal menyimpan: ${err.message}`);
      }
    }
  }

  function init() {
    setupCurrencyInput(beliInput);
    setupCurrencyInput(jualInput);

    form.addEventListener('submit', handleFormSubmit);

    // Buka modal tambah
    btnOpenAddHeader?.addEventListener('click', () => openModal(false));
    btnOpenAddBar?.addEventListener('click', () => openModal(false));
    btnEmptyAdd?.addEventListener('click', () => openModal(false));

    // Tutup modal
    btnCloseModal?.addEventListener('click', closeModal);
    btnCancelModal?.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('modal-overlay--active')) {
        closeModal();
      }
    });

    // Pencarian live
    searchInput.addEventListener('input', (e) => {
      currentFilter = e.target.value.trim();
      renderProductList();
    });

    loadProducts();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
