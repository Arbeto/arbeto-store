// ===== company-detail.js =====
// Handles both manual (يدوي) and fixed/automatic (أوتوماتيكي) shipping companies.
// Data loaded from API; notes stored as JSON array in company_notes; ratings in localStorage.

const company = window.companyData; // injected by Blade
let allOrders = [];
let companyGovPrices = {};   // { governorate_name: price } for fixed companies
let currentFilter = "ongoing";
let searchQuery = "";
let currentResetOrderId = null;
let currentDeliveryOrderId = null;

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
    loadOrders();
});

// ===== Load Orders from API =====
async function loadOrders() {
    const container = document.getElementById("ordersContainer");
    container.innerHTML = '<p class="empty-message"><i class="bi bi-hourglass-split"></i> جاري تحميل الطلبات...</p>';

    try {
        // For fixed companies, also load company-specific governorate prices
        const promises = [fetch(`/api/shipping-companies/${company.id}/orders`)];
        if (company.shipping_type === "fixed") {
            promises.push(fetch(`/api/shipping-companies/${company.id}/gov-prices`));
        }

        const results = await Promise.all(promises);
        if (!results[0].ok) throw new Error("فشل تحميل الطلبات");
        const data = await results[0].json();

        if (results[1]) {
            if (results[1].ok) {
                const govData = await results[1].json();
                companyGovPrices = {};
                govData.forEach(g => companyGovPrices[g.governorate_name] = parseFloat(g.price || 0));
            }
        }

        allOrders = (data.orders || []).map(order => ({
            ...order,
            driverNotes: (() => {
                try {
                    const parsed = JSON.parse(order.company_notes || "[]");
                    return Array.isArray(parsed) ? parsed : (order.company_notes ? [order.company_notes] : []);
                } catch { return order.company_notes ? [order.company_notes] : []; }
            })(),
            delivered: order.status === "delivered" || order.status === "on-the-way",
            additionalCost: parseFloat(order.manual_shipping_cost || 0),
            customerRating: (() => {
                try { return JSON.parse(localStorage.getItem(`co_rating_${order.id}`) || "null"); } catch { return null; }
            })(),
            ratingNotes: localStorage.getItem(`co_ratingNotes_${order.id}`) || "",
        }));

        updateStatistics();
        displayOrders();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="empty-message">حدث خطأ أثناء تحميل الطلبات</p>';
    }
}

// ===== Persist notes to API =====
async function saveNotesToApi(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    try {
        await fetch(`/api/shipping-companies/${company.id}/orders/${orderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company_notes: JSON.stringify(order.driverNotes) }),
        });
    } catch (err) { console.error("Failed to save notes:", err); }
}

// ===== Persist shipping cost to API =====
async function saveCostToApi(orderId, cost) {
    try {
        await fetch(`/api/shipping-companies/${company.id}/orders/${orderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ manual_shipping_cost: cost }),
        });
    } catch (err) { console.error("Failed to save cost:", err); }
}

