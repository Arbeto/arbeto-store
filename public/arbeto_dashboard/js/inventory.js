/**
 * inventory.js — صفحة المخزون والموردين
 */

const CSRF_INV = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

let currentView  = 'inventory'; // 'inventory' | 'suppliers'
let invPage      = 1;
let invLastPage  = 1;

// Filter state
let invFilters    = { supplier_id: '', status: '', search: '' };
let suppSearch    = '';
let invSearchTid  = null;
let suppSearchTid = null;
let allSuppliersForFilter = [];

/* ═══════════════════════════════════
   INIT
═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnShowInventory').addEventListener('click', () => switchView('inventory'));
    document.getElementById('btnShowSuppliers').addEventListener('click',  () => switchView('suppliers'));
    initFilters();
    switchView('inventory');
});

function switchView(view) {
    currentView = view;
    document.getElementById('btnShowInventory').classList.toggle('active', view === 'inventory');
    document.getElementById('btnShowSuppliers').classList.toggle('active', view === 'suppliers');
    document.getElementById('inventorySection').style.display  = view === 'inventory' ? '' : 'none';
    document.getElementById('suppliersSection').style.display  = view === 'suppliers'  ? '' : 'none';
    document.getElementById('inventoryFilters').style.display  = view === 'inventory'  ? '' : 'none';
    document.getElementById('suppliersFilters').style.display  = view === 'suppliers'  ? '' : 'none';

    if (view === 'inventory') { invPage = 1; loadInventory(); }
    else                        loadSuppliers();
}

/* ═══════════════════════════════════
   FILTERS INIT
═══════════════════════════════════ */
function initFilters() {
    loadSuppliersForFilter();

    // Supplier dropdown toggle
    const dropBtn  = document.getElementById('supplierDropdownBtn');
    const dropMenu = document.getElementById('supplierDropdownMenu');
    dropBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => dropMenu.classList.remove('open'));

    // Prevent dropdown search input from closing the menu
    const dropSearch = document.getElementById('supplierDropdownSearch');
    dropSearch.addEventListener('click', (e) => e.stopPropagation());
    dropSearch.addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        const filtered = q
            ? allSuppliersForFilter.filter((s) => s.name.toLowerCase().includes(q))
            : allSuppliersForFilter;
        renderSupplierDropdownOptions(filtered);
    });

    // Status filter buttons
    document.querySelectorAll('.inv-status-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.inv-status-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            invFilters.status = this.dataset.status;
            invPage = 1;
            loadInventory();
        });
    });

    // Inventory search
    document.getElementById('invSearchInput').addEventListener('input', function () {
        clearTimeout(invSearchTid);
        invSearchTid = setTimeout(() => {
            invFilters.search = this.value.trim();
            invPage = 1;
            loadInventory();
        }, 400);
    });

    // Supplier search
    document.getElementById('suppSearchInput').addEventListener('input', function () {
        clearTimeout(suppSearchTid);
        suppSearchTid = setTimeout(() => {
            suppSearch = this.value.trim();
            loadSuppliers();
        }, 400);
    });
}

async function loadSuppliersForFilter() {
    try {
        const res  = await fetch('/api/suppliers');
        const data = await res.json();
        if (!data.success) return;

        allSuppliersForFilter = data.suppliers;
        renderSupplierDropdownOptions(data.suppliers);
    } catch { /* silent */ }
}

