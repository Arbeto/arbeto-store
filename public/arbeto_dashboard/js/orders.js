// ===== Global Variables =====
let orders = [];
let shippingCompanies = [];
let currentOrderId = null;
let companyGovPricesCache = {}; // { companyId: { governorate: price } }
let shippedFilter = { search: '', period: 'all' };

// ===== Pagination State =====
let newOrdersPage   = 1;
let shippedPage     = 1;
const PAGE_SIZE     = 10;

// ===== Check Product Options Availability =====
async function checkProductOptionsAvailability(productId, selectedOptions) {
    try {
        const response = await fetch(`/api/products/${productId}/options-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selected_options: selectedOptions })
        });
        if (!response.ok) return false;
        const result = await response.json();
        return result.available;
    } catch (error) {
        console.error('Error checking options availability:', error);
        return false;
    }
}

// ===== Check if order has unavailable items =====
async function hasUnavailableItems(orderItems) {
    for (let item of orderItems) {
        const hasOptions = item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0;
        if (hasOptions) {
            const available = await checkProductOptionsAvailability(item.product_id, item.selected_options);
            if (!available) {
                return true;
            }
        }
    }
    return false;
}

// ===== Image Gallery =====
let _galleryImages  = [];
let _galleryIndex   = 0;

function openImageGallery(imagesJson) {
    try { _galleryImages = JSON.parse(imagesJson); } catch { _galleryImages = []; }
    if (!_galleryImages.length) return;
    _galleryIndex = 0;
    renderGallery();
    document.getElementById('imageGalleryModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeImageGallery() {
    document.getElementById('imageGalleryModal').style.display = 'none';
    document.body.style.overflow = '';
}
function galleryPrev() {
    if (!_galleryImages.length) return;
    _galleryIndex = (_galleryIndex - 1 + _galleryImages.length) % _galleryImages.length;
    renderGallery();
}
function galleryNext() {
    if (!_galleryImages.length) return;
    _galleryIndex = (_galleryIndex + 1) % _galleryImages.length;
    renderGallery();
}
function renderGallery() {
    const img = document.getElementById('galleryImg');
    const counter = document.getElementById('galleryCounter');
    if (img) img.src = (_galleryImages[_galleryIndex] || '').startsWith('http') ? _galleryImages[_galleryIndex] : '/' + _galleryImages[_galleryIndex];
    if (counter) counter.textContent = `${_galleryIndex + 1} / ${_galleryImages.length}`;
}
document.addEventListener('keydown', e => {
    const modal = document.getElementById('imageGalleryModal');
    if (!modal || modal.style.display === 'none') return;
    if (e.key === 'ArrowLeft')  galleryNext();
    if (e.key === 'ArrowRight') galleryPrev();
    if (e.key === 'Escape')     closeImageGallery();
});

function getAddressTypeLabel(type) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "work") return "العمل";
  if (normalized === "home") return "المنزل";
  return "اخرى";
}

// ===== Receipt / Payment Proof Lightbox =====
function openReceiptLightbox(url) {
    const lb = document.getElementById('receiptLightbox');
    const img = document.getElementById('receiptLightboxImg');
    if (!lb || !img) return;
    img.src = url;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeReceiptLightbox() {
    const lb = document.getElementById('receiptLightbox');
    if (lb) lb.style.display = 'none';
    document.body.style.overflow = '';
}

// ===== Load Gov Prices for Fixed Companies =====
async function loadGovPricesForCompanies(governorate) {
    const fixedCompanies = shippingCompanies.filter(c => c.shipping_type === 'fixed');
    await Promise.all(fixedCompanies.map(async company => {
        if (companyGovPricesCache[company.id]) return;
        try {
            const res = await fetch(`/api/shipping-companies/${company.id}/gov-prices`);
            if (res.ok) {
                const prices = await res.json();
                companyGovPricesCache[company.id] = {};
                prices.forEach(p => companyGovPricesCache[company.id][p.governorate_name] = parseFloat(p.price));
            }
        } catch {}
    }));
}

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
    loadShippingCompanies();
    loadOrders();
});

// ===== Load Shipping Companies =====
async function loadShippingCompanies() {
    try {
        const res = await fetch("/api/shipping-companies");
        if (res.ok) shippingCompanies = await res.json();
    } catch (e) {
        console.error("Failed to load shipping companies", e);
    }
}

// ===== Load Orders from API =====
async function loadOrders() {
    try {
        const response = await fetch("/api/orders");
        if (!response.ok) throw new Error("فشل تحميل الطلبات");
        orders = await response.json();

        displayNewOrders();
        buildShippedFilters();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل الطلبات", "error");
    }
}

// ===== Status label helper =====
function getOrderStatusLabel(order) {
    const s = order.status || '';
    const isReturn = order.order_type === 'return';

    if (s === 'pending' || s === 'new' || s === 'received') return 'تم استلام الطلب';
    if (s === 'approved') return 'تم قبول الطلب';
    if (s === 'preparing') return 'جاري تجهيز الطلبية';
    if (s === 'shipped') return 'تم شحن الطلبية';
    if (s === 'out-for-delivery') return 'خرجت للتوصيل';
    if (s === 'delivered') {
        // إذا كان طلب مرتجع، نعرض رسالة خاصة
        return isReturn ? 'تم ارجاع الاموال بنجاح' : 'تم التوصيل بنجاح';
    }
    if (s === 'failed-delivery') return 'تعذر التوصيل';
    if (s === 'cancelled') return 'تم الغاء الطلبية';
    if (s === 'rejected') return 'طلب مرفوض';
    return 'تم استلام الطلب';
}

// ===== Helpers =====
function getReturnReasonLabel(rt) {
    if (rt === 'damaged')     return 'المنتج تالف';
    if (rt === 'not_working') return 'المنتج لا يعمل بشكل صحيح';
    if (rt === 'other')       return 'سبب آخر';
    return rt || '—';
}
function getPaymentLabel(pm) {
    if (!pm) return '—';
    pm = pm.toLowerCase();
    if (pm === 'cash' || pm === 'cod') return 'استلام نقدي';
    if (pm === 'instapay') return 'إنستا باي';
    if (pm === 'wallet')   return 'محفظة الكاش';
    return pm;
}

// ===== Render Pagination =====
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    let html = '<div style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:18px;flex-wrap:wrap;direction:ltr">';
    html += `<button onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="padding:6px 12px;border-radius:7px;border:2px solid #eaf2e4;background:${currentPage===1?'#f5f5f5':'#fff'};color:${currentPage===1?'#aaa':'#2d4a1e'};cursor:${currentPage===1?'default':'pointer'};font-weight:600;">&#8250;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="${onPageChange}(${i})" style="padding:6px 12px;border-radius:7px;border:2px solid ${i===currentPage?'#596d52':'#eaf2e4'};background:${i===currentPage?'#596d52':'#fff'};color:${i===currentPage?'#fff':'#2d4a1e'};cursor:pointer;font-weight:600;">${i}</button>`;
    }
    html += `<button onclick="${onPageChange}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="padding:6px 12px;border-radius:7px;border:2px solid #eaf2e4;background:${currentPage===totalPages?'#f5f5f5':'#fff'};color:${currentPage===totalPages?'#aaa':'#2d4a1e'};cursor:${currentPage===totalPages?'default':'pointer'};font-weight:600;">&#8249;</button>`;
    html += '</div>';
    el.innerHTML = html;
}
function goToNewOrdersPage(page) {
    const total = orders.filter(o => o.status === 'pending' || o.status === 'new' || o.status === 'approved' || o.status === 'received').length;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    newOrdersPage = Math.max(1, Math.min(page, totalPages));
    displayNewOrders();
}
function goToShippedPage(page) {
    shippedPage = Math.max(1, page);
    filterShippedOrders();
}

// ===== Build Return Order Card (New Orders) =====
function buildNewReturnCard(order) {
    const rd = order.return_data || {};
    const images = rd.images || [];
    const imagesJson = JSON.stringify(images);
    const items = Array.isArray(order.items) ? order.items : [];

    const productsTotal = items.reduce((s, it) => s + (parseFloat(it.price || 0) * parseInt(it.quantity || 1)), 0);
    const shipping      = parseFloat(order.express_price || 0);
    const refund        = productsTotal - shipping;

    const productsHtml = items.map(it => {
        let optionsHtml = '';
        if (it.selected_options && Array.isArray(it.selected_options) && it.selected_options.length > 0) {
          const optionsArr = it.selected_options.map(opt => {
            const optionName = opt.option || opt.optionName || '';
            const autoTag = opt.auto_selected ? '<span style="color:#e67e22;font-size:.75rem;"> (تلقائي)</span>' : '';
            return `<span style="font-weight:600;">${opt.group || ''}:</span> ${optionName}${autoTag}`;
          });
          optionsHtml = `<div class="product-options" style="font-size:.8rem;color:#666;margin-top:4px;">${optionsArr.join(' • ')}</div>`;
        }
        return `<div class="product-item"><div class="product-details">
           <div class="product-name">${it.name || it.product_name || 'منتج'}</div>
           ${optionsHtml}
           <div class="product-quantity">الكمية: ${it.quantity || it.qty || 1} &nbsp;|&nbsp; السعر: ${it.price ? parseFloat(it.price).toFixed(2) + ' جنيه للقطعة' : '—'}</div>
         </div></div>`;
    }).join('');

    const statusLabel = getOrderStatusLabel(order);
    const isApproved  = order.status === 'approved';

    return `
    <div class="order-card normal" style="border-left:4px solid #e74c3c;background:linear-gradient(135deg,#fff5f5 0%,#fce4e4 100%)">
      <div class="order-header">
        <span class="order-type-badge normal" style="background:#e74c3c;color:#fff;">طلب استرجاع</span>
        <span style="display:inline-flex;align-items:center;background:${isApproved ? '#40916c' : '#f39c12'};color:#fff;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:700;">
          <i class="bi bi-circle-fill" style="font-size:.45rem;margin-left:5px;"></i> ${statusLabel}
        </span>
        <span class="order-id">#${order.id}</span>
      </div>
      <div class="order-info">
        <div class="info-row">
          <span class="info-label"><i class="bi bi-person"></i> اسم العميل</span>
          <span class="info-value">${order.user ? order.user.first_name + ' ' + order.user.last_name : 'عميل مجهول'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="bi bi-geo-alt"></i> العنوان</span>
          <span class="info-value">${[order.governorate, order.city, order.street].filter(Boolean).join(' - ') || 'غير متوفر'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="bi bi-telephone"></i> رقم الهاتف</span>
          <span class="info-value">${order.user ? order.user.phone : 'غير متوفر'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="bi bi-cash"></i> إجمالي مبلغ المنتجات</span>
          <span class="info-value">${productsTotal.toFixed(2)} جنيه</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="bi bi-truck"></i> سعر الشحن</span>
          <span class="info-value">${shipping.toFixed(2)} جنيه</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="bi bi-credit-card"></i> وسيلة الدفع</span>
          <span class="info-value">${getPaymentLabel(rd.payment_method)}</span>
        </div>
        ${rd.account_number ? `
        <div class="info-row">
          <span class="info-label"><i class="bi bi-phone"></i> رقم الهاتف للإرجاع</span>
          <span class="info-value">${rd.account_number}</span>
        </div>` : ''}
        ${images.length ? `
        <div class="info-row">
          <span class="info-label"><i class="bi bi-images"></i> صور الاسترجاع</span>
          <span class="info-value"><button onclick="openImageGallery('${imagesJson.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')" style="background:#596d52;color:#fff;border:none;border-radius:7px;padding:6px 14px;cursor:pointer;font-size:.85rem;font-weight:600;"><i class="bi bi-images"></i> عرض الصور (${images.length})</button></span>
        </div>` : ''}
        <div class="info-row">
          <span class="info-label" style="color:#e74c3c"><i class="bi bi-cash-coin"></i> المبلغ المطلوب استرداده</span>
          <span class="info-value" style="color:#e74c3c;font-weight:700;">${refund.toFixed(2)} جنيه</span>
        </div>
      </div>
      <div class="products-section">
        <div class="products-title"><i class="bi bi-box-seam"></i> المنتجات المسترجعة</div>
        <div class="products-list">${productsHtml}</div>
      </div>
      <div class="order-actions">
        ${isApproved
            ? `<button class="btn-approve" onclick="approveOrder(${order.id})">
                 <i class="bi bi-truck"></i> إرسال لشركة الشحن
               </button>`
            : `<button class="btn-approve" onclick="openApprovalConfirmModal(${order.id})">
                 <i class="bi bi-check-circle"></i> موافقة
               </button>`
        }
        <button class="btn-reject" onclick="rejectOrder(${order.id})">
          <i class="bi bi-x-circle"></i> رفض
        </button>
      </div>
    </div>`;
}

// ===== Display New Orders =====
async function displayNewOrders() {
    const container = document.getElementById("newOrdersContainer");
    const allNewOrders = orders.filter(
        (order) => order.status === "pending" || order.status === "new" || order.status === "approved" || order.status === "received",
    );
    const totalPages = Math.ceil(allNewOrders.length / PAGE_SIZE) || 1;
    if (newOrdersPage > totalPages) newOrdersPage = totalPages;
    const newOrders = allNewOrders.slice((newOrdersPage - 1) * PAGE_SIZE, newOrdersPage * PAGE_SIZE);

    if (allNewOrders.length === 0) {
        container.innerHTML =
            '<p style="text-align: center; color: #596d52; grid-column: 1/-1; font-weight: bold; font-size: 1.2rem;">لا توجد طلبات جديدة :(</p>';
        renderPagination('newOrdersPagination', 1, 1, 'goToNewOrdersPage');
        return;
    }

    // Check availability for each order
    const ordersWithAvailability = await Promise.all(
        newOrders.map(async (order) => {
            if (order.order_type === 'return') {
                return { order, unavailable: false };
            }

            const unavailable = await hasUnavailableItems(order.items || []);
            return { order, unavailable };
        })
    );

    container.innerHTML = ordersWithAvailability
        .map(
            ({ order, unavailable }) => {
                if (order.order_type === 'return') return buildNewReturnCard(order);

                const disabledStyle = unavailable ? 'opacity: 0.5; cursor: not-allowed; pointer-events: none;' : '';
                const tooltipAttr = unavailable ? 'title="الكمية منتهية - لا يمكن معالجة هذا الطلب"' : '';

                return `
    <div class="order-card normal" style="${order.status === 'approved' ? 'border-top:3px solid #40916c;' : ''}${unavailable ? 'border: 2px solid #e74c3c;' : ''}">
      <div class="order-header">
        <span class="order-type-badge normal" style="${order.status === 'approved' ? 'background:#40916c;color:#fff;' : ''}">${getOrderStatusLabel(order)}</span>
        <span class="order-id">#${order.id} <em style="font-size:.78rem;color:#596d52;font-weight:600;">طلب شراء</em></span>
        ${unavailable ? '<span style="background:#e74c3c;color:#fff;padding:4px 8px;border-radius:4px;font-size:.75rem;font-weight:600;"><i class="bi bi-exclamation-triangle"></i> كمية منتهية</span>' : ''}
      </div>

      <div class="order-info">
        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-person"></i> اسم العميل
          </span>
          <span class="info-value">${order.user ? order.user.first_name + " " + order.user.last_name : "عميل مجهول"}</span>
        </div>

        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-geo-alt"></i> العنوان
          </span>
          <span class="info-value">${[order.governorate, order.city, order.street].filter(Boolean).join(' - ') || 'غير متوفر'}${order.user && order.user.addresses && order.user.addresses.length ? ' (' + getAddressTypeLabel(order.user.addresses[0].address_type) + ')' : ''}</span>
        </div>

        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-telephone"></i> رقم الهاتف
          </span>
          <span class="info-value">${order.user ? order.user.phone : "غير متوفر"}</span>
        </div>

        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-cash"></i> إجمالي المبلغ
          </span>
          <span class="info-value">${order.total_price} جنيه</span>
        </div>

        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-truck"></i> سعر الشحن
          </span>
          <span class="info-value">${order.express_price} جنيه</span>
        </div>

        <div class="info-row">
          <span class="info-label">
            <i class="bi bi-credit-card"></i> وسيلة الدفع
          </span>
          <span class="info-value">${(function(pm){ pm = (pm || '').toLowerCase(); if(pm === 'instapay') return 'إنستاباي'; if(pm === 'wallet') return 'محفظة الكاش'; if(pm === 'cash' || pm === 'cod') return 'عند الاستلام'; return order.payment_method || '—'; })(order.payment_method)}
            ${(function(pm){ pm=(pm||'').toLowerCase(); return (pm==='instapay'||pm==='wallet') && order.payment_proof ? `<button class="btn-receipt" onclick="openReceiptLightbox('/${order.payment_proof}')"><i class="bi bi-image"></i> صورة الإيصال</button>` : ''; })(order.payment_method)}
          </span>
        </div>

        ${
            order.comments
                ? `
          <div class="notes-section">
            <div class="info-label">
              <i class="bi bi-chat-left-text"></i> ملاحظات
            </div>
            <div class="notes-text">${order.comments}</div>
          </div>
        `
                : ""
        }
      </div>

      <div class="products-section">
        <div class="products-title">
          <i class="bi bi-box-seam"></i> المنتجات المطلوبة
        </div>
        <div class="products-list">
          ${(order.items || [])
              .map(
                  (item) => {
                    let optionsHtml = '';
                    if (item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0) {
                      const optionsArr = item.selected_options.map(opt => {
                        const optionName = opt.option || opt.optionName || '';
                        const autoTag = opt.auto_selected ? '<span style="color:#e67e22;font-size:.75rem;"> (تلقائي)</span>' : '';
                        return `<span style="font-weight:600;">${opt.group || ''}:</span> ${optionName}${autoTag}`;
                      });
                      optionsHtml = `<div class="product-options" style="font-size:.8rem;color:#666;margin-top:4px;">${optionsArr.join(' • ')}</div>`;
                    }
                    return `
            <div class="product-item">
              <div class="product-details">
                <div class="product-name">${item.name}</div>
                ${optionsHtml}
                <div class="product-quantity">الكمية: ${item.quantity} &nbsp;|&nbsp; السعر: ${item.price ? parseFloat(item.price).toFixed(2) + ' جنيه' : '—'}</div>
              </div>
            </div>
          `;
                  })
              .join("")}
        </div>
      </div>

      <div class="order-actions" style="${disabledStyle}" ${tooltipAttr}>
        ${order.status === 'approved'
            ? `<button class="btn-approve" onclick="approveOrder(${order.id})" ${unavailable ? 'disabled' : ''}>
                <i class="bi bi-truck"></i> ارسال الى شركة شحن
               </button>`
            : `<button class="btn-approve" onclick="openApprovalConfirmModal(${order.id})" ${unavailable ? 'disabled' : ''}>
                <i class="bi bi-check-circle"></i> موافقة
               </button>`
        }
        <button class="btn-reject" onclick="rejectOrder(${order.id})">
          <i class="bi bi-x-circle"></i> رفض
        </button>
      </div>
    </div>
  `;
            })
        .join("");
    renderPagination('newOrdersPagination', newOrdersPage, totalPages, 'goToNewOrdersPage');
}

// ===== Display Shipped Orders =====
function displayShippedOrders() {
    filterShippedOrders();
}

// ===== Build Dynamic Year/Month Filter Selects =====
function buildShippedFilters() {
    const shippedOrders = orders.filter(o =>
        o.status !== "pending" && o.status !== "new" && o.status !== "approved"
    );

    const now = new Date();

    // Collect unique years
    const yearSet = new Set();
    shippedOrders.forEach(o => yearSet.add(new Date(o.created_at).getFullYear()));
    const years = [...yearSet].sort((a, b) => b - a);

    const yearSel = document.getElementById('shippedYearSelect');
    if (yearSel) {
        yearSel.innerHTML = '<option value="all">كل السنوات</option>';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === now.getFullYear()) opt.selected = true;
            yearSel.appendChild(opt);
        });
    }

    rebuildMonthSelect();
}

