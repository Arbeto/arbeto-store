/**
 * bills.js — فواتير الشراء Dashboard
 * v2: supplier autocomplete, live total, fixed accordion, supplier display
 */

const CSRF = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const NOW_YEAR  = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth() + 1;

let filterYear   = NOW_YEAR;
let filterMonth  = NOW_MONTH;
let filterSearch = '';
let currentPage  = 1;
let searchTimer  = null;
let supplierTimer = null;
let availableYears  = [];
let availableMonths = [];
let filtersInitialized = false;
let itemRowIndex = 0;

/* ═══════════════════════════════════
   INIT
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initModal();
    loadBills(true);
    // close supplier dropdown when clicking outside
    document.addEventListener('click', e => {
        const dropdown = document.getElementById('supplierDropdown');
        if (dropdown && !dropdown.closest('.modal-date-row')?.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

/* ═══════════════════════════════════
   FILTERS
═══════════════════════════════════ */
function initFilters() {
    document.getElementById('billSearch').addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            filterSearch = this.value.trim();
            currentPage  = 1;
            loadBills();
        }, 420);
    });

    document.getElementById('yearFilter').addEventListener('change', function () {
        filterYear  = this.value === 'all' ? 'all' : parseInt(this.value);
        filterMonth = NOW_MONTH; // reset month to current when year changes
        currentPage = 1;
        renderMonthOptions();
        loadBills();
    });

    document.getElementById('monthFilter').addEventListener('change', function () {
        filterMonth = this.value === 'all' ? 'all' : parseInt(this.value);
        currentPage = 1;
        loadBills();
    });
}

function renderYearOptions() {
    const sel     = document.getElementById('yearFilter');
    const yearSet = new Set([...availableYears.map(Number), NOW_YEAR]);
    const sorted  = [...yearSet].sort((a, b) => b - a);

    sel.innerHTML = '<option value="all">الكل</option>';
    sorted.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === (filterYear === 'all' ? null : Number(filterYear))) opt.selected = true;
        sel.appendChild(opt);
    });
    // Select current year by default
    if (filterYear !== 'all') sel.value = filterYear;
}

function renderMonthOptions() {
    const sel     = document.getElementById('monthFilter');
    const yearVal = document.getElementById('yearFilter').value;

    let months;
    if (yearVal === 'all') {
        months = [...new Set(availableMonths.map(m => Number(m.month)))].sort((a, b) => a - b);
    } else {
        months = availableMonths
            .filter(m => Number(m.year) === Number(yearVal))
            .map(m => Number(m.month))
            .sort((a, b) => a - b);
        // Always ensure current month appears when current year is selected
        if (Number(yearVal) === NOW_YEAR && !months.includes(NOW_MONTH)) {
            months.push(NOW_MONTH);
            months.sort((a, b) => a - b);
        }
    }

    sel.innerHTML = '<option value="all">الكل</option>';
    months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = MONTHS_AR[m - 1];
        if (m === (filterMonth === 'all' ? null : Number(filterMonth))) opt.selected = true;
        sel.appendChild(opt);
    });
    // Default month selection
    if (filterMonth !== 'all' && months.includes(Number(filterMonth))) {
        sel.value = filterMonth;
    }
}