// ===== Display Orders =====
function displayOrders() {
    const container = document.getElementById("ordersContainer");

    let filtered;
    if (currentFilter === "delivered") {
        filtered = allOrders.filter(o => o.delivered);
    } else if (currentFilter === "failed") {
        filtered = allOrders.filter(o => o.status === 'failed-delivery' || o.status === 'cancelled');
    } else {
        filtered = allOrders.filter(o => !o.delivered && o.status !== 'failed-delivery' && o.status !== 'cancelled');
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(o => {
            if (o.id.toString().includes(q)) return true;
            const name = o.user ? `${o.user.first_name} ${o.user.last_name}`.toLowerCase() : "";
            return name.includes(q);
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-message">لا توجد طلبات</p>';
        return;
    }
    container.innerHTML = filtered.map(buildOrderCard).join("");
}

// ===== Build Return Order Card =====
function buildReturnOrderCard(order) {
    const isManual = company.shipping_type === "manual";
    const isFailed = order.status === 'failed-delivery' || order.status === 'cancelled';

    const name = order.user ? `${order.user.first_name} ${order.user.last_name}` : "عميل مجهول";
    const address = [order.governorate, order.city, order.street].filter(Boolean).join(" - ") || "غير محدد";
    const phone = (order.user && order.user.phone) ? order.user.phone : "غير متوفر";

    // Return data
    const returnData = typeof order.return_data === 'string' ? JSON.parse(order.return_data || '{}') : (order.return_data || {});

    // Products list from items
    const items = Array.isArray(order.items) ? order.items : [];
    const productsHtml = items.map(it => {
        let optionsHtml = '';
        if (it.selected_options && Array.isArray(it.selected_options) && it.selected_options.length > 0) {
            const optionsArr = it.selected_options.map(opt => {
                const optionName = opt.option || opt.optionName || '';
                const autoTag = opt.auto_selected ? ' (تلقائي)' : '';
                return `${opt.group || ''}: ${optionName}${autoTag}`;
            });
            optionsHtml = `<div style="color:#888;font-size:.8rem;margin-top:2px;">[${optionsArr.join(' | ')}]</div>`;
        }
        return `<div style="padding:6px 0;border-bottom:1px solid #eee;">
            <div style="color:#2c4b2c;font-weight:600;">${it.name || it.product_name || 'منتج'}</div>
            ${optionsHtml}
            <div style="color:#666;font-size:.85rem;margin-top:2px;">الكمية: ${it.quantity || it.qty || 1}</div>
        </div>`;
    }).join('');

    // Editable shipping cost
    const shippingCost = parseFloat(order.express_price || 0);

    const notesLabel = isManual ? "ملاحظات السائق" : "ملاحظات الشركة";
    const notesPlaceholder = isManual ? "اكتب ملاحظة للسائق..." : "اكتب ملاحظة الشركة...";

    const notesList = order.driverNotes.map((note, idx) => `
        <div class="note-item">
            <span class="note-text">${note}</span>
            <button class="btn-delete-note" onclick="deleteDriverNote(${order.id}, ${idx})">
                <i class="bi bi-trash"></i>
            </button>
        </div>`).join("");

    const isOutForDelivery = order.status === 'out-for-delivery';

    const headerOutBtn = (!order.delivered && !isOutForDelivery && !isFailed) ? `
        <button onclick="openOutForDeliveryModal(${order.id})" style="background:#f39c12;color:#fff;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.82rem;font-weight:600;white-space:nowrap;">
            <i class="bi bi-truck"></i> خرج لاستلام المرتجع
        </button>` : '';

    let deliveryBtns = '';
    if (!order.delivered && !isFailed) {
        if (isOutForDelivery) {
            deliveryBtns = `
        <button class="btn-confirm-delivery" onclick="openReturnDeliveryModal(${order.id})" style="background:#28a745;">
            <i class="bi bi-check-circle"></i>
            تم استلام المرتجع
        </button>
        <button onclick="openFailedDeliveryModal(${order.id})" style="margin-top:8px;width:100%;background:#c0392b;color:#fff;border:none;border-radius:10px;padding:12px;cursor:pointer;font-size:.9rem;font-weight:700;">
            <i class="bi bi-x-circle"></i> تعذر استلام المرتجع
        </button>`;
        } else {
            deliveryBtns = `
        <button class="btn-confirm-delivery" onclick="openOutForDeliveryModal(${order.id})" style="background:#f39c12;">
            <i class="bi bi-truck"></i>
            خرج لاستلام المرتجع
        </button>`;
        }
    }

    const failedStatusText = order.status === 'failed-delivery' ? 'تعذر استلام المرتجع' : 'تم الغاء المرتجع';

    return `
    <div class="order-card ${isFailed ? 'failed-order' : (order.delivered ? 'delivered' : '')}" id="card-${order.id}" style="border-color:#e74c3c;border-width:2px;background:linear-gradient(135deg,#fff5f5 0%,#fce4e4 100%);">
        <div class="order-header" style="background:linear-gradient(135deg,#fdf2f2 0%,#fce4e4 100%);">
            <div style="display:flex;align-items:center;gap:10px;">
                <div>
                    <div style="background:#e74c3c;color:#fff;padding:2px 8px;border-radius:12px;font-size:.75rem;font-weight:700;margin-bottom:4px;">مرتجع</div>
                    <div class="order-id">طلب #${order.id}</div>
                    <div class="order-customer">${name}</div>
                </div>
                ${headerOutBtn}
            </div>
            ${isFailed ? `<span style="background:#e74c3c;color:#fff;border-radius:20px;padding:4px 12px;font-size:.8rem;font-weight:700;">${failedStatusText}</span>` : (order.delivered ? "<span class='stauts-txt'>تم استلام المرتجع</span>" : "")}
            <button class="btn-toggle-card" onclick="toggleCard(${order.id})">
                <i class="bi bi-chevron-${(order.delivered || isFailed) ? 'down' : 'up'}" id="toggle-icon-${order.id}"></i>
            </button>
        </div>
        ${isFailed && order.failure_reason ? `<div style="background:#fce4e4;padding:8px 16px 12px;font-size:.82rem;color:#c0392b;border-top:1px solid #f0b0b0;"><i class="bi bi-exclamation-circle"></i> <strong>السبب:</strong> ${order.failure_reason}</div>` : ''}
        <div class="order-content ${(order.delivered || isFailed) ? 'collapsed' : ''}" id="content-${order.id}">
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">العنوان</span>
                    <span class="detail-value">${address}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">رقم الهاتف</span>
                    <span class="detail-value">${phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">قيمة الشحن</span>
                    <span class="detail-value">
                        <span id="shipping-display-${order.id}" onclick="editReturnShipping(${order.id})" style="cursor:pointer;color:#596d52;font-weight:600;border-bottom:1px dashed #596d52;padding:2px 4px;">${shippingCost.toFixed(0)} جنيه</span>
                        <input type="number" id="shipping-edit-${order.id}" value="${shippingCost}" min="0" style="display:none;width:80px;padding:4px;border:2px solid #596d52;border-radius:5px;" />
                        <button id="shipping-save-${order.id}" onclick="saveReturnShipping(${order.id})" style="display:none;background:#28a745;color:#fff;border:none;border-radius:5px;padding:4px 8px;margin-left:5px;cursor:pointer;font-size:.8rem;">حفظ</button>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">وسيلة الدفع</span>
                    <span class="detail-value">استرداد أموال</span>
                </div>
            </div>
            <div style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;">
                <div style="color:#2c4b2c;font-weight:700;margin-bottom:8px;font-size:.9rem;">
                    <i class="bi bi-box-seam"></i> المنتجات المرتجعة
                </div>
                ${productsHtml || '<div style="color:#888;font-size:.85rem;">لا توجد منتجات</div>'}
            </div>
            <div class="notes-section">
                <div class="notes-title">
                    <i class="bi bi-chat-left-dots"></i>
                    ${notesLabel}
                </div>
                <div class="add-note-form">
                    <textarea type="text" class="note-input" id="noteInput-${order.id}" placeholder="${notesPlaceholder}"></textarea>
                    <button class="btn-add-note" onclick="addDriverNote(${order.id})">
                        <i class="bi bi-send"></i>
                        إرسال
                    </button>
                </div>
                <div class="notes-list" id="notesList-${order.id}">
                    ${notesList}
                </div>
            </div>

            ${deliveryBtns}
        </div>
    </div>`;
}

// ===== Build Order Card =====
function buildOrderCard(order) {
    // Check if return order
    const isReturn = order.order_type === 'return';
    if (isReturn) {
        return buildReturnOrderCard(order);
    }

    const isManual = company.shipping_type === "manual";
    const isFailed = order.status === 'failed-delivery' || order.status === 'cancelled';

    const name = order.user ? `${order.user.first_name} ${order.user.last_name}` : "عميل مجهول";
    const address = [order.governorate, order.city, order.street].filter(Boolean).join(" - ") || "غير محدد";
    const phone = (order.user && order.user.phone) ? order.user.phone : "غير متوفر";
    const pm = (order.payment_method || "").toLowerCase();
    const paymentLabel = pm === "cash" || pm === "cod" ? "عند الاستلام"
        : pm === "instapay" ? "إنستاباي"
        : pm === "wallet" ? "محفظة الكاش"
        : (order.payment_method || "—");

    const shippingCostSection = isManual ? `
        <div class="shipping-cost-section">
            <div class="cost-display">
                <span class="cost-label">مبلغ الشحن المدفوع:</span>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span class="cost-value" id="costValue-${order.id}">${order.additionalCost}</span>
                    <span style="font-size:16px;color:#596d52;">جنيه</span>
                    <button class="btn-reset-cost" onclick="openResetModal(${order.id})" title="إعادة تعيين">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                </div>
            </div>
            <div class="add-cost-form">
                <label style="color:#2c4b2c;font-size:14px;font-weight:600;">إضافة مبلغ:</label>
                <input type="number" class="cost-input" id="costInput-${order.id}" placeholder="0" min="0">
                <button class="btn-add-cost" onclick="addShippingCost(${order.id})">+</button>
            </div>
        </div>` : "";

    const notesLabel = isManual ? "ملاحظات السائق" : "ملاحظات الشركة";
    const notesPlaceholder = isManual ? "اكتب ملاحظة للسائق..." : "اكتب ملاحظة الشركة...";

    const notesList = order.driverNotes.map((note, idx) => `
        <div class="note-item">
            <span class="note-text">${note}</span>
            <button class="btn-delete-note" onclick="deleteDriverNote(${order.id}, ${idx})">
                <i class="bi bi-trash"></i>
            </button>
        </div>`).join("");

    const starsList = [5, 4, 3, 2, 1].map(star => `
        <div class="star-wrapper ${(order.customerRating || 0) >= star ? "active" : ""}"
             data-order="${order.id}" data-rating="${star}"
             onmouseover="hoverStars(${order.id}, ${star})"
             onmouseout="resetStars(${order.id})"
             onclick="setRating(${order.id}, ${star})">
            <i class="bi bi-star-fill"></i>
            <span class="star-number">${star}</span>
        </div>`).join("");

    const isOutForDelivery = order.status === 'out-for-delivery';

    const headerOutBtn = (!order.delivered && !isOutForDelivery && !isFailed) ? `
        <button onclick="openOutForDeliveryModal(${order.id})" style="background:#f39c12;color:#fff;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.82rem;font-weight:600;white-space:nowrap;">
            <i class="bi bi-truck"></i> خرج للتوصيل
        </button>` : '';

    let deliveryBtns = '';
    if (!order.delivered && !isFailed) {
        if (isOutForDelivery) {
            deliveryBtns = `
        <button class="btn-confirm-delivery" onclick="openDeliveryModal(${order.id})">
            <i class="bi bi-check-circle"></i>
            تم التوصيل
        </button>
        <button onclick="openFailedDeliveryModal(${order.id})" style="margin-top:8px;width:100%;background:#c0392b;color:#fff;border:none;border-radius:10px;padding:12px;cursor:pointer;font-size:.9rem;font-weight:700;">
            <i class="bi bi-x-circle"></i> تعذر التوصيل
        </button>`;
        } else {
            deliveryBtns = `
        <button class="btn-confirm-delivery" onclick="openOutForDeliveryModal(${order.id})" style="background:#f39c12;">
            <i class="bi bi-truck"></i>
            خرج للتوصيل
        </button>`;
        }
    }

    const failedStatusText = order.status === 'failed-delivery' ? 'تعذر التوصيل' : 'تم الغاء التوصيل';

    return `
    <div class="order-card ${isFailed ? 'failed-order' : (order.delivered ? 'delivered' : '')}" id="card-${order.id}" style="${isFailed ? 'border-color:#e74c3c;border-width:2px;' : ''}">
        <div class="order-header" style="${isFailed ? 'background:linear-gradient(135deg,#fdf2f2 0%,#fce4e4 100%);' : ''}">
            <div style="display:flex;align-items:center;gap:10px;">
                <div>
                    <div class="order-id">طلب #${order.id}</div>
                    <div class="order-customer">${name}</div>
                </div>
                ${headerOutBtn}
            </div>
            ${isFailed ? `<span style="background:#e74c3c;color:#fff;border-radius:20px;padding:4px 12px;font-size:.8rem;font-weight:700;">${failedStatusText}</span>` : (order.delivered ? "<span class='stauts-txt'>تم التوصيل</span>" : "")}
            <button class="btn-toggle-card" onclick="toggleCard(${order.id})">
                <i class="bi bi-chevron-${(order.delivered || isFailed) ? 'down' : 'up'}" id="toggle-icon-${order.id}"></i>
            </button>
        </div>
        ${isFailed && order.failure_reason ? `<div style="background:#fce4e4;padding:8px 16px 12px;font-size:.82rem;color:#c0392b;border-top:1px solid #f0b0b0;"><i class="bi bi-exclamation-circle"></i> <strong>السبب:</strong> ${order.failure_reason}</div>` : ''}
        <div class="order-content ${(order.delivered || isFailed) ? 'collapsed' : ''}" id="content-${order.id}">
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">العنوان</span>
                    <span class="detail-value">${address}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">رقم الهاتف</span>
                    <span class="detail-value">${phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">إجمالي مبلغ الطلبية المستحق</span>
                    <span class="detail-value">${order.total_price} جنيه</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">قيمة شحن الطلبية</span>
                    <span class="detail-value">${order.express_price} جنيه</span>
                </div>
                ${!isManual && order.governorate && companyGovPrices[order.governorate] !== undefined ? `
                <div class="detail-item">
                    <span class="detail-label">قيمة شحن الشركة</span>
                    <span class="detail-value" style="color:#596d52;font-weight:700;">${companyGovPrices[order.governorate]} جنيه</span>
                </div>` : ""}
                <div class="detail-item">
                    <span class="detail-label">وسيلة الدفع</span>
                    <span class="detail-value">${paymentLabel}</span>
                </div>
            </div>
            <div class="notes-section">
                <div class="notes-title">
                    <i class="bi bi-chat-left-dots"></i>
                    ${notesLabel}
                </div>
                <div class="add-note-form">
                    <textarea type="text" class="note-input" id="noteInput-${order.id}" placeholder="${notesPlaceholder}"></textarea>
                    <button class="btn-add-note" onclick="addDriverNote(${order.id})">
                        <i class="bi bi-send"></i>
                        إرسال
                    </button>
                </div>
                <div class="notes-list" id="notesList-${order.id}">
                    ${notesList}
                </div>
            </div>
            ${shippingCostSection}
            
            ${deliveryBtns}
        </div>
    </div>`;
}

// ===== Update Statistics =====
function updateStatistics() {
    const isFixed = company.shipping_type === "fixed";
    const totalOrders = allOrders.length;
    let totalPaid, totalShipping;

    if (isFixed) {
        // totalPaid = إجمالي شحن الطلبية (express_price charged to customer)
        totalPaid = allOrders.reduce((s, o) => s + parseFloat(o.express_price || 0), 0);
        // totalShipping = إجمالي المبالغ المدفوعة للشحن (company's gov price per order)
        totalShipping = allOrders.reduce((s, o) => {
            const govPrice = o.governorate && companyGovPrices[o.governorate] !== undefined
                ? companyGovPrices[o.governorate]
                : parseFloat(o.express_price || 0);
            return s + govPrice;
        }, 0);
    } else {
        totalPaid = allOrders.reduce((s, o) => s + parseFloat(o.express_price || 0), 0);
        totalShipping = allOrders.reduce((s, o) => s + parseFloat(o.manual_shipping_cost || 0), 0);
    }
    const netProfit = totalPaid - totalShipping;

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("totalPaid").textContent = totalPaid.toFixed(2) + " جنيه";
    document.getElementById("totalShipping").textContent = totalShipping.toFixed(2) + " جنيه";

    const profitEl = document.getElementById("netProfit");
    profitEl.textContent = netProfit.toFixed(2) + " جنيه";

    const profitCard = profitEl.closest(".stat-card");
    const profitIcon = profitCard && profitCard.querySelector(".stat-icon i");
    if (netProfit < 0) {
        if (profitCard) { profitCard.classList.remove("profit"); profitCard.classList.add("negative"); }
        if (profitIcon) profitIcon.style.transform = "rotate(180deg)";
    } else {
        if (profitCard) { profitCard.classList.remove("negative"); profitCard.classList.add("profit"); }
        if (profitIcon) profitIcon.style.transform = "rotate(0deg)";
    }
}

// ===== Add Note =====
async function addDriverNote(orderId) {
    const input = document.getElementById(`noteInput-${orderId}`);
    const note = input.value.trim();
    if (!note) { showToast("الرجاء كتابة ملاحظة", "error"); return; }
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
        order.driverNotes.push(note);
        await saveNotesToApi(orderId);
        input.value = "";
        displayOrders();
        showToast("تم إضافة الملاحظة بنجاح");
    }
}

// ===== Delete Note =====
async function deleteDriverNote(orderId, noteIndex) {
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
        order.driverNotes.splice(noteIndex, 1);
        await saveNotesToApi(orderId);
        displayOrders();
        showToast("تم حذف الملاحظة بنجاح");
    }
}