function rebuildMonthSelect() {
    const now = new Date();
    const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const yearSel  = document.getElementById('shippedYearSelect');
    const monthSel = document.getElementById('shippedMonthSelect');
    if (!monthSel) return;

    const selectedYear = yearSel?.value || 'all';

    const shippedOrders = orders.filter(o =>
        o.status !== "pending" && o.status !== "new" && o.status !== "approved" && o.status !== "received"
    );

    const monthSet = new Set();
    shippedOrders.forEach(o => {
        const d = new Date(o.created_at);
        if (selectedYear === 'all' || d.getFullYear() === parseInt(selectedYear)) {
            monthSet.add(d.getMonth());
        }
    });

    monthSel.innerHTML = '<option value="all">كل الشهور</option>';
    [...monthSet].sort((a, b) => a - b).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = MONTH_NAMES[m];
        if (m === now.getMonth()) opt.selected = true;
        monthSel.appendChild(opt);
    });

    filterShippedOrders();
}

function onShippedYearChange() {
    rebuildMonthSelect();
}

// ===== Filter / Search Shipped Orders =====
function filterShippedOrders() {
    const container = document.getElementById("shippedOrdersContainer");
    const section = container.closest(".orders-section");

    const search      = document.getElementById("shippedSearch")?.value.trim().toLowerCase() || '';
    const selectedYear  = document.getElementById('shippedYearSelect')?.value  || 'all';
    const selectedMonth = document.getElementById('shippedMonthSelect')?.value;

    let shippedOrders = orders.filter(o =>
        o.status !== "pending" && o.status !== "new" && o.status !== "approved" && o.status !== "received"
    );

    if (selectedYear !== 'all') {
        shippedOrders = shippedOrders.filter(o =>
            new Date(o.created_at).getFullYear() === parseInt(selectedYear)
        );
    }
    if (selectedMonth !== undefined && selectedMonth !== 'all') {
        shippedOrders = shippedOrders.filter(o =>
            new Date(o.created_at).getMonth() === parseInt(selectedMonth)
        );
    }
    if (search) {
        shippedOrders = shippedOrders.filter(o => {
            if (String(o.id).includes(search)) return true;
            const name = o.user ? `${o.user.first_name} ${o.user.last_name}`.toLowerCase() : '';
            return name.includes(search);
        });
    }

    if (section) section.style.display = "block";
    if (shippedOrders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#596d52;padding:24px;font-weight:600;">لا توجد طلبات مشحونة تطابق البحث</p>';
        renderPagination('shippedOrdersPagination', 1, 1, 'goToShippedPage');
        return;
    }
    const totalPages = Math.ceil(shippedOrders.length / PAGE_SIZE) || 1;
    if (shippedPage > totalPages) shippedPage = 1;
    const pageOrders = shippedOrders.slice((shippedPage - 1) * PAGE_SIZE, shippedPage * PAGE_SIZE);
    container.innerHTML = pageOrders.map(buildShippedOrderCard).join("");
    renderPagination('shippedOrdersPagination', shippedPage, totalPages, 'goToShippedPage');
}

