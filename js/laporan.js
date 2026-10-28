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

  const sumTotalBeli = document.getElementById('sum-total-beli');
  const sumTotalJual = document.getElementById('sum-total-jual');
  const sumLabaBox = document.getElementById('sum-laba-box');
  const sumLabaVal = document.getElementById('sum-laba-val');
  const sumLabaTitle = document.getElementById('sum-laba-title');
  const sumCountTrans = document.getElementById('sum-count-trans');
  const sumCountItems = document.getElementById('sum-count-items');
  const sumMarginPercent = document.getElementById('sum-margin-percent');
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
   * Menampilkan jumlah harga beli, harga jual, dan selisihnya / laba
   */
  function updateSummaryPanel() {
    if (selectedIds.size === 0) {
      sumTotalBeli.textContent = 'Rp 0';
      sumTotalJual.textContent = 'Rp 0';
      sumLabaVal.textContent = 'Rp 0';
      sumLabaVal.style.color = 'var(--text-muted)';
      if (sumLabaBox) sumLabaBox.className = 'summary-stat-box';
      if (sumLabaTitle) sumLabaTitle.textContent = 'Selisih / Laba';
      sumCountTrans.textContent = '0';
      sumCountItems.textContent = '0 unit';
      sumMarginPercent.textContent = '0%';
      sumHint.textContent = 'Centang transaksi untuk menjumlahkan';
      btnClearSelection.disabled = true;
      return;
    }

    btnClearSelection.disabled = false;
    sumHint.textContent = `${selectedIds.size} transaksi terpilih`;

    let totalBeli = 0;
    let totalJual = 0;
    let totalQty = 0;

    allTransactions.forEach((tx) => {
      if (selectedIds.has(tx.id)) {
        if (Array.isArray(tx.items)) {
          tx.items.forEach((item) => {
            const qty = Number(item.qty) || 0;
            const beli = Number(item.hargaBeli) || 0;
            const jual = Number(item.hargaJual) || 0;
            totalBeli += (beli * qty);
            totalJual += (jual * qty);
            totalQty += qty;
          });
        }
      }
    });

    const selisihLaba = totalJual - totalBeli;
    const marginPercent = totalBeli > 0 ? ((selisihLaba / totalBeli) * 100).toFixed(1) : '0';

    sumTotalBeli.textContent = formatRupiah(totalBeli);
    sumTotalJual.textContent = formatRupiah(totalJual);
    sumCountTrans.textContent = String(selectedIds.size);
    sumCountItems.textContent = `${totalQty} unit`;
    sumMarginPercent.textContent = `${selisihLaba >= 0 ? '+' : ''}${marginPercent}%`;

    if (selisihLaba > 0) {
      sumLabaVal.textContent = `+${formatRupiah(selisihLaba)}`;
      sumLabaVal.style.color = 'var(--positive)';
      if (sumLabaBox) sumLabaBox.className = 'summary-stat-box summary-stat-box--profit';
      if (sumLabaTitle) sumLabaTitle.textContent = 'Laba (Untung)';
    } else if (selisihLaba < 0) {
      sumLabaVal.textContent = `-${formatRupiah(Math.abs(selisihLaba))}`;
      sumLabaVal.style.color = 'var(--negative)';
      if (sumLabaBox) sumLabaBox.className = 'summary-stat-box summary-stat-box--loss';
      if (sumLabaTitle) sumLabaTitle.textContent = 'Selisih (Rugi)';
    } else {
      sumLabaVal.textContent = 'Rp 0';
      sumLabaVal.style.color = 'var(--text)';
      if (sumLabaBox) sumLabaBox.className = 'summary-stat-box';
      if (sumLabaTitle) sumLabaTitle.textContent = 'Selisih / Laba';
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

      let txBeli = 0;
      let txJual = 0;
      (tx.items || []).forEach((item) => {
        const qty = Number(item.qty) || 0;
        const beli = Number(item.hargaBeli) || 0;
        const jual = Number(item.hargaJual) || 0;
        txBeli += (beli * qty);
        txJual += (jual * qty);
      });
      const txLaba = txJual - txBeli;

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

      // Info Nominal di kanan: Beli & Laba
      const amountWrap = document.createElement('div');
      amountWrap.style.textAlign = 'right';
      amountWrap.style.cursor = 'pointer';

      const amount = document.createElement('span');
      amount.className = 'row__amount';
      amount.textContent = `Beli: ${formatRupiah(txBeli)}`;

      const labaTag = document.createElement('div');
      labaTag.style.fontSize = '11px';
      labaTag.style.fontWeight = '600';
      if (txLaba > 0) {
        labaTag.style.color = 'var(--positive)';
        labaTag.textContent = `Laba: +${formatRupiah(txLaba)}`;
      } else if (txLaba < 0) {
        labaTag.style.color = 'var(--negative)';
        labaTag.textContent = `Rugi: -${formatRupiah(Math.abs(txLaba))}`;
      } else {
        labaTag.style.color = 'var(--text-muted)';
        labaTag.textContent = 'Laba: Rp 0';
      }

      const toggleHint = document.createElement('div');
      toggleHint.style.fontSize = '10px';
      toggleHint.style.color = 'var(--text-muted)';
      toggleHint.textContent = isExpanded ? '▲ Tutup' : '▼ Rincian';

      amountWrap.appendChild(amount);
      amountWrap.appendChild(labaTag);
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
              <th class="num">Qty</th>
              <th class="num">Harga Beli</th>
              <th class="num">Harga Jual</th>
              <th class="num">Laba</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        `;

        const tbody = table.querySelector('tbody');
        (tx.items || []).forEach((item) => {
          const qty = Number(item.qty) || 0;
          const beli = Number(item.hargaBeli) || 0;
          const jual = Number(item.hargaJual) || 0;
          const itemLaba = (jual - beli) * qty;

          const tr = document.createElement('tr');

          const tdName = document.createElement('td');
          tdName.textContent = item.nama;

          const tdQty = document.createElement('td');
          tdQty.className = 'num';
          tdQty.textContent = `${qty}x`;

          const tdPriceBeli = document.createElement('td');
          tdPriceBeli.className = 'num';
          tdPriceBeli.textContent = formatRupiah(beli);

          const tdPriceJual = document.createElement('td');
          tdPriceJual.className = 'num';
          tdPriceJual.textContent = formatRupiah(jual);

          const tdLaba = document.createElement('td');
          tdLaba.className = 'num';
          tdLaba.style.fontWeight = '600';
          if (itemLaba > 0) {
            tdLaba.style.color = 'var(--positive)';
            tdLaba.textContent = `+${formatRupiah(itemLaba)}`;
          } else if (itemLaba < 0) {
            tdLaba.style.color = 'var(--negative)';
            tdLaba.textContent = `-${formatRupiah(Math.abs(itemLaba))}`;
          } else {
            tdLaba.style.color = 'var(--text-muted)';
            tdLaba.textContent = 'Rp 0';
          }

          tr.appendChild(tdName);
          tr.appendChild(tdQty);
          tr.appendChild(tdPriceBeli);
          tr.appendChild(tdPriceJual);
          tr.appendChild(tdLaba);
          tbody.appendChild(tr);
        });

        const metaRow = document.createElement('div');
        metaRow.style.marginTop = 'var(--sp-2)';
        metaRow.style.paddingTop = 'var(--sp-2)';
        metaRow.style.borderTop = '1px dashed var(--border)';
        metaRow.style.display = 'flex';
        metaRow.style.justifyContent = 'space-between';
        metaRow.style.alignItems = 'center';

        const profitInfo = document.createElement('div');
        profitInfo.style.fontSize = 'var(--fs-xs)';
        profitInfo.style.lineHeight = '1.4';

        const sBeli = document.createElement('span');
        sBeli.textContent = `Beli: ${formatRupiah(txBeli)} · `;

        const sJual = document.createElement('span');
        sJual.textContent = `Jual: ${formatRupiah(txJual)} · `;

        const sLaba = document.createElement('span');
        sLaba.style.fontWeight = '700';
        if (txLaba > 0) {
          sLaba.style.color = 'var(--positive)';
          sLaba.textContent = `Laba: +${formatRupiah(txLaba)}`;
        } else if (txLaba < 0) {
          sLaba.style.color = 'var(--negative)';
          sLaba.textContent = `Rugi: -${formatRupiah(Math.abs(txLaba))}`;
        } else {
          sLaba.style.color = 'var(--text-muted)';
          sLaba.textContent = 'Selisih: Rp 0';
        }

        profitInfo.appendChild(sBeli);
        profitInfo.appendChild(sJual);
        profitInfo.appendChild(sLaba);

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