// ===== Add Shipping Cost (manual only) =====
async function addShippingCost(orderId) {
    const input = document.getElementById(`costInput-${orderId}`);
    const amount = parseFloat(input.value) || 0;
    if (amount <= 0) { showToast("الرجاء إدخال مبلغ صحيح", "error"); return; }
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
        order.additionalCost += amount;
        order.manual_shipping_cost = order.additionalCost;
        await saveCostToApi(orderId, order.additionalCost);
        const costEl = document.getElementById(`costValue-${orderId}`);
        if (costEl) costEl.textContent = order.additionalCost;
        input.value = "";
        updateStatistics();
        showToast("تم إضافة المبلغ بنجاح");
    }
}

// ===== Ratings (stored in localStorage) =====
function setRating(orderId, rating) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    order.customerRating = rating;
    localStorage.setItem(`co_rating_${orderId}`, JSON.stringify(rating));
    const cont = document.getElementById(`stars-${orderId}`);
    cont && cont.querySelectorAll(".star-wrapper").forEach(s =>
        s.classList.toggle("active", parseInt(s.dataset.rating) <= rating)
    );
}
function submitRating(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.customerRating) { showToast("الرجاء اختيار تقييم", "error"); return; }
    const ta = document.getElementById(`ratingNotes-${orderId}`);
    order.ratingNotes = ta ? ta.value.trim() : "";
    localStorage.setItem(`co_ratingNotes_${orderId}`, order.ratingNotes);
    showToast("تم إرسال التقييم بنجاح");
}