// ===== Build single shipped order card =====
function buildShippedOrderCard(order) {
    const scRaw = order.shipping_company;
    const companyName = scRaw
        ? (typeof scRaw === 'object' ? (scRaw.name || 'غير معروف') : String(scRaw))
        : null;
    const companyDisplay = companyName
        ? `${companyName} (${parseFloat(order.express_price || 0).toFixed(0)} جنيه)`
        : 'غير محدد';

    const isReturn      = order.order_type === 'return';
    const currentStatus = order.status || 'shipped';
    const needsReason   = currentStatus === 'failed-delivery' || currentStatus === 'cancelled';
    const isRejected    = order.status === 'rejected' && !isReturn;

    // Statuses where the status-update section is hidden for return orders
    const FINAL_STATUSES = new Set(['delivered', 'failed-delivery', 'cancelled', 'rejected']);
    const hideStatusControl = isReturn && FINAL_STATUSES.has(currentStatus);

    let badgeBg = isReturn ? '#e74c3c' : (isRejected ? '#e74c3c' : '');
    const badgeStyle = badgeBg ? `background:${badgeBg};color:#fff;` : '';
    const typeBadge  = isReturn ? 'طلب استرجاع' : 'طلب شراء';

    const rd = isReturn ? (order.return_data || {}) : null;

    /* ── Return card layout ─────────────────────────────── */
    if (isReturn) {
        const items         = Array.isArray(order.items) ? order.items : [];
        const productsTotal = items.reduce((s, it) => s + (parseFloat(it.price || 0) * parseInt(it.quantity || it.qty || 1)), 0);
        const shipping      = parseFloat(order.express_price || 0);
        const refund        = productsTotal - shipping;
        const images        = rd.images || [];
        const imagesJson    = JSON.stringify(images);

        const productsList = items.map(it => {
            let optionsHtml = '';
            if (it.selected_options && Array.isArray(it.selected_options) && it.selected_options.length > 0) {
              const optionsArr = it.selected_options.map(opt => {
                const optionName = opt.option || opt.optionName || '';
                const autoTag = opt.auto_selected ? ' (تلقائي)' : '';
                return `${opt.group || ''}: ${optionName}${autoTag}`;
              });
              optionsHtml = ` <span style="color:#888;font-size:.8rem;">[${optionsArr.join(' | ')}]</span>`;
            }
            return `<span style="display:block;padding:4px 0;color:#2c4b2c;font-size:.88rem">${it.name || it.product_name || 'منتج'} (${it.quantity || it.qty || 1})${optionsHtml}</span>`;
        }).join('');

        const payLabel = getPaymentLabel(rd.payment_method);
        const accNum   = rd.account_number ? ` (${rd.account_number})` : '';

        return `
    <div class="shipped-order-card" style="border-color:#e74c3c;border-width:2px;">
      <div class="shipped-order-header" style="background:linear-gradient(135deg,#fdf2f2 0%,#fce4e4 100%);border-radius:8px;">
        <span class="order-id">#${order.id}</span>
        <span class="order-type-badge" style="${badgeStyle}">${typeBadge}</span>
        <button onclick="openResetOrderModal(${order.id})" title="إعادة تعيين الطلب" style="margin-right:auto;background:#fff3cd;color:#856404;border:1.5px solid #ffc107;border-radius:8px;padding:5px 12px;font-size:.8rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;">
          <i class="bi bi-arrow-counterclockwise"></i> إعادة تعيين
        </button>
      </div>
      <div class="shipped-order-info">
        <div class="shipped-info-item">
          <span class="shipped-info-label">اسم العميل</span>
          <span class="shipped-info-value">${order.user ? order.user.first_name + ' ' + order.user.last_name : 'عميل مجهول'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">رقم الهاتف</span>
          <span class="shipped-info-value">${order.user ? order.user.phone : 'غير متوفر'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">العنوان</span>
          <span class="shipped-info-value">${[order.governorate, order.city, order.street].filter(Boolean).join(', ') || 'غير متوفر'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">شركة الشحن</span>
          <span class="shipped-info-value">${companyName || 'غير محدد'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">قيمة الشحن</span>
          <span class="shipped-info-value">
            <p id="shipping-cost-${order.id}" onclick="editShippingCost(${order.id})" style="display:inline;cursor:pointer;color:#596d52;font-weight:600;border-bottom:1px dashed #596d52;margin:0;padding:1px 4px;">${shipping.toFixed(0)} جنيه</p>
            <input type="number" id="shipping-input-${order.id}" value="${shipping}" min="0" style="display:none;width:80px;padding:3px 6px;border:2px solid #596d52;border-radius:5px;text-align:center;" onblur="saveShippingCost(${order.id})" onkeypress="if(event.key==='Enter') saveShippingCost(${order.id})">
          </span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">المنتجات المسترجعة</span>
          <span class="shipped-info-value">${productsList || '—'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">وسيلة الدفع</span>
          <span class="shipped-info-value">${payLabel}${accNum}</span>
        </div>
        ${images.length ? `
        <div class="shipped-info-item">
          <span class="shipped-info-label"><i class="bi bi-images"></i> صور الاسترجاع</span>
          <span class="shipped-info-value"><button onclick="openImageGallery('${imagesJson.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')" style="background:#596d52;color:#fff;border:none;border-radius:7px;padding:6px 14px;cursor:pointer;font-size:.85rem;font-weight:600;"><i class="bi bi-images"></i> عرض الصور (${images.length})</button></span>
        </div>` : ''}
        <div class="shipped-info-item">
          <span class="shipped-info-label">سبب الاسترجاع</span>
          <span class="shipped-info-value">${getReturnReasonLabel(rd.reason_type)}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">حالة الطلب</span>
          <span class="shipped-info-value">${getOrderStatusLabel(order)}</span>
        </div>
        ${rd.reason_detail ? `
        <div class="shipped-info-item">
          <span class="shipped-info-label">تفاصيل السبب</span>
          <span class="shipped-info-value">${rd.reason_detail}</span>
        </div>` : ''}
      </div>
      ${!hideStatusControl ? `
      <div class="status-update-section">
        <div class="status-group">
          <label class="status-label">حالة الطلب</label>
          <select class="status-select" id="status-${order.id}" onchange="handleStatusChange(${order.id})">
            ${getStatusOptionsHtml(order)}
          </select>
          <textarea class="reason-input" id="reason-${order.id}"
            placeholder="اكتب السبب هنا..."
            style="display:${needsReason ? 'block' : 'none'};resize:vertical;min-height:70px;margin-top:8px;width:100%;padding:8px 10px;border:2px solid #eaf2e4;border-radius:8px;font-size:.87rem;outline:none;font-family:inherit;">${order.failure_reason || ''}</textarea>
          <div style="margin-top:10px;">
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;" id="cs-tags-${order.id}">${getCustomStatusTagsHtml()}</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" id="newStatusInput-${order.id}" placeholder="إضافة حالة جديدة..."
                style="flex:1;padding:7px 10px;border:2px solid #eaf2e4;border-radius:7px;font-size:.83rem;outline:none;background:#fafdf8;color:#2d4a1e;" />
              <button type="button" onclick="addCustomStatus(${order.id})"
                style="background:#596d52;color:#fff;border:none;border-radius:7px;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
        </div>
        <button class="btn-update-status" onclick="updateOrderStatus(${order.id})">
          <i class="bi bi-arrow-repeat"></i> تحديث الحالة
        </button>
      </div>` : ''}
      ${currentStatus === 'delivered' ? `
      <div class="refund-section" style="margin-top:15px;padding:15px;background:linear-gradient(135deg,#f8fff8 0%,#eaf8ea 100%);border:2px solid #d4edda;border-radius:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <h4 style="margin:0;color:#28a745;font-size:.95rem;font-weight:700;">
            <i class="bi bi-cash-coin"></i> إدارة الاسترداد
          </h4>
          <span style="color:#28a745;font-size:.85rem;font-weight:600;">
            المبلغ المطلوب: ${(productsTotal - shipping).toFixed(2)} جنيه
          </span>
        </div>
        ${order.refund === 'delivered' ? `
        <div style="background:#fff;padding:12px;border-radius:8px;margin-bottom:12px;border:2px solid #28a745;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <i class="bi bi-check-circle-fill" style="color:#28a745;font-size:1.1rem;"></i>
            <span style="color:#28a745;font-weight:700;">تم تحويل المبلغ المسترد</span>
          </div>
          ${order.refund_receipt ? `
          <button onclick="viewRefundReceipt('/${order.refund_receipt}')" style="background:#17a2b8;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:.85rem;font-weight:600;">
            <i class="bi bi-image"></i> عرض إيصال التحويل
          </button>` : ''}
        </div>` : `
        <div style="display:flex;gap:10px;align-items:center;">
          <button onclick="openRefundModal(${order.id})" style="background:#28a745;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:.9rem;font-weight:600;display:flex;align-items:center;gap:6px;">
            <i class="bi bi-upload"></i> رفع إيصال التحويل
          </button>
          <span style="color:#666;font-size:.85rem;">قم برفع صورة إيصال تحويل المبلغ المسترد</span>
        </div>`}
      </div>` : ''}
    </div>`;
    }

    /* ── Purchase order (standard) ──────────────────────── */
    return `
    <div class="shipped-order-card" style="${isRejected ? 'border-color:#e74c3c;border-width:2px;' : ''}">
      <div class="shipped-order-header" style="${isRejected ? 'background:linear-gradient(135deg,#fdf2f2 0%,#fce4e4 100%);border-radius:8px;' : ''}">
        <span class="order-id">#${order.id}</span>
        <span class="order-type-badge ${isRejected ? 'rejected' : 'normal'}" style="${badgeStyle}">${typeBadge}</span>
        <button onclick="openResetOrderModal(${order.id})" title="إعادة تعيين الطلب" style="margin-right:auto;background:#fff3cd;color:#856404;border:1.5px solid #ffc107;border-radius:8px;padding:5px 12px;font-size:.8rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;">
          <i class="bi bi-arrow-counterclockwise"></i> إعادة تعيين
        </button>
      </div>
      <div class="shipped-order-info">
        <div class="shipped-info-item">
          <span class="shipped-info-label">اسم العميل</span>
          <span class="shipped-info-value">${order.user ? order.user.first_name + ' ' + order.user.last_name : 'عميل مجهول'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">رقم الهاتف</span>
          <span class="shipped-info-value">${order.user ? order.user.phone : 'غير متوفر'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">العنوان</span>
          <span class="shipped-info-value">${[order.governorate, order.city, order.street].filter(Boolean).join(', ') || 'غير متوفر'}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">إجمالي المبلغ شامل الشحن</span>
          <span class="shipped-info-value">${(parseFloat(order.total_price || 0) + parseFloat(order.express_price || 0)).toFixed(2)} جنيه</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">شركة الشحن</span>
          <span class="shipped-info-value">${companyDisplay}</span>
        </div>
        <div class="shipped-info-item">
          <span class="shipped-info-label">حالة الطلب</span>
            <span class="shipped-info-value">${getOrderStatusLabel(order)}</span>
        </div>
      </div>
      ${!FINAL_STATUSES.has(currentStatus) ? `
      <div class="status-update-section">
        <div class="status-group">
          <label class="status-label">حالة الطلب</label>
          <select class="status-select" id="status-${order.id}" onchange="handleStatusChange(${order.id})">
            ${getStatusOptionsHtml(order)}
          </select>
          <textarea class="reason-input" id="reason-${order.id}"
            placeholder="اكتب السبب هنا..."
            style="display:${needsReason ? 'block' : 'none'};resize:vertical;min-height:70px;margin-top:8px;width:100%;padding:8px 10px;border:2px solid #eaf2e4;border-radius:8px;font-size:.87rem;outline:none;font-family:inherit;">${order.failure_reason || ''}</textarea>
          <div style="margin-top:10px;">
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;" id="cs-tags-${order.id}">${getCustomStatusTagsHtml()}</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" id="newStatusInput-${order.id}" placeholder="إضافة حالة جديدة..."
                style="flex:1;padding:7px 10px;border:2px solid #eaf2e4;border-radius:7px;font-size:.83rem;outline:none;background:#fafdf8;color:#2d4a1e;" />
              <button type="button" onclick="addCustomStatus(${order.id})"
                style="background:#596d52;color:#fff;border:none;border-radius:7px;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
        </div>
        <button class="btn-update-status" onclick="updateOrderStatus(${order.id})">
          <i class="bi bi-arrow-repeat"></i> تحديث الحالة
        </button>
      </div>` : ''}
    </div>`;
}