/* ═══════════════════════════════════
   LOAD BILLS (API)
═══════════════════════════════════ */
async function loadBills(firstLoad = false) {
    const listEl  = document.getElementById('billsList');
    const paginEl = document.getElementById('billsPagination');
    listEl.innerHTML  = '<div class="bills-loading"><i class="bi bi-arrow-repeat spin-icon"></i> جاري التحميل...</div>';
    paginEl.innerHTML = '';

    const params = new URLSearchParams({ page: currentPage });
    if (filterSearch)           params.set('search', filterSearch);
    if (filterYear  !== 'all')  params.set('year',   filterYear);
    if (filterMonth !== 'all')  params.set('month',  filterMonth);

    try {
        const res  = await fetch('/api/bills?' + params);
        const data = await res.json();

        if (!data.success) {
            listEl.innerHTML = '<div class="bills-empty">حدث خطأ في التحميل</div>';
            return;
        }

        // Populate filter selects only on first load
        if (firstLoad || !filtersInitialized) {
            availableYears  = data.available_years  ?? [];
            availableMonths = data.available_months ?? [];
            renderYearOptions();
            renderMonthOptions();
            filtersInitialized = true;
        }

        renderBills(data.bills.data);
        renderPagination(data.bills);
    } catch {
        listEl.innerHTML = '<div class="bills-empty"><i class="bi bi-wifi-off"></i> حدث خطأ في الاتصال</div>';
    }
}

/* ═══════════════════════════════════
   RENDER BILLS
═══════════════════════════════════ */
function renderBills(bills) {
    const listEl = document.getElementById('billsList');

    if (!bills || bills.length === 0) {
        listEl.innerHTML = '<div class="bills-empty"><i class="bi bi-receipt"></i>لا توجد فواتير بهذه الفلترة</div>';
        return;
    }

    listEl.innerHTML = bills.map(buildBillCard).join('');

    // Attach toggle listeners
    listEl.querySelectorAll('.bill-header').forEach(header => {
        header.addEventListener('click', () => toggleBill(header.closest('.bill-card')));
    });
}

function buildBillCard(bill) {
    const total        = formatMoney(bill.total_price);
    const items        = bill.items ?? [];
    const supplierName = bill.supplier?.name ?? null;

    const rows = items.map(it => `
        <tr>
            <td>${escHtml(it.item_name)}</td>
            <td>${formatMoney(it.purchase_price)}</td>
            <td>${it.quantity}</td>
            <td>${formatMoney(parseFloat(it.purchase_price) * it.quantity)}</td>
        </tr>`).join('');

    const supplierRow = supplierName
        ? `<div style="padding:8px 0 4px;font-size:.86rem;color:#5e8a79;direction:rtl">
               <i class="bi bi-person-fill" style="color:#2d6a4f"></i> المورد: <strong>${escHtml(supplierName)}</strong>
           </div>`
        : '';

    return `
    <div class="bill-card" data-id="${bill.id}">
        <div class="bill-header">
            <span class="bill-inv-num">${escHtml(bill.invoice_number)}</span>
            <span class="bill-total">${total} ج.م</span>
            ${supplierName ? `<span class="bill-supplier" style="font-size:.82rem;color:#517a6a;background:#f0f7f4;padding:2px 9px;border-radius:20px"><i class="bi bi-person-fill"></i> ${escHtml(supplierName)}</span>` : ''}
            <span class="bill-date">${formatDate(bill.date)}</span>
            <i class="bi bi-chevron-down bill-toggle-icon"></i>
        </div>
        <div class="bill-body" style="max-height:0;overflow:hidden;padding:0 20px">
            ${supplierRow}
            <table class="bill-items-table">
                <thead>
                    <tr>
                        <th>اسم الصنف / الخدمة</th>
                        <th>سعر الشراء</th>
                        <th>الكمية</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td colspan="3">الإجمالي الكلي</td>
                        <td>${total} ج.م</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

/* ═══════════════════════════════════
   ACCORDION — FIXED
═══════════════════════════════════ */
function toggleBill(card) {
    const body   = card.querySelector('.bill-body');
    const isOpen = card.classList.contains('open');

    if (isOpen) {
        body.style.transition = 'none';
        body.style.maxHeight  = body.scrollHeight + 'px';
        body.style.overflow   = 'hidden';
        body.getBoundingClientRect(); // force reflow
        body.style.transition    = 'max-height 0.28s ease-in, padding 0.28s';
        body.style.maxHeight     = '0';
        body.style.paddingTop    = '0';
        body.style.paddingBottom = '0';
        card.classList.remove('open');
    } else {
        card.classList.add('open');
        body.style.transition = 'none';
        body.style.maxHeight  = '0';
        body.getBoundingClientRect(); // force reflow
        body.style.transition    = 'max-height 0.36s ease-out, padding 0.3s';
        body.style.paddingTop    = '6px';
        body.style.paddingBottom = '18px';
        body.style.maxHeight     = (body.scrollHeight + 200) + 'px';
        body.style.overflow      = 'hidden';
        body.addEventListener('transitionend', function onEnd() {
            if (card.classList.contains('open')) {
                body.style.maxHeight = 'none';
                body.style.overflow  = '';
            }
            body.removeEventListener('transitionend', onEnd);
        });
    }
}

/* ═══════════════════════════════════
   PAGINATION
═══════════════════════════════════ */
function renderPagination(paginator) {
    const el = document.getElementById('billsPagination');
    if (!paginator || paginator.last_page <= 1) return;

    const cur  = paginator.current_page;
    const last = paginator.last_page;
    let html   = '';

    html += `<button class="page-btn" onclick="goPage(${cur - 1})" ${cur === 1 ? 'disabled' : ''}>
                 <i class="bi bi-chevron-right"></i></button>`;

    for (let p = 1; p <= last; p++) {
        html += `<button class="page-btn ${p === cur ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    }

    html += `<button class="page-btn" onclick="goPage(${cur + 1})" ${cur === last ? 'disabled' : ''}>
                 <i class="bi bi-chevron-left"></i></button>`;

    el.innerHTML = html;
}