// ===== Toggle Card =====
function toggleCard(orderId) {
    const content = document.getElementById(`content-${orderId}`);
    const icon = document.getElementById(`toggle-icon-${orderId}`);
    content.classList.toggle("collapsed");
    icon.className = content.classList.contains("collapsed") ? "bi bi-chevron-down" : "bi bi-chevron-up";
}

// ===== Stars hover =====
function hoverStars(orderId, rating) {
    document.querySelectorAll(`#stars-${orderId} .star-wrapper`).forEach(s =>
        s.classList.toggle("hover", parseInt(s.dataset.rating) <= rating)
    );
}
function resetStars(orderId) {
    document.querySelectorAll(`#stars-${orderId} .star-wrapper`).forEach(s => s.classList.remove("hover"));
}

// ===== Delivery Modal =====
function openDeliveryModal(orderId) {
    currentDeliveryOrderId = orderId;
    document.getElementById("deliveryModal").classList.add("active");
}
function closeDeliveryModal() {
    document.getElementById("deliveryModal").classList.remove("active");
    currentDeliveryOrderId = null;
}
async function confirmDelivery() {
    const btn = document.getElementById("confirmDeliveryBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    btn.classList.add("loading");
    if (btnText) btnText.style.display = "none";
    if (btnLoader) btnLoader.style.display = "inline-block";
    try {
        const res = await fetch(`/api/shipping-companies/${company.id}/orders/${currentDeliveryOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "delivered" }),
        });
        if (!res.ok) throw new Error("فشل تأكيد التوصيل");
        const order = allOrders.find(o => o.id === currentDeliveryOrderId);
        if (order) { order.delivered = true; order.status = "delivered"; }
        updateStatistics();
        displayOrders();
        closeDeliveryModal();
        showToast("تم تأكيد التوصيل بنجاح");
    } catch (err) {
        console.error(err);
        showToast("حدث خطأ أثناء تأكيد التوصيل", "error");
    } finally {
        btn.classList.remove("loading");
        if (btnText) btnText.style.display = "inline";
        if (btnLoader) btnLoader.style.display = "none";
    }
}

// ===== Reset Cost Modal (manual only) =====
function openResetModal(orderId) {
    currentResetOrderId = orderId;
    document.getElementById("resetModal").classList.add("active");
}
function closeResetModal() {
    document.getElementById("resetModal").classList.remove("active");
    currentResetOrderId = null;
}
async function confirmReset() {
    const order = allOrders.find(o => o.id === currentResetOrderId);
    if (order) {
        order.additionalCost = 0;
        order.manual_shipping_cost = 0;
        await saveCostToApi(currentResetOrderId, 0);
        const costEl = document.getElementById(`costValue-${currentResetOrderId}`);
        if (costEl) costEl.textContent = 0;
        updateStatistics();
        closeResetModal();
        showToast("تم إعادة تعيين المبلغ بنجاح");
    }
}

// ===== Filter / Search =====
function filterOrders(filter) {
    currentFilter = filter;
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");
    displayOrders();
}
function searchOrders(query) {
    searchQuery = query.trim();
    displayOrders();
}

// ===== Out For Delivery Modal =====
let currentOutForDeliveryOrderId = null;

function openOutForDeliveryModal(orderId) {
    currentOutForDeliveryOrderId = orderId;
    document.getElementById("outForDeliveryModal").classList.add("active");
}

function closeOutForDeliveryModal() {
    document.getElementById("outForDeliveryModal").classList.remove("active");
    currentOutForDeliveryOrderId = null;
}

async function confirmOutForDelivery() {
    const btn = document.getElementById("confirmOutForDeliveryBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    btn.classList.add("loading");
    if (btnText) btnText.style.display = "none";
    if (btnLoader) btnLoader.style.display = "inline-block";
    try {
        const res = await fetch(`/api/shipping-companies/${company.id}/orders/${currentOutForDeliveryOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "out-for-delivery" }),
        });
        if (!res.ok) throw new Error("فشل تحديث الحالة");
        const order = allOrders.find(o => o.id === currentOutForDeliveryOrderId);
        if (order) order.status = "out-for-delivery";
        displayOrders();
        closeOutForDeliveryModal();
        showToast("تم تحديث الحالة إلى خرجت للتوصيل");
    } catch (err) {
        console.error(err);
        showToast("حدث خطأ أثناء تحديث الحالة", "error");
    } finally {
        btn.classList.remove("loading");
        if (btnText) btnText.style.display = "inline";
        if (btnLoader) btnLoader.style.display = "none";
    }
}

