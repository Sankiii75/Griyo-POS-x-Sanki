/**
 * Griyo POS Lite - Laporan Controller
 */

(function () {
  const { getAllTransactions, deleteTransaction } = window.GriyoDB;
  const {
    formatRupiah,
    formatWaktu,
    formatTransactionId,
    showToast,
    showConfirmDialog
  } = window.GriyoUtil;

  // Konfigurasi Paginasi
  const ITEMS_PER_PAGE = 20;

  // Elemen DOM
  const tabToday = document.getElementById('tab-today');
  const tabMonth = document.getElementById('tab-month');
  const tabAll = document.getElementById('tab-all');
  const filterDateInput = document.getElementById('filter-date');
  const btnResetDate = document.getElementById('btn-reset-date');

  const sumTotalSales = document.getElementById('sum-total-sales');
  const sumCountTrans = document.getElementById('sum-count-trans');
  const sumCountItems = document.getElementById('sum-count-items');
  const sumGrossProfit = document.getElementById('sum-gross-profit');
  const sumHint = document.getElementById('sum-hint');
  const btnClearSelection = document.getElementById('btn-clear-selection');

  const checkAll = document.getElementById('check-all');
  const checkAllLabel = document.getElementById('check-all-label');
  const showingCount = document.getElementById('showing-count');

  const reportList = document.getElementById('report-list');
  const paginationControls = document.getElementById('pagination-controls');
  const reportEmptyState = document.getElementById('report-empty-state');
  const emptyStateText = document.getElementById('empty-state-text');

  // State Lokal
  let allTransactions = [];
  let filteredTransactions = [];
  let selectedIds = new Set();
  let expandedIds = new Set();
  let currentFilterMode = 'all'; // 'today' | 'month' | 'all' | 'custom'
  let currentPage = 1;

  /**
   * Mendapatkan string YYYY-MM-DD hari ini sesuai zona waktu perangkat
   */
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Filter data transaksi berdasarkan filter saat ini
   */
  function applyFilters() {
    const now = new Date();
    const todayStr = getTodayDateString();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    filteredTransactions = allTransactions.filter((tx) => {
      const formatted = formatWaktu(tx.waktu);

      if (currentFilterMode === 'today') {
        return formatted.dateOnly === todayStr;
      }
      if (currentFilterMode === 'month') {
        return formatted.year === currentYear && formatted.month === currentMonth;
      }
      if (currentFilterMode === 'custom' && filterDateInput.value) {
        return formatted.dateOnly === filterDateInput.value;
      }
      return true; // 'all'
    });

    // PRD: "Mengubah filter menghapus pilihan baris yang sudah tidak tampil, agar SUM tidak menghitung baris tersembunyi."
    const visibleIdSet = new Set(filteredTransactions.map((tx) => tx.id));
    const newSelected = new Set();
    for (const id of selectedIds) {
      if (visibleIdSet.has(id)) {
        newSelected.add(id);
      }
    }
    selectedIds = newSelected;

    currentPage = 1;
    updateSummaryPanel();
    renderReportView();
  }

  /**
   * Hitung SUM pilihan dan perbarui kartu ringkasan
   */
  function updateSummaryPanel() {
    if (selectedIds.size === 0) {
      sumTotalSales.textContent = 'Rp 0';
      sumCountTrans.textContent = '0';
      sumCountItems.textContent = '0 unit';
      sumGrossProfit.textContent = 'Rp 0';
      sumHint.textContent = 'Centang transaksi untuk menjumlahkan';
      btnClearSelection.disabled = true;
      return;
    }

    btnClearSelection.disabled = false;
    sumHint.textContent = `${selectedIds.size} transaksi terpilih`;

    let totalSales = 0;
    let totalModal = 0;
    let totalQty = 0;

    allTransactions.forEach((tx) => {
      if (selectedIds.has(tx.id)) {
        totalSales += (tx.total || 0);
        totalModal += (tx.totalModal || 0);
        
        if (Array.isArray(tx.items)) {
          tx.items.forEach((item) => {
            totalQty += (Number(item.qty) || 0);
          });
        }
      }
    });

    const grossProfit = totalSales - totalModal;

    sumTotalSales.textContent = formatRupiah(totalSales);
    sumCountTrans.textContent = String(selectedIds.size);
    sumCountItems.textContent = `${totalQty} unit`;
    sumGrossProfit.textContent = formatRupiah(grossProfit);

    if (grossProfit >= 0) {
      sumGrossProfit.style.color = 'var(--positive)';
    } else {
      sumGrossProfit.style.color = 'var(--negative)';
    }
  }

  /**
   * Render Riwayat Transaksi + Paginasi
   */
  function renderReportView() {
    reportList.textContent = '';

    const totalItems = filteredTransactions.length;
    showingCount.textContent = `${totalItems} transaksi`;

    if (totalItems === 0) {
      reportEmptyState.hidden = false;
      reportList.hidden = true;
      paginationControls.hidden = true;
      checkAll.checked = false;
      checkAll.disabled = true;

      if (allTransactions.length === 0) {
        emptyStateText.textContent = 'Belum ada riwayat transaksi penjualan tersimpan.';
      } else {
        emptyStateText.textContent = 'Tidak ada transaksi pada periode/tanggal filter ini.';
      }
      return;
    }

    reportEmptyState.hidden = true;
    reportList.hidden = false;
    checkAll.disabled = false;

    // Paginasi slice
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);
    const currentSlice = filteredTransactions.slice(startIdx, endIdx);

    // Update status checkbox "Pilih Semua yang Tampil"
    const allCurrentChecked = currentSlice.length > 0 && currentSlice.every((tx) => selectedIds.has(tx.id));
    const someCurrentChecked = currentSlice.some((tx) => selectedIds.has(tx.id));
    checkAll.checked = allCurrentChecked;
    checkAll.indeterminate = !allCurrentChecked && someCurrentChecked;

    // Buat baris transaksi
    currentSlice.forEach((tx) => {
      const isSelected = selectedIds.has(tx.id);
      const isExpanded = expandedIds.has(tx.id);
      const waktuInfo = formatWaktu(tx.waktu);

      const li = document.createElement('li');
      li.style.listStyle = 'none';

      const row = document.createElement('div');
      row.className = `row ${isSelected ? 'row--selected' : ''}`;

      // Kotak centang
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'row__checkbox';
      checkbox.checked = isSelected;
      checkbox.setAttribute('aria-label', `Pilih transaksi ${formatTransactionId(tx.id)}`);
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        if (checkbox.checked) {
          selectedIds.add(tx.id);
        } else {
          selectedIds.delete(tx.id);
        }
        updateSummaryPanel();
        renderReportView();
      });

      // Titik bulat
      const dot = document.createElement('span');
      dot.className = 'row__dot';
      dot.textContent = '✓';

      // Info Utama
      const main = document.createElement('div');
      main.className = 'row__main';
      main.style.cursor = 'pointer';

      // Ringkasan Item
      const title = document.createElement('p');
      title.className = 'row__title';
      const itemsSummary = (tx.items || [])
        .map((it) => `${it.nama} × ${it.qty}`)
        .join(', ');
      title.textContent = itemsSummary || 'Tidak ada detail item';

      // Baris sub: ID, Hari, Tanggal, Jam
      const sub = document.createElement('p');
      sub.className = 'row__sub';
      sub.textContent = `${formatTransactionId(tx.id)} · ${waktuInfo.hari}, ${waktuInfo.tanggal} · ${waktuInfo.jam}`;

      main.appendChild(title);
      main.appendChild(sub);

      // Total Penjualan di kanan
      const amountWrap = document.createElement('div');
      amountWrap.style.textAlign = 'right';
      amountWrap.style.cursor = 'pointer';

      const amount = document.createElement('span');
      amount.className = 'row__amount';
      amount.textContent = formatRupiah(tx.total);

      const toggleHint = document.createElement('div');
      toggleHint.style.fontSize = '10px';
      toggleHint.style.color = 'var(--text-muted)';
      toggleHint.textContent = isExpanded ? '▲ Tutup rincian' : '▼ Lihat rincian';

      amountWrap.appendChild(amount);
      amountWrap.appendChild(toggleHint);

      const toggleAccordion = () => {
        if (expandedIds.has(tx.id)) {
          expandedIds.delete(tx.id);
        } else {
          expandedIds.add(tx.id);
        }
        renderReportView();
      };

      main.addEventListener('click', toggleAccordion);
      amountWrap.addEventListener('click', toggleAccordion);

      row.appendChild(checkbox);
      row.appendChild(dot);
      row.appendChild(main);
      row.appendChild(amountWrap);
      li.appendChild(row);

      // Panel Accordion Detail Item (Snapshot)
      if (isExpanded) {
        const details = document.createElement('div');
        details.className = 'row-details';

        const table = document.createElement('table');
        table.innerHTML = `
          <thead>
            <tr>
              <th>Produk</th>
              <th class="num">Harga</th>
              <th class="num">Qty</th>
              <th class="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        `;

        const tbody = table.querySelector('tbody');
        (tx.items || []).forEach((item) => {
          const tr = document.createElement('tr');

          const tdName = document.createElement('td');
          tdName.textContent = item.nama;

          const tdPrice = document.createElement('td');
          tdPrice.className = 'num';
          tdPrice.textContent = formatRupiah(item.hargaJual);

          const tdQty = document.createElement('td');
          tdQty.className = 'num';
          tdQty.textContent = `${item.qty}x`;

          const tdSub = document.createElement('td');
          tdSub.className = 'num';
          tdSub.style.fontWeight = '600';
          tdSub.textContent = formatRupiah(item.subtotal);

          tr.appendChild(tdName);
          tr.appendChild(tdPrice);
          tr.appendChild(tdQty);
          tr.appendChild(tdSub);
          tbody.appendChild(tr);
        });

        const metaRow = document.createElement('div');
        metaRow.style.marginTop = 'var(--sp-2)';
        metaRow.style.paddingTop = 'var(--sp-2)';
        metaRow.style.borderTop = '1px dashed var(--border)';
        metaRow.style.display = 'flex';
        metaRow.style.justifyContent = 'space-between';
        metaRow.style.alignItems = 'center';

        const profit = (tx.total || 0) - (tx.totalModal || 0);
        const profitInfo = document.createElement('span');
        profitInfo.style.fontSize = 'var(--fs-xs)';
        profitInfo.textContent = `Modal: ${formatRupiah(tx.totalModal)} · Laba: ${formatRupiah(profit)}`;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn--link';
        delBtn.style.color = 'var(--negative)';
        delBtn.style.fontSize = '11px';
        delBtn.textContent = 'Hapus Transaksi';
        delBtn.addEventListener('click', () => handleDeleteTransaction(tx));

        metaRow.appendChild(profitInfo);
        metaRow.appendChild(delBtn);

        details.appendChild(table);
        details.appendChild(metaRow);
        li.appendChild(details);
      }

      reportList.appendChild(li);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationControls.hidden = true;
      paginationControls.textContent = '';
      return;
    }

    paginationControls.hidden = false;
    paginationControls.textContent = '';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.innerHTML = '‹';
    prevBtn.setAttribute('aria-label', 'Halaman Sebelumnya');
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderReportView();
      }
    });
    paginationControls.appendChild(prevBtn);

    for (let p = 1; p <= totalPages; p++) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.textContent = String(p);
      pageBtn.setAttribute('aria-label', `Halaman ${p}`);
      if (p === currentPage) {
        pageBtn.setAttribute('aria-current', 'page');
      }
      pageBtn.addEventListener('click', () => {
        currentPage = p;
        renderReportView();
      });
      paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.innerHTML = '›';
    nextBtn.setAttribute('aria-label', 'Halaman Berikutnya');
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderReportView();
      }
    });
    paginationControls.appendChild(nextBtn);
  }

  async function handleDeleteTransaction(tx) {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Transaksi?',
      message: `Hapus catatan transaksi ${formatTransactionId(tx.id)} senilai ${formatRupiah(tx.total)}? Aksi ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Transaksi',
      cancelText: 'Batal',
      isDanger: true
    });

    if (!confirmed) return;

    try {
      await deleteTransaction(tx.id);
      selectedIds.delete(tx.id);
      expandedIds.delete(tx.id);
      showToast(`Transaksi ${formatTransactionId(tx.id)} dihapus.`);
      await loadReportData();
    } catch (err) {
      console.error(err);
      showToast(`Gagal menghapus transaksi: ${err.message}`);
    }
  }

  function setSegmentFilter(mode) {
    currentFilterMode = mode;
    filterDateInput.value = '';

    tabToday.setAttribute('aria-selected', mode === 'today');
    tabMonth.setAttribute('aria-selected', mode === 'month');
    tabAll.setAttribute('aria-selected', mode === 'all');

    applyFilters();
  }

  async function loadReportData() {
    try {
      allTransactions = await getAllTransactions();
      applyFilters();
    } catch (err) {
      console.error('Error memuat data transaksi:', err);
      showToast('Gagal memuat riwayat transaksi.');
    }
  }

  function init() {
    tabToday.addEventListener('click', () => setSegmentFilter('today'));
    tabMonth.addEventListener('click', () => setSegmentFilter('month'));
    tabAll.addEventListener('click', () => setSegmentFilter('all'));

    filterDateInput.addEventListener('change', () => {
      if (filterDateInput.value) {
        currentFilterMode = 'custom';
        tabToday.setAttribute('aria-selected', 'false');
        tabMonth.setAttribute('aria-selected', 'false');
        tabAll.setAttribute('aria-selected', 'false');
        applyFilters();
      }
    });

    btnResetDate.addEventListener('click', () => {
      setSegmentFilter('all');
    });

    btnClearSelection.addEventListener('click', () => {
      selectedIds.clear();
      updateSummaryPanel();
      renderReportView();
    });

    checkAll.addEventListener('change', () => {
      const totalItems = filteredTransactions.length;
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);
      const currentSlice = filteredTransactions.slice(startIdx, endIdx);

      if (checkAll.checked) {
        currentSlice.forEach((tx) => selectedIds.add(tx.id));
      } else {
        currentSlice.forEach((tx) => selectedIds.delete(tx.id));
      }

      updateSummaryPanel();
      renderReportView();
    });

    loadReportData();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