function goPage(page) {
    currentPage = page;
    loadBills();
    document.getElementById('billsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════
   MODAL
═══════════════════════════════════ */
function initModal() {
    document.getElementById('addBillBtn').addEventListener('click', openModal);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    document.getElementById('addItemRowBtn').addEventListener('click', addItemRow);
    document.getElementById('billForm').addEventListener('submit', submitBill);

    // Default date = today
    document.getElementById('billDate').value = new Date().toISOString().split('T')[0];

    // Start with one item row
    addItemRow();
    initSupplierAutocomplete();
}

function openModal() {
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

/* ═══════════════════════════════════
   SUPPLIER AUTOCOMPLETE
═══════════════════════════════════ */
function initSupplierAutocomplete() {
    const input    = document.getElementById('supplierInput');
    const dropdown = document.getElementById('supplierDropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        clearTimeout(supplierTimer);
        const q = this.value.trim();
        if (!q) { dropdown.style.display = 'none'; return; }
        supplierTimer = setTimeout(() => fetchSuppliers(q), 300);
    });

    input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.style.display = 'none'; }, 200);
    });
}

async function fetchSuppliers(q) {
    const dropdown = document.getElementById('supplierDropdown');
    try {
        const res  = await fetch('/api/suppliers/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        if (!data.suppliers || data.suppliers.length === 0) {
            dropdown.style.display = 'none'; return;
        }
        dropdown.innerHTML = data.suppliers.map(s =>
            `<div style="padding:9px 14px;cursor:pointer;font-size:.9rem;direction:rtl;border-bottom:1px solid #f0f7f4"
                  onmousedown="selectSupplier('${escHtml(s.name)}')"
                  onmouseenter="this.style.background='#f0f7f4'"
                  onmouseleave="this.style.background=''">${escHtml(s.name)}</div>`
        ).join('');
        dropdown.style.display = 'block';
    } catch { dropdown.style.display = 'none'; }
}

function selectSupplier(name) {
    document.getElementById('supplierInput').value = name;
    document.getElementById('supplierDropdown').style.display = 'none';
}