// ===== Status options helper =====
function getStatusOptionsHtml(order) {
    const current = order.status || 'shipped';
    const standard = [
        { value: 'received',        label: 'تم استلام الطلب', disabled: true },
        { value: 'approved',        label: 'تم الموافقة على الطلب', disabled: true },
        { value: 'shipped',         label: 'تم شحن الطلبية', disabled: true },
        { value: 'out-for-delivery',label: 'خرجت للتوصيل', disabled: true },
        { value: 'delivered',       label: 'تم التوصيل بنجاح', disabled: true },
        { value: 'failed-delivery', label: 'تعذر التوصيل لسبب', disabled: true },
        { value: 'cancelled',       label: 'تم الغاء الطلبية' },
    ];
    const customs = getCustomStatuses();
    // If current value isn't in standard list, add a hidden option so it shows correctly
    const allValues = [...standard.map(s => s.value), ...customs.map(c => c.value)];
    let extraOption = '';
    if (!allValues.includes(current)) {
        extraOption = `<option value="${current}" selected>${current}</option>`;
    }
    let html = standard.map(opt => {
        const sel = current === opt.value ? 'selected' : '';
        const dis = opt.disabled ? 'disabled style="color:#aaa;"' : '';
        return `<option value="${opt.value}" ${sel} ${dis}>${opt.label}</option>`;
    }).join('');
    customs.forEach(cs => {
        const sel = current === cs.value ? 'selected' : '';
        html += `<option value="${cs.value}" ${sel}>${cs.label}</option>`;
    });
    return extraOption + html;
}