// ===== Failed Delivery Modal =====
let currentFailedDeliveryOrderId = null;

function openFailedDeliveryModal(orderId) {
    currentFailedDeliveryOrderId = orderId;
    document.getElementById("failedDeliveryModal").classList.add("active");
}

function closeFailedDeliveryModal() {
    document.getElementById("failedDeliveryModal").classList.remove("active");
    const ta = document.getElementById("failedDeliveryReason");
    if (ta) ta.value = "";
    currentFailedDeliveryOrderId = null;
}

async function submitFailedDelivery() {
    const reason = document.getElementById("failedDeliveryReason").value.trim();
    if (!reason) { showToast("الرجاء إدخال سبب تعذر التوصيل", "error"); return; }

    const btn = document.getElementById("submitFailedDeliveryBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    btn.classList.add("loading");
    if (btnText) btnText.style.display = "none";
    if (btnLoader) btnLoader.style.display = "inline-block";

    try {
        const res = await fetch(`/api/shipping-companies/${company.id}/orders/${currentFailedDeliveryOrderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "failed-delivery", failure_reason: reason }),
        });
        if (!res.ok) throw new Error("فشل تحديث الحالة");
        const order = allOrders.find(o => o.id === currentFailedDeliveryOrderId);
        if (order) { order.status = "failed-delivery"; order.failure_reason = reason; }
        displayOrders();
        closeFailedDeliveryModal();
        showToast("تم تسجيل تعذر التوصيل");
    } catch (err) {
        console.error(err);
        showToast("حدث خطأ أثناء تحديث الحالة", "error");
    } finally {
        btn.classList.remove("loading");
        if (btnText) btnText.style.display = "inline";
        if (btnLoader) btnLoader.style.display = "none";
    }
}

// ===== Return Order Shipping Cost Editing =====
function editReturnShipping(orderId) {
    const display = document.getElementById(`shipping-display-${orderId}`);
    const input = document.getElementById(`shipping-edit-${orderId}`);
    const saveBtn = document.getElementById(`shipping-save-${orderId}`);

    if (display && input && saveBtn) {
        display.style.display = 'none';
        input.style.display = 'inline-block';
        saveBtn.style.display = 'inline-block';
        input.focus();
        input.select();
    }
}

async function saveReturnShipping(orderId) {
    const display = document.getElementById(`shipping-display-${orderId}`);
    const input = document.getElementById(`shipping-edit-${orderId}`);
    const saveBtn = document.getElementById(`shipping-save-${orderId}`);

    if (!display || !input || !saveBtn) return;

    const newCost = parseFloat(input.value) || 0;

    try {
        const response = await fetch(`/api/orders/${orderId}/update-shipping-cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ express_price: newCost })
        });

        if (!response.ok) throw new Error('فشل في تحديث قيمة الشحن');

        // Update UI
        display.textContent = `${newCost.toFixed(0)} جنيه`;
        display.style.display = 'inline';
        input.style.display = 'none';
        saveBtn.style.display = 'none';

        // Update order data
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
            order.express_price = newCost;
        }

        showToast('✅ تم تحديث قيمة الشحن بنجاح');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء تحديث قيمة الشحن', 'error');
        display.style.display = 'inline';
        input.style.display = 'none';
        saveBtn.style.display = 'none';
    }
}

// ===== Return Delivery Modal =====
function openReturnDeliveryModal(orderId) {
    currentDeliveryOrderId = orderId;
    document.getElementById("deliveryModal").classList.add("active");
}

// ===== Show Toast =====
function showToast(message, type) {
    const toast = document.getElementById("toastNotification");
    const msgEl = document.getElementById("toastMessage");
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.classList.remove("show");
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }));
}