function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const idx       = itemRowIndex++;
    const div = document.createElement('div');
    div.className   = 'item-row';
    div.dataset.idx = idx;
    div.innerHTML = `
        <div class="field-group">
            <label>اسم الصنف / الخدمة</label>
            <input type="text" class="field-input item-name" placeholder="مثال: شاحن موبايل" required />
        </div>
        <div class="field-group">
            <label>سعر الشراء</label>
            <input type="number" class="field-input item-price" placeholder="0.00" min="0" step="0.01" required />
        </div>
        <div class="field-group">
            <label>الكمية</label>
            <input type="number" class="field-input item-qty" placeholder="1" min="1" value="1" required />
        </div>
        <button type="button" class="remove-row-btn" onclick="removeItemRow(this)" title="حذف الصنف">
            <i class="bi bi-trash"></i>
        </button>`;
    container.appendChild(div);
    div.querySelector('.item-price').addEventListener('input', updateLiveTotal);
    div.querySelector('.item-qty').addEventListener('input', updateLiveTotal);
    syncRemoveButtons();
    div.querySelector('.item-name').focus();
    updateLiveTotal();
}

function removeItemRow(btn) {
    btn.closest('.item-row').remove();
    syncRemoveButtons();
    updateLiveTotal();
}

function syncRemoveButtons() {
    const rows = document.querySelectorAll('#itemsContainer .item-row');
    rows.forEach(r => {
        r.querySelector('.remove-row-btn').disabled = rows.length === 1;
    });
}

function updateLiveTotal() {
    let total = 0;
    document.querySelectorAll('#itemsContainer .item-row').forEach(row => {
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const qty   = parseInt(row.querySelector('.item-qty').value)    || 0;
        total += price * qty;
    });
    const el = document.getElementById('liveTotalDisplay');
    if (el) el.textContent = total.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function submitBill(e) {
    e.preventDefault();

    const submitBtn    = document.getElementById('submitBillBtn');
    const date         = document.getElementById('billDate').value;
    const supplierName = document.getElementById('supplierInput')?.value.trim() ?? '';
    const items        = [];
    let valid          = true;

    document.querySelectorAll('#itemsContainer .item-row').forEach(row => {
        const name  = row.querySelector('.item-name').value.trim();
        const price = parseFloat(row.querySelector('.item-price').value);
        const qty   = parseInt(row.querySelector('.item-qty').value);
        if (!name || isNaN(price) || price < 0 || isNaN(qty) || qty < 1) {
            valid = false;
            return;
        }
        items.push({ item_name: name, purchase_price: price, quantity: qty });
    });

    if (!valid || items.length === 0) {
        showToast('يرجى تعبئة بيانات الأصناف بشكل صحيح', 'error');
        return;
    }

    submitBtn.disabled   = true;
    submitBtn.innerHTML  = '<i class="bi bi-arrow-repeat spin-icon"></i> جاري الإضافة...';

    try {
        const body = { date, items };
        if (supplierName) body.supplier_name = supplierName;

        const res  = await fetch('/api/bills', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
            body:    JSON.stringify(body),
        });
        const data = await res.json();

        submitBtn.disabled  = false;
        submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> إضافة الفاتورة';

        if (data.success) {
            closeModal();
            resetBillForm();
            showToast('✔ ' + data.message);
            currentPage = 1;
            filtersInitialized = false;
            loadBills(true);
        } else {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(' | ')
                : (data.message || 'حدث خطأ');
            showToast(msg, 'error');
        }
    } catch {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> إضافة الفاتورة';
        showToast('حدث خطأ في الاتصال', 'error');
    }
}

function resetBillForm() {
    document.getElementById('itemsContainer').innerHTML = '';
    const si = document.getElementById('supplierInput');
    if (si) si.value = '';
    const dd = document.getElementById('supplierDropdown');
    if (dd) dd.style.display = 'none';
    itemRowIndex = 0;
    addItemRow();
    document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
    updateLiveTotal();
}

/* ═══════════════════════════════════
   TOAST
═══════════════════════════════════ */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.classList.toggle('error', type === 'error');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════
   UTILITIES
═══════════════════════════════════ */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMoney(val) {
    return parseFloat(val).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}