// ===== Custom Status helpers =====
function getCustomStatuses() {
    try { return JSON.parse(localStorage.getItem('customOrderStatuses') || '[]'); }
    catch { return []; }
}

function getCustomStatusTagsHtml() {
    const statuses = getCustomStatuses();
    if (!statuses.length) return '';
    return statuses.map(cs =>
        `<span class="custom-status-tag">${cs.label}<button type="button" onclick="confirmDeleteCustomStatus('${cs.value}')" class="btn-del-cs" title="حذف"><i class="bi bi-x-lg"></i></button></span>`
    ).join('');
}

function addCustomStatus(orderId) {
    const input = document.getElementById(`newStatusInput-${orderId}`);
    const label = input?.value.trim();
    if (!label) { showToast('الرجاء إدخال اسم الحالة', 'error'); return; }
    const customs = getCustomStatuses();
    const value = 'custom_' + Date.now();
    customs.push({ value, label });
    localStorage.setItem('customOrderStatuses', JSON.stringify(customs));
    input.value = '';
    filterShippedOrders();
    showToast('✅ تم إضافة الحالة الجديدة');
}

let _customStatusToDelete = null;
function confirmDeleteCustomStatus(value) {
    _customStatusToDelete = value;
    const modal = document.getElementById('customStatusDeleteModal');
    if (modal) modal.style.display = 'flex';
}
function cancelDeleteCustomStatus() {
    _customStatusToDelete = null;
    const modal = document.getElementById('customStatusDeleteModal');
    if (modal) modal.style.display = 'none';
}
function doDeleteCustomStatus() {
    if (!_customStatusToDelete) return;
    const updated = getCustomStatuses().filter(cs => cs.value !== _customStatusToDelete);
    localStorage.setItem('customOrderStatuses', JSON.stringify(updated));
    _customStatusToDelete = null;
    const modal = document.getElementById('customStatusDeleteModal');
    if (modal) modal.style.display = 'none';
    filterShippedOrders();
    showToast('🗑️ تم حذف الحالة');
}