function renderSupplierDropdownOptions(suppliers) {
    const list = document.getElementById('supplierDropdownList');
    list.innerHTML =
        `<div class="inv-dropdown-opt active" data-id="">الكل</div>` +
        suppliers.map(s =>
            `<div class="inv-dropdown-opt" data-id="${s.id}">${escHtmlInv(s.name)}</div>`
        ).join('');

    // Re-apply active state if a supplier was already selected
    if (invFilters.supplier_id) {
        list.querySelectorAll('.inv-dropdown-opt').forEach(o => {
            if (o.dataset.id === String(invFilters.supplier_id)) o.classList.add('active');
            else o.classList.remove('active');
        });
    }

    list.querySelectorAll('.inv-dropdown-opt').forEach(opt => {
        opt.addEventListener('click', function (e) {
            e.stopPropagation();
            list.querySelectorAll('.inv-dropdown-opt').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            invFilters.supplier_id = this.dataset.id;
            document.getElementById('supplierDropdownLabel').textContent = this.textContent;
            document.getElementById('supplierDropdownMenu').classList.remove('open');
            invPage = 1;
            loadInventory();
        });
    });
}

/* ═══════════════════════════════════
   INVENTORY
═══════════════════════════════════ */
async function loadInventory() {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '<div class="inv-loading"><i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري التحميل...</div>';

    const params = new URLSearchParams({ page: invPage });
    if (invFilters.supplier_id) params.set('supplier_id', invFilters.supplier_id);
    if (invFilters.status)      params.set('status',      invFilters.status);
    if (invFilters.search)      params.set('search',      invFilters.search);

    try {
        const res  = await fetch('/api/inventory?' + params.toString());
        const data = await res.json();
        if (!data.success) throw new Error();
        invLastPage = data.inventory.last_page ?? 1;
        renderInventory(data.inventory.data);
        renderInvPagination(data.inventory);
    } catch {
        grid.innerHTML = '<div class="inv-empty"><i class="bi bi-wifi-off"></i>حدث خطأ في التحميل</div>';
    }
}

function renderInvPagination(paginator) {
    const el = document.getElementById('invPagination');
    if (!el) return;
    if (!paginator || paginator.last_page <= 1) { el.innerHTML = ''; return; }

    const cur  = paginator.current_page;
    const last = paginator.last_page;
    let html   = '';

    html += `<button class="page-btn" onclick="goInvPage(${cur - 1})" ${cur === 1 ? 'disabled' : ''}>
                 <i class="bi bi-chevron-right"></i></button>`;
    for (let p = 1; p <= last; p++) {
        html += `<button class="page-btn ${p === cur ? 'active' : ''}" onclick="goInvPage(${p})">${p}</button>`;
    }
    html += `<button class="page-btn" onclick="goInvPage(${cur + 1})" ${cur === last ? 'disabled' : ''}>
                 <i class="bi bi-chevron-left"></i></button>`;

    el.innerHTML = html;
}