// ===== Approval Confirmation Modal =====
function openApprovalConfirmModal(orderId) {
    currentOrderId = orderId;
    document.getElementById("approvalConfirmModal").classList.add("active");
}

function closeApprovalConfirmModal() {
    document.getElementById("approvalConfirmModal").classList.remove("active");
    currentOrderId = null;
}

async function confirmApproval() {
    if (!currentOrderId) return;
    const btn = document.getElementById("confirmApprovalBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    btn.classList.add("loading");
    if (btnText) btnText.style.display = "none";
    if (btnLoader) btnLoader.style.display = "inline-block";

    try {
        const response = await fetch(`/api/orders/${currentOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
        });
        if (!response.ok) throw new Error("فشل تحديث الطلب");
        await loadOrders();
        closeApprovalConfirmModal();
        showToast("تم الموافقة على الطلب بنجاح");
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء الموافقة على الطلب", "error");
    } finally {
        btn.classList.remove("loading");
        if (btnText) btnText.style.display = "inline";
        if (btnLoader) btnLoader.style.display = "none";
    }
}

// ===== Approve Order =====
async function approveOrder(orderId) {
    currentOrderId = orderId;
    const order = orders.find(o => o.id === orderId);
    const orderGovernorate = order?.governorate || '';

    const list = document.getElementById("shippingOptionsList");
    list.innerHTML = '<p class="no-companies-msg"><i class="bi bi-arrow-repeat rotating"></i> جاري تحميل الشركات...</p>';
    document.getElementById("shippingModal").classList.add("active");

    if (shippingCompanies.length === 0) {
        list.innerHTML = '<p class="no-companies-msg">لا توجد شركات شحن مسجلة. يرجى تسجيل شركة أولاً من صفحة شركات الشحن.</p>';
        return;
    }

    // Load each fixed company's gov prices once
    await loadGovPricesForCompanies(orderGovernorate);

    list.innerHTML = '';
    shippingCompanies.forEach((company, idx) => {
        let priceNote = '';
        if (company.shipping_type === 'manual') {
            const price = company.fixed_price;
            priceNote = price
                ? `<em style="color:#3a7d44;font-weight:500;">(سعر الشحن: ${price} جنيه)</em>`
                : '<em style="color:#8a6d3b;font-weight:400;">(يتم التحديد بشكل يدوي)</em>';
        } else {
            const price = companyGovPricesCache[company.id]?.[orderGovernorate];
            priceNote = price !== undefined
                ? `<em style="color:#596d52;font-weight:500;">(سعر الشحن: ${price} جنيه)</em>`
                : '<em style="color:#aaa;font-weight:400;">(غير محدد لهذه المحافظة)</em>';
        }
        const label = document.createElement("label");
        label.className = "shipping-option";
        label.innerHTML = `
            <input type="radio" name="shippingCompanyId" value="${company.id}" ${idx === 0 ? "checked" : ""} />
            <span class="option-label">
                ${company.logo ? `<img src="${company.logo}" class="option-logo" alt="${company.name}" />` : '<i class="bi bi-building"></i>'}
                ${company.name}
                ${priceNote}
            </span>
        `;
        list.appendChild(label);
    });
}

// ===== Reject Order =====
function rejectOrder(orderId) {
    currentOrderId = orderId;
    document.getElementById("rejectionModal").classList.add("active");
}


// ===== Close Shipping Modal =====
function closeShippingModal() {
    document.getElementById("shippingModal").classList.remove("active");
    currentOrderId = null;
}

// ===== Close Rejection Modal =====
function closeRejectionModal() {
    document.getElementById("rejectionModal").classList.remove("active");
    document.getElementById("rejectionReason").value = "";
    currentOrderId = null;
}

// ===== Submit Shipping =====
async function submitShipping() {
    const btn = document.getElementById("submitShippingBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");

    const selected = document.querySelector('input[name="shippingCompanyId"]:checked');
    if (!selected) {
        showToast("الرجاء اختيار شركة شحن", "error");
        return;
    }

    const companyId = selected.value;

    btn.classList.add("loading");
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    try {
        const response = await fetch(`/api/orders/${currentOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: "shipped",
                shipping_company_id: parseInt(companyId),
            }),
        });

        if (!response.ok) throw new Error("فشل تحديث الطلب");

        await loadOrders();
        closeShippingModal();
        showToast("تم إرسال الطلب إلى شركة الشحن بنجاح");
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحديث الطلب", "error");
    } finally {
        btn.classList.remove("loading");
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
    }
}
// ===== Submit Rejection =====
async function submitRejection() {
    const reason = document.getElementById("rejectionReason").value.trim();

    if (!reason) {
        showToast("الرجاء إدخال سبب الرفض", "error");
        return;
    }

    const btn = document.getElementById("submitRejectionBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");

    btn.classList.add("loading");
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    try {
        const response = await fetch(`/api/orders/${currentOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: "rejected",
                rejection_reason: reason,
            }),
        });

        if (!response.ok) throw new Error("فشل تحديث الطلب");

        await loadOrders();
        closeRejectionModal();
        showToast("تمت العملية بنجاح");
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحديث الطلب", "error");
    } finally {
        btn.classList.remove("loading");
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
    }
}

// ===== Handle Status Change =====
function handleStatusChange(orderId) {
    const select      = document.getElementById(`status-${orderId}`);
    const reasonInput = document.getElementById(`reason-${orderId}`);
    if (!select || !reasonInput) return;

    const needsReason = ['failed-delivery', 'cancelled'].includes(select.value);
    reasonInput.style.display = needsReason ? 'block' : 'none';
    if (!needsReason) reasonInput.value = '';
}

// ===== Update Order Status =====
async function updateOrderStatus(orderId) {
    const select      = document.getElementById(`status-${orderId}`);
    const reasonInput = document.getElementById(`reason-${orderId}`);
    const newStatus   = select.value;
    const needsReason = ['failed-delivery', 'cancelled'].includes(newStatus);

    if (needsReason && !reasonInput.value.trim()) {
        showToast('الرجاء إدخال السبب لهذه الحالة', 'error');
        reasonInput.focus();
        return;
    }

    try {
        const body = { status: newStatus };
        if (needsReason) body.failure_reason = reasonInput.value.trim();

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('فشل تحديث الحالة');
        showToast('تم تحديث الحالة بنجاح');
        await loadOrders();
    } catch (error) {
        console.error(error);
        showToast('حدث خطأ أثناء تحديث الحالة', 'error');
    }
}

// ===== Show Toast =====
function showToast(message, type) {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove("show");
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }));
}

// ===== Close modals on overlay click =====
document
    .getElementById("shippingModal")
    .addEventListener("click", function (e) {
        if (e.target === this) closeShippingModal();
    });

document
    .getElementById("rejectionModal")
    .addEventListener("click", function (e) {
        if (e.target === this) closeRejectionModal();
    });

document
    .getElementById("approvalConfirmModal")
    .addEventListener("click", function (e) {
        if (e.target === this) closeApprovalConfirmModal();
    });

document.getElementById("receiptLightbox")?.addEventListener("click", function (e) {
    if (e.target === this) closeReceiptLightbox();
});

// ===== Reset Order to Pending =====
let _resetOrderId = null;

function openResetOrderModal(orderId) {
    _resetOrderId = orderId;
    document.getElementById('resetOrderModal').classList.add('active');
}

function closeResetOrderModal() {
    document.getElementById('resetOrderModal').classList.remove('active');
    _resetOrderId = null;
}

async function confirmResetOrder() {
    if (!_resetOrderId) return;
    const btn = document.getElementById('confirmResetOrderBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    btn.classList.add('loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';

    try {
        const res = await fetch(`/api/orders/${_resetOrderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'pending',
                shipping_company_id: null,
                shipping_company: null,
                rejection_reason: null,
                failure_reason: null,
            }),
        });
        if (!res.ok) throw new Error('فشل إعادة تعيين الطلب');
        await loadOrders();
        closeResetOrderModal();
        showToast('✅ تم إعادة تعيين الطلب بنجاح');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء إعادة التعيين', 'error');
    } finally {
        btn.classList.remove('loading');
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

document.getElementById('resetOrderModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeResetOrderModal();
});

// ===== Shipping Cost Editing =====
function editShippingCost(orderId) {
    const paragraph = document.getElementById(`shipping-cost-${orderId}`);
    const input = document.getElementById(`shipping-input-${orderId}`);

    if (paragraph && input) {
        paragraph.style.display = 'none';
        input.style.display = 'inline-block';
        input.focus();
        input.select();
    }
}

async function saveShippingCost(orderId) {
    const paragraph = document.getElementById(`shipping-cost-${orderId}`);
    const input = document.getElementById(`shipping-input-${orderId}`);

    if (!paragraph || !input) return;

    const newCost = parseFloat(input.value) || 0;

    try {
        const response = await fetch(`/api/orders/${orderId}/update-shipping-cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ express_price: newCost })
        });

        if (!response.ok) throw new Error('فشل في تحديث قيمة الشحن');

        // Update UI
        paragraph.textContent = `${newCost.toFixed(0)} جنيه`;
        paragraph.style.display = 'inline';
        input.style.display = 'none';

        // Update order data if available
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].express_price = newCost;
        }

        showToast('✅ تم تحديث قيمة الشحن بنجاح');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تحديث قيمة الشحن', 'error');
        input.value = paragraph.textContent.replace(' جنيه', '');
        paragraph.style.display = 'inline';
        input.style.display = 'none';
    }
}

// ===== Refund Modal =====
function openRefundModal(orderId) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('refundModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'refundModal';
        modal.innerHTML = `
            <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;">
                <div class="modal-content" style="background:#fff;border-radius:12px;padding:25px;width:90%;max-width:500px;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #eee;padding-bottom:15px;">
                        <h3 style="margin:0;color:#28a745;font-size:1.1rem;font-weight:700;">
                            <i class="bi bi-upload"></i> رفع إيصال التحويل
                        </h3>
                        <button onclick="closeRefundModal()" style="background:none;border:none;font-size:1.5rem;color:#666;cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom:20px;">
                            <label style="display:block;margin-bottom:8px;font-weight:600;color:#333;">صورة إيصال التحويل:</label>
                            <input type="file" id="refundReceiptInput" accept="image/*" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;font-size:.9rem;">
                        </div>
                        <div id="refundPreview" style="display:none;margin-bottom:20px;">
                            <img id="refundPreviewImg" style="max-width:100%;height:auto;border-radius:8px;border:2px solid #28a745;">
                        </div>
                    </div>
                    <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;border-top:2px solid #eee;padding-top:15px;margin-top:20px;">
                        <button onclick="closeRefundModal()" style="background:#6c757d;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:.9rem;">إلغاء</button>
                        <button id="saveRefundBtn" onclick="saveRefund()" style="background:#28a745;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:.9rem;font-weight:600;">
                            <i class="bi bi-check-circle"></i> حفظ الإيصال
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add file preview functionality
        document.getElementById('refundReceiptInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('refundPreview');
            const img = document.getElementById('refundPreviewImg');

            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    img.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        });
    }

    // Store current order ID
    modal.dataset.orderId = orderId;
    modal.style.display = 'block';
}