function goInvPage(page) {
    if (page < 1 || page > invLastPage) return;
    invPage = page;
    loadInventory();
    document.getElementById('inventoryGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderInventory(items) {
    const grid = document.getElementById('inventoryGrid');
    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="inv-empty" style="grid-column:1/-1">
            <i class="bi bi-box-seam"></i>لا توجد عناصر في المخزون بعد</div>`;
        return;
    }

    grid.innerHTML = items.map(item => buildInventoryCard(item)).join('');

    // Attach image upload listeners
    grid.querySelectorAll('.inv-img-input').forEach(input => {
        input.addEventListener('change', function () {
            const itemId = this.dataset.id;
            if (this.files[0]) uploadInventoryImage(itemId, this.files[0], this.closest('.inv-card'));
        });
    });
}

function buildInventoryCard(item) {
    const outOfStock = item.quantity === 0;
    const canEditImage = item.can_edit_image !== false; // Default to true for backwards compatibility

    return `
    <div class="inv-card ${outOfStock ? 'out-of-stock' : ''}" data-id="${item.id}">
        <div class="inv-img-wrap ${canEditImage ? '' : 'read-only'}">
            <img src="${escHtmlInv(item.image_url)}" alt="${escHtmlInv(item.item_name)}" loading="lazy" />
            ${canEditImage ? `
                <div class="inv-img-overlay" onclick="document.getElementById('img-input-${item.id}').click()">
                    <i class="bi bi-camera-fill"></i>
                    <span>أضف صورة للمنتج</span>
                </div>
                <input type="file" class="inv-img-input" id="img-input-${item.id}" data-id="${item.id}" accept="image/*" />
            ` : `
                <div class="inv-img-readonly-overlay">
                    <i class="bi bi-eye-fill"></i>
                    <span>صورة المنتج</span>
                </div>
            `}
        </div>
        <div class="inv-card-body">
            <div class="inv-item-name">${escHtmlInv(item.item_name)}</div>
            <div class="inv-meta"><i class="bi bi-layers-fill"></i> الكمية: <strong>${item.quantity}</strong></div>
            ${item.supplier_name ? `<div class="inv-meta"><i class="bi bi-person-fill"></i> ${escHtmlInv(item.supplier_name)}</div>` : ''}
            ${item.product_id ? `<div class="inv-meta"><i class="bi bi-box-seam"></i> معرف المنتج: <strong>${item.product_id}</strong></div>` : ''}
            ${outOfStock ? '<div class="out-of-stock-badge">نفذ المخزون</div>' : ''}
        </div>
    </div>`;
}

async function uploadInventoryImage(id, file, card) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('_token', CSRF_INV);

    try {
        const res  = await fetch(`/api/inventory/${id}/image`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            const img = card.querySelector('.inv-img-wrap img');
            img.src = data.image_url + '?t=' + Date.now();
            showToastInv('✔ تم تحديث صورة المنتج');
        } else {
            showToastInv(data.message || 'حدث خطأ', 'error');
        }
    } catch {
        showToastInv('حدث خطأ في الاتصال', 'error');
    }
}

/* ═══════════════════════════════════
   SUPPLIERS
═══════════════════════════════════ */
async function loadSuppliers() {
    const grid = document.getElementById('suppliersGrid');
    grid.innerHTML = '<div class="inv-loading"><i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري التحميل...</div>';

    const params = new URLSearchParams();
    if (suppSearch) params.set('search', suppSearch);

    try {
        const url  = '/api/suppliers' + (suppSearch ? '?' + params.toString() : '');
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.success) throw new Error();
        renderSuppliers(data.suppliers);
    } catch {
        grid.innerHTML = '<div class="inv-empty"><i class="bi bi-wifi-off"></i>حدث خطأ في التحميل</div>';
    }
}

function renderSuppliers(suppliers) {
    const grid = document.getElementById('suppliersGrid');
    if (!suppliers || suppliers.length === 0) {
        grid.innerHTML = `<div class="inv-empty" style="grid-column:1/-1">
            <i class="bi bi-people"></i>لا يوجد موردون مسجلون بعد</div>`;
        return;
    }

    grid.innerHTML = suppliers.map(s => buildSupplierCard(s)).join('');

    // Attach address listeners
    grid.querySelectorAll('.supplier-address-input').forEach(textarea => {
        const suppId    = textarea.dataset.id;
        const origVal   = textarea.dataset.orig;
        const updateBtn = textarea.closest('.supplier-address-wrap').querySelector('.btn-update-address');

        textarea.addEventListener('input', function () {
            updateBtn.classList.toggle('visible', this.value !== origVal);
        });

        updateBtn.addEventListener('click', async function () {
            await updateSupplierAddress(suppId, textarea.value, textarea, updateBtn);
        });
    });
}

function buildSupplierCard(s) {
    const invoiceNums = (s.bills || []).map(b => b.invoice_number).filter(Boolean);
    const address     = s.address ?? '';
    const nameJson    = JSON.stringify(s.name).replace(/"/g, '&quot;');

    return `
    <div class="supplier-card">
        <div class="supplier-name"><i class="bi bi-person-badge-fill"></i>${escHtmlInv(s.name)}</div>
        <div class="supplier-stats">
            <div class="stat-badge inv-count-badge" onclick="openSupplierProductsModal(${s.id}, ${nameJson})">
                <i class="bi bi-box-seam"></i> ${s.product_count ?? 0} منتج
            </div>
            <div class="stat-badge"><i class="bi bi-layers"></i> كمية: ${s.total_quantity ?? 0}</div>
            <div class="stat-badge inv-count-badge" onclick="openInvoiceModal('${escHtmlInv(s.name)}', ${JSON.stringify(invoiceNums).replace(/"/g, '&quot;')})">
                <i class="bi bi-receipt"></i> ${invoiceNums.length} فاتورة
            </div>
        </div>
        <div class="supplier-address-wrap">
            <label>العنوان</label>
            <textarea class="supplier-address-input" data-id="${s.id}" data-orig="${escHtmlInv(address)}" rows="2">${escHtmlInv(address)}</textarea>
            <button class="btn-update-address"><i class="bi bi-floppy-fill"></i> تحديث</button>
        </div>
    </div>`;
}

async function updateSupplierAddress(id, address, textarea, btn) {
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري الحفظ...';
    btn.disabled  = true;

    try {
        const res  = await fetch(`/api/suppliers/${id}/address`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF_INV },
            body:    JSON.stringify({ address }),
        });
        const data = await res.json();
        btn.innerHTML = '<i class="bi bi-floppy-fill"></i> تحديث';
        btn.disabled  = false;

        if (data.success) {
            textarea.dataset.orig = address;
            btn.classList.remove('visible');
            showToastInv('✔ تم تحديث العنوان');
        } else {
            showToastInv(data.message || 'حدث خطأ', 'error');
        }
    } catch {
        btn.innerHTML = '<i class="bi bi-floppy-fill"></i> تحديث';
        btn.disabled  = false;
        showToastInv('حدث خطأ في الاتصال', 'error');
    }
}

/* ═══════════════════════════════════
   SUPPLIER PRODUCTS MODAL
═══════════════════════════════════ */
async function openSupplierProductsModal(supplierId, supplierName) {
    const modal   = document.getElementById('invMiniModal');
    const title   = document.getElementById('invMiniModalTitle');
    const content = document.getElementById('invMiniModalContent');

    title.textContent = `منتجات المورد: ${supplierName}`;
    content.innerHTML = '<div class="inv-loading"><i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري التحميل...</div>';
    modal.classList.add('open');

    try {
        const res  = await fetch(`/api/suppliers/${supplierId}/products`);
        const data = await res.json();
        if (!data.success) throw new Error();

        if (!data.products || data.products.length === 0) {
            content.innerHTML = '<span style="color:#aaa;font-size:.85rem">لا توجد منتجات لهذا المورد</span>';
            return;
        }

        content.innerHTML = data.products.map(p => `
            <div class="supp-product-row">
                <span class="prod-name">${escHtmlInv(p.item_name)}</span>
                <span class="prod-qty ${p.quantity === 0 ? 'zero' : ''}">الكمية: ${p.quantity}</span>
            </div>`).join('');
    } catch {
        content.innerHTML = '<span style="color:#e74c3c;font-size:.85rem">حدث خطأ في التحميل</span>';
    }
}

/* ═══════════════════════════════════
   INVOICES MINI-MODAL
═══════════════════════════════════ */
function openInvoiceModal(supplierName, invoiceNums) {
    const modal   = document.getElementById('invMiniModal');
    const title   = document.getElementById('invMiniModalTitle');
    const content = document.getElementById('invMiniModalContent');

    title.textContent = `فواتير المورد: ${supplierName}`;
    content.innerHTML = invoiceNums.length
        ? invoiceNums.map(n => `<span class="invoice-num-pill">${escHtmlInv(n)}</span>`).join('')
        : '<span style="color:#aaa;font-size:.85rem">لا توجد فواتير</span>';

    modal.classList.add('open');
}

function closeInvoiceModal() {
    document.getElementById('invMiniModal').classList.remove('open');
}

/* ═══════════════════════════════════
   TOAST
═══════════════════════════════════ */
function showToastInv(message, type = 'success') {
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
function escHtmlInv(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