function closeRefundModal() {
    const modal = document.getElementById('refundModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('refundReceiptInput').value = '';
        document.getElementById('refundPreview').style.display = 'none';
    }
}

async function saveRefund() {
    const modal = document.getElementById('refundModal');
    const orderId = modal.dataset.orderId;
    const fileInput = document.getElementById('refundReceiptInput');
    const saveBtn = document.getElementById('saveRefundBtn');

    if (!fileInput.files[0]) {
        showToast('الرجاء اختيار صورة الإيصال', 'error');
        return;
    }

    saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> جاري الحفظ...';
    saveBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('refund_receipt', fileInput.files[0]);
        formData.append('refund', 'delivered');

        const response = await fetch(`/api/orders/${orderId}/refund`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('فشل في حفظ بيانات الاسترداد');

        const result = await response.json();

        // Update order data
        const orderIndex = orders.findIndex(o => o.id == orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].refund = 'delivered';
            orders[orderIndex].refund_receipt = result.refund_receipt;
        }

        // Refresh the orders display
        await loadOrders();

        closeRefundModal();
        showToast('✅ تم حفظ إيصال التحويل بنجاح');

    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء حفظ الإيصال', 'error');
    } finally {
        saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> حفظ الإيصال';
        saveBtn.disabled = false;
    }
}

function viewRefundReceipt(receiptPath) {
    // Create modal to view the receipt
    let viewModal = document.getElementById('viewRefundModal');
    if (!viewModal) {
        viewModal = document.createElement('div');
        viewModal.id = 'viewRefundModal';
        viewModal.innerHTML = `
            <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1001;display:flex;align-items:center;justify-content:center;">
                <div class="modal-content" style="background:#fff;border-radius:12px;padding:20px;width:90%;max-width:600px;max-height:80vh;overflow:auto;">
                    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <h3 style="margin:0;color:#28a745;font-size:1.1rem;font-weight:700;">
                            <i class="bi bi-image"></i> إيصال التحويل
                        </h3>
                        <button onclick="closeViewRefundModal()" style="background:none;border:none;font-size:1.5rem;color:#666;cursor:pointer;">×</button>
                    </div>
                    <div class="modal-body">
                        <img id="viewRefundImg" style="width:100%;height:auto;border-radius:8px;border:2px solid #28a745;">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(viewModal);
    }

    document.getElementById('viewRefundImg').src = receiptPath;
    viewModal.style.display = 'block';
}

function closeViewRefundModal() {
    const modal = document.getElementById('viewRefundModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
