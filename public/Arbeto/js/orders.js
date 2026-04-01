/* =====================================================================
   orders.js – My Orders Page (Dynamic)
   Reads ORDERS_DATA + CSRF_TOKEN injected by blade.
   ===================================================================== */

(function () {
  'use strict';

  /* ── Status config ─────────────────────────────────────────────── */
  const STATUS_CFG = {
    'pending':           { label: 'تم استلام طلبك',        icon: 'bi-bag-check',        color: '#e8a020' },
    'approved':          { label: 'تم قبول طلبك',          icon: 'bi-check-circle',     color: '#2d6a4f' },
    'preparing':         { label: 'جاري تجهيز طلبك',       icon: 'bi-tools',            color: '#e8a020' },
    'shipped':           { label: 'تم شحن طلبيتك',        icon: 'bi-truck',            color: '#4a7cc7' },
    'out-for-delivery':  { label: 'طلبيتك خرجت للتوصيل',          icon: 'bi-truck',            color: '#4a7cc7' },
    'on-the-way':        { label: 'خرجت للتوصيل',          icon: 'bi-truck',            color: '#4a7cc7' },
    'delivered':         { label: 'تم التوصيل بنجاح',      icon: 'bi-bag-check-fill',   color: '#2c9e5a' },
    'failed-delivery':   { label: 'تعذر التوصيل',          icon: 'bi-bag-x',            color: '#dc3545' },
    'cancelled':         { label: 'تم إلغاء الطلبية',      icon: 'bi-bag-x-fill',       color: '#dc3545' },
    'rejected':          { label: 'تم رفض الطلبية',        icon: 'bi-x-circle-fill',    color: '#dc3545' },
  };

  const RETURN_STATUS_CFG = {
    'pending':           { label: 'تم استلام طلب مرتجعك',    icon: 'bi-arrow-return-left', color: '#e8a020' },
    'approved':          { label: 'تم قبول طلب المرتجع',    icon: 'bi-check-circle',      color: '#2d6a4f' },
    'out-for-delivery':  { label: 'خرج المندوب لاستلام المرتجع', icon: 'bi-truck',            color: '#4a7cc7' },
    'return':            { label: 'جاري رجوع المرتجع الى المخزن',  icon: 'bi-arrow-repeat',      color: '#4a7cc7' },
    'delivered':         { label: 'تم اعادة الاموال بنجاح',   icon: 'bi-cash-coin',         color: '#2c9e5a' },
    'failed-delivery':   { label: 'تعذر استلام المرتجع',   icon: 'bi-bag-x',             color: '#dc3545' },
    'cancelled':         { label: 'تم الغاء المرتجع',       icon: 'bi-bag-x-fill',        color: '#dc3545' },
    'rejected':          { label: 'تم رفض المرتجع',         icon: 'bi-x-circle-fill',     color: '#dc3545' },
  };

  /* ── Status groups ─────────────────────────────────────────────── */
  const G1 = new Set(['pending', 'approved', 'preparing']);           // track + summary + support + cancel
  const G2 = new Set(['shipped', 'out-for-delivery', 'on-the-way']); // track + summary + support
  const G3 = new Set(['failed-delivery', 'cancelled', 'rejected']);   // summary + support only

  /* ── State ─────────────────────────────────────────────────────── */
  let activeOrderId   = null;
  let activeProductId = null;
  let currentRating   = 0;
  let uploadedFiles   = [];
  let returnFiles     = [];
  let activeTypeFilter = 'all';  // 'all' | 'purchase' | 'return'
  let activeDateFilter = 'all';  // current date-range filter key
  const localReviews      = {};  // key: `${orderId}_${productId}` → { rating, comment, imageUrls, likes }
  const localReturnedQty  = {};  // key: `${orderId}_${productId}` → qty already submitted for return

  /* ── Helpers ───────────────────────────────────────────────────── */
  function fmtDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function fmtTime(str) {
    if (!str) return '';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }

  function getUnratedProducts(orderId, items) {
    return items.filter(it => {
      const pid = String(it.product_id || it.id || '');
      return !localReviews[`${orderId}_${pid}`];
    });
  }

  function hasReturnableProducts(orderId, items) {
    return items.some(it => {
      const pid = String(it.product_id || it.id || '');
      const maxQty = Number(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
      const returned = localReturnedQty[`${orderId}_${pid}`] || 0;
      return returned < maxQty;
    });
  }

  function showToast(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast-msg ' + (type === 'error' ? 'toast-error' : 'toast-ok');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  /* ── Filter helpers ────────────────────────────────────────────── */
  function parseFilterKey(key) {
    if (key === 'all')  return { type: 'all' };
    if (key === '3m')   return { type: 'months', n: 3 };
    if (key === '6m')   return { type: 'months', n: 6 };
    if (/^y\d{4}$/.test(key)) return { type: 'year', y: parseInt(key.slice(1), 10) };
    if (/^\d{4}$/.test(key)) return { type: 'year', y: parseInt(key, 10) };
    return { type: 'all' };
  }

  function ordersForFilter(key) {
    let list = ORDERS_DATA;
    if (activeTypeFilter === 'purchase') list = list.filter(o => o.order_type !== 'return');
    else if (activeTypeFilter === 'return') list = list.filter(o => o.order_type === 'return');
    if (!key || key === 'all') return list;
    const f = parseFilterKey(key);
    const now = new Date();
    return list.filter(o => {
      const d = new Date(o.created_at);
      if (f.type === 'months') {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - f.n);
        return d >= cutoff;
      }
      if (f.type === 'year') return d.getFullYear() === f.y;
      return true;
    });
  }

  /* ── Card HTML builder ─────────────────────────────────────────── */
  function buildCard(o) {
    const isReturn = o.order_type === 'return';
    const cfgMap   = isReturn ? RETURN_STATUS_CFG : STATUS_CFG;
    const cfg      = cfgMap[o.status] || (isReturn ? RETURN_STATUS_CFG['pending'] : STATUS_CFG['pending']);
    const items    = Array.isArray(o.items) ? o.items : [];

    /* Status label */
    let statusLabel = cfg.label;
    if (!isReturn && o.status === 'cancelled' && o.rejection_reason) {
      statusLabel += ` – ${o.rejection_reason}`;
    }

    /* Action buttons inside dropdown */
    let actionItems = '';

    // Track: shown for G1, G2, and delivered – hidden for G3
    if (!G3.has(o.status)) {
      const trackLabel = isReturn ? 'تتبع المرتجع' : 'تتبع الطلبية';
      actionItems += `<button class="action-item tracking-btn" data-id="${o.id}"><i class="bi bi-geo-alt"></i> ${trackLabel}</button>`;
    }

    // Summary: always shown
    const summaryLabel = isReturn ? 'ملخص المرتجع' : 'ملخص الطلبية';
    actionItems += `<button class="action-item summary-btn" data-id="${o.id}"><i class="bi bi-receipt"></i> ${summaryLabel}</button>`;

    // Support: always shown
    actionItems += `<button class="action-item support-btn"><a href="#contact"><i class="bi bi-headset"></i> التواصل مع الدعم</a></button>`;

    // Cancel: G1 only
    if (G1.has(o.status)) {
      const cancelLabel = isReturn ? 'إلغاء المرتجع' : 'إلغاء الطلبية';
      actionItems += `<button class="action-item cancel-btn" data-id="${o.id}"><i class="bi bi-x-circle"></i> ${cancelLabel}</button>`;
    }

    /* Rate button (delivered, products not all reviewed) – purchase orders only */
    const unratedItems = getUnratedProducts(String(o.id), items);
    const rateBtn = (!isReturn && o.status === 'delivered' && !o.reviewed && unratedItems.length > 0)
      ? `<button class="rate-btn" data-id="${o.id}">تقييم المنتج</button>`
      : '';

    /* Return request button (delivered, within 72 hours, purchase only, no prior return) */
    const within72hr = !isReturn && o.status === 'delivered' &&
      (new Date() - new Date(o.updated_at)) < 72 * 3600 * 1000;
    const returnBtn = (within72hr && !o.has_return)
      ? `<button class="return-btn" data-id="${o.id}"><i class="bi bi-arrow-return-left"></i> طلب استرجاع</button>`
      : '';

    /* Details button for failed/cancelled/rejected statuses */
    const detailsBtn = G3.has(o.status)
      ? `<button class="details-btn" data-id="${o.id}" style="font-size:.8rem;padding:4px 12px;border-radius:14px;border:1.5px solid #dc3545;background:none;color:#dc3545;cursor:pointer;font-weight:600;white-space:nowrap"><i class="bi bi-info-circle"></i> التفاصيل</button>`
      : '';

    /* Items list */
    const itemsHtml = items.map(it => {
      const itemName = it.name || it.product_name || 'منتج';
      const qty = Number(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
      const price = Number(it.price ?? it.unit_price ?? 0) || 0;
      const imageValue = (Array.isArray(it.image) ? it.image[0] : it.image)
        || (Array.isArray(it.img) ? it.img[0] : it.img)
        || '/Arbeto/images/bag-product.jpg';
      const pid = String(it.product_id || it.id || '');
      const review = localReviews[`${o.id}_${pid}`];
      const viewRatingBtn = review
        ? `<button class="view-rating-btn" data-oid="${o.id}" data-pid="${pid}" style="margin:6px 0 2px 16px;background:none;border:1.5px solid #596d52;color:#596d52;border-radius:20px;padding:5px 14px;font-size:.8rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"><i class="bi bi-star-fill" style="color:#f5a800"></i> تقييمك</button>`
        : '';

      // Selected options display
      let selectedOptionsHtml = '';
      if (it.selected_options && Array.isArray(it.selected_options) && it.selected_options.length > 0) {
        const optionsArray = it.selected_options.map(opt =>
          `<span style="font-weight:600;color:#2c4b2c;">${opt.group || ''}:</span> ${opt.optionName || ''}`
        );
        selectedOptionsHtml = `<p class="product-options" style="font-size:0.85rem;color:#616161;margin:4px 0;">${optionsArray.join(' • ')}</p>`;
      }

      return `
      <div style="border-bottom:1px solid #f5f5f5;padding-bottom:6px;margin-bottom:2px">
        <div class="product-info">
          <img src="${imageValue}" alt="${itemName}" class="product-img" onerror="this.src='/Arbeto/images/bag-product.jpg'">
          <div class="product-details">
            <h3 class="product-title">${itemName}</h3>
            ${selectedOptionsHtml}
            <p class="product-meta">الكمية: ${qty}</p>
            <p class="product-price">${price.toFixed(2)} <span>جنية</span></p>
          </div>
        </div>
        ${viewRatingBtn}
      </div>`;
    }).join('');

    return `
    <div class="order-card" id="order-card-${o.id}" data-id="${o.id}" style="${isReturn ? 'border:2px solid #f5c6cb;background:linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : ''}">
      <div class="order-header" style="${isReturn ? 'border-radius:10px 10px 0 0;' : ''}">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="delivery-status" style="color:${cfg.color}">
            ${statusLabel} <i class="bi ${cfg.icon}" style="font-size:21px"></i></span>
          ${isReturn && o.status === 'delivered' && o.refund_receipt ? `
          <button onclick="viewRefundReceiptInOrders('/${o.refund_receipt}')" style="background:#17a2b8;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:.85rem;font-weight:600;display:inline-flex;align-items:center;gap:5px;margin-right:5px;">
            <i class="bi bi-image"></i> عرض إيصال التحويل
          </button>` : ''}
          ${detailsBtn}
        </div>
        <small style="color:#848570;font-size:12px;">(آخر تحديث: ${fmtDate(o.updated_at)})</small>
        <div class="order-actions" style="flex-direction:row">
          ${rateBtn}
          ${returnBtn}
          <div class="more-options">
            <button class="three-dots-btn"><i class="bi bi-three-dots-vertical"></i></button>
            <div class="options-dropdown">
              ${actionItems}
            </div>
          </div>
        </div>
      </div>
      <div class="order-body">
        ${itemsHtml}
      </div>
    </div>`;
  }

  /* ── Render orders ─────────────────────────────────────────────── */
  function renderOrders(filterKey) {
    const container = document.getElementById('ordersContainer');
    const empty     = document.getElementById('emptyOrders');
    if (!container) return;

    const list = ordersForFilter(filterKey);
    if (!list.length) {
      container.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    container.innerHTML = list.map(buildCard).join('');
    bindCardEvents();
  }

  /* ── Dropdown toggle ───────────────────────────────────────────── */
  function bindCardEvents() {
    /* 3-dots dropdown */
    document.querySelectorAll('.three-dots-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const dd = btn.nextElementSibling;
        document.querySelectorAll('.options-dropdown.show').forEach(o => {
          if (o !== dd) o.classList.remove('show');
        });
        dd.classList.toggle('show');
      });
    });

    /* Tracking */
    document.querySelectorAll('.tracking-btn').forEach(btn => {
      btn.addEventListener('click', () => openTracking(btn.dataset.id));
    });

    /* Summary */
    document.querySelectorAll('.summary-btn').forEach(btn => {
      btn.addEventListener('click', () => openSummary(btn.dataset.id));
    });

    /* Cancel */
    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => openCancel(btn.dataset.id));
    });

    /* Rate */
    document.querySelectorAll('.rate-btn').forEach(btn => {
      btn.addEventListener('click', () => openRating(btn.dataset.id));
    });

    /* View rating */
    document.querySelectorAll('.view-rating-btn').forEach(btn => {
      btn.addEventListener('click', () => openViewRating(btn.dataset.oid, btn.dataset.pid));
    });

    /* Return request */
    document.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', () => openReturnModal(btn.dataset.id));
    });

    /* Details (failed/cancelled/rejected) */
    document.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', () => openDetailsModal(btn.dataset.id));
    });
  }

  /* Close dropdowns on outside click */
  window.addEventListener('click', () => {
    document.querySelectorAll('.options-dropdown.show').forEach(d => d.classList.remove('show'));
  });

  /* ── Filter bar ────────────────────────────────────────────────── */
  const paginBtn = document.getElementById('dateFilterBtn');
  const paginDD  = document.getElementById('dateFilterDropdown');

  if (paginBtn && paginDD) {
    paginBtn.addEventListener('click', e => {
      e.stopPropagation();
      paginDD.classList.toggle('show');
    });
    window.addEventListener('click', () => paginDD.classList.remove('show'));

    paginDD.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        paginDD.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDateFilter = btn.dataset.filter || 'all';
        paginBtn.innerHTML = btn.textContent + ' <span class="bi bi-caret-down-fill"></span>';
        renderOrders(activeDateFilter);
      });
    });
  }

  /* ── Type filter ──────────────────────────────────────────────────────────────── */
  const typeFilterBtn = document.getElementById('orderTypeFilterBtn');
  const typeFilterDD  = document.getElementById('orderTypeFilterDropdown');

  if (typeFilterBtn && typeFilterDD) {
    typeFilterBtn.addEventListener('click', e => {
      e.stopPropagation();
      typeFilterDD.classList.toggle('show');
    });
    window.addEventListener('click', () => typeFilterDD.classList.remove('show'));

    typeFilterDD.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        typeFilterDD.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTypeFilter = btn.dataset.type || 'all';
        typeFilterBtn.innerHTML = btn.textContent + ' <span class="bi bi-caret-down-fill"></span>';
        renderOrders(activeDateFilter);
      });
    });
  }

  /* ── TRACKING MODAL ────────────────────────────────────────────── */
  const TRACKING_STEPS = [
    { key: 'pending',          title: 'تم استلام الطلبية' },
    { key: 'approved',         title: 'تم قبول الطلبية' },
    { key: 'preparing',        title: 'جاري تجهيز الطلبية' },
    { key: 'shipped',          title: 'تم شحن الطلبية' },
    { key: 'out-for-delivery', title: 'خرجت للتوصيل' },
    { key: 'delivered',        title: 'تم تسليم الطلبية بنجاح' },
  ];
  const STATUS_ORDER = ['pending', 'approved', 'preparing', 'shipped', 'out-for-delivery', 'delivered'];

  function openTracking(orderId) {
    const order = ORDERS_DATA.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const timeline = document.getElementById('trackingTimeline');
    if (!timeline) return;

    const isReturn = order.order_type === 'return';
    const titleEl  = document.getElementById('trackingModalTitle');
    if (titleEl) titleEl.textContent = isReturn ? 'تتبع المرتجع' : 'تتبع الطلبية';

    if (isReturn) {
      /* ── Return order tracking ── */
      const RETURN_FAILED = new Set(['failed-delivery', 'cancelled', 'rejected']);
      const returnSteps = [
        { key: 'pending',          title: 'تم استلام طلب مرتجعك' },
        { key: 'approved',         title: 'تم قبول طلب المرتجع' },
        { key: 'out-for-delivery', title: 'خرج المندوب لاستلام المرتجع' },
        { key: 'return',           title: 'جاري رجوع المرتجع الى المخزن' },
        { key: 'delivered',        title: 'تم اعادة الاموال بنجاح' },
      ];
      const returnStatusOrder = ['pending', 'approved', 'out-for-delivery', 'return', 'delivered'];

      if (RETURN_FAILED.has(order.status)) {
        const label = RETURN_STATUS_CFG[order.status]?.label || order.status;
        timeline.innerHTML = `
          <div class="timeline-step completed">
            <div class="step-info">
              <span class="step-title">تم استلام طلب مرتجعك</span>
              <span class="step-date">${fmtDate(order.created_at)} ${fmtTime(order.created_at)}</span>
            </div>
            <div class="step-icon"><i class="bi bi-check-circle-fill"></i></div>
          </div>
          <div class="timeline-step" style="--step-color:#dc3545">
            <div class="step-info">
              <span class="step-title" style="color:#dc3545">${label}</span>
              <span class="step-date">${fmtDate(order.updated_at)} ${fmtTime(order.updated_at)}</span>
            </div>
            <div class="step-icon"><i class="bi bi-x-circle-fill" style="color:#dc3545"></i></div>
          </div>`;
      } else {
        const rIdx = returnStatusOrder.indexOf(order.status);
        timeline.innerHTML = returnSteps.map((step, i) => {
          let cls = 'pending';
          if (i < rIdx) cls = 'completed';
          else if (i === rIdx) cls = 'in-progress';
          if (order.status === 'delivered' && step.key === 'delivered') cls = 'completed';

          const dateStr = (i === 0 && order.created_at) ? `${fmtDate(order.created_at)} ${fmtTime(order.created_at)}`
            : (i <= rIdx && order.updated_at) ? `${fmtDate(order.updated_at)} ${fmtTime(order.updated_at)}`
            : '--:--';

          const icon = cls === 'completed' ? 'bi-check-circle-fill'
            : cls === 'in-progress' ? 'bi-clock-history'
            : 'bi-circle';

          return `
            <div class="timeline-step ${cls}">
              <div class="step-info">
                <span class="step-title">${step.title}</span>
                <span class="step-date">${dateStr}</span>
              </div>
              <div class="step-icon"><i class="bi ${icon}"></i></div>
            </div>`;
        }).join('');
      }
    } else {
      /* ── Purchase order tracking ── */
      const statusIdx = STATUS_ORDER.indexOf(order.status);

      if (G3.has(order.status)) {
        const label = STATUS_CFG[order.status]?.label || order.status;
        timeline.innerHTML = `
          <div class="timeline-step completed">
            <div class="step-info">
              <span class="step-title">تم استلام الطلبية</span>
              <span class="step-date">${fmtDate(order.created_at)} ${fmtTime(order.created_at)}</span>
            </div>
            <div class="step-icon"><i class="bi bi-check-circle-fill"></i></div>
          </div>
          <div class="timeline-step" style="--step-color:#dc3545">
            <div class="step-info">
              <span class="step-title" style="color:#dc3545">${label}</span>
              <span class="step-date">${fmtDate(order.updated_at)} ${fmtTime(order.updated_at)}</span>
            </div>
            <div class="step-icon"><i class="bi bi-x-circle-fill" style="color:#dc3545"></i></div>
          </div>`;
      } else {
        timeline.innerHTML = TRACKING_STEPS.map((step, i) => {
          let cls = 'pending';
          if (i < statusIdx) cls = 'completed';
          else if (i === statusIdx) cls = 'in-progress';
          /* When the order is fully delivered, treat the delivered step as completed too */
          if (order.status === 'delivered' && step.key === 'delivered') cls = 'completed';

          const dateStr = (i === 0 && order.created_at) ? `${fmtDate(order.created_at)} ${fmtTime(order.created_at)}`
            : (i <= statusIdx && order.updated_at) ? `${fmtDate(order.updated_at)} ${fmtTime(order.updated_at)}`
            : '--:--';

          const icon = cls === 'completed' ? 'bi-check-circle-fill'
            : cls === 'in-progress' ? 'bi-clock-history'
            : 'bi-circle';

          return `
            <div class="timeline-step ${cls}">
              <div class="step-info">
                <span class="step-title">${step.title}</span>
                <span class="step-date">${dateStr}</span>
              </div>
              <div class="step-icon"><i class="bi ${icon}"></i></div>
            </div>`;
        }).join('');
      }
    }

    document.getElementById('trackingModal').classList.add('active');
  }

  /* ── SUMMARY MODAL ─────────────────────────────────────────────── */
  function openSummary(orderId) {
    const order = ORDERS_DATA.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;

    const isReturn = order.order_type === 'return';
    const titleEl  = document.getElementById('summaryModalTitle');
    if (titleEl) titleEl.textContent = isReturn ? 'ملخص المرتجع' : 'ملخص الطلبية';

    const items = Array.isArray(order.items) ? order.items : [];

    const totalQty = items.reduce((sum, item) => {
      return sum + (Number(item.quantity ?? item.qty ?? item.count ?? 1) || 1);
    }, 0);

    const shipping      = parseFloat(order.express_price || 0);
    const productsTotal = items.reduce((sum, item) => {
      const qty   = Number(item.quantity ?? item.qty ?? item.count ?? 1) || 1;
      const price = Number(item.price ?? item.unit_price ?? 0) || 0;
      return sum + (price * qty);
    }, 0);

    const address = [order.street, order.city, order.governorate].filter(Boolean).join('، ') || '—';

    if (isReturn) {
      /* Return order summary */
      const returnData = typeof order.return_data === 'string'
        ? JSON.parse(order.return_data || '{}')
        : (order.return_data || {});
      const pmKey = (returnData.payment_method || '').toLowerCase();
      let returnPayLabel = '—';
      if (pmKey === 'cash')         returnPayLabel = 'استلام نقدي';
      else if (pmKey === 'instapay') returnPayLabel = 'إنستا باي';
      else if (pmKey === 'wallet')   returnPayLabel = 'محفظة الكاش';

      const refundTotal = productsTotal - shipping;

      tbody.innerHTML = `
        <tr><td class="spec-value">عدد المنتجات</td><td class="space-header">${totalQty} قطعة</td></tr>
        <tr><td class="spec-value">مجموع المنتجات</td><td class="space-header">${productsTotal.toFixed(2)} جنية</td></tr>
        <tr><td class="spec-value">رسوم الشحن</td><td class="space-header">${shipping.toFixed(2)} جنية</td></tr>
        <tr><td class="spec-value">وسيلة رد المبلغ</td><td class="space-header">${returnPayLabel}</td></tr>
        <tr><td class="spec-value">عنوان العميل</td><td class="space-header" style="line-height:1.5">${address}</td></tr>
        <tr><td class="spec-value">رقم الهاتف</td><td class="space-header">${order.phone || '—'}</td></tr>
        <tr class="summary-total-row"><td class="spec-value" style="font-weight:700">إجمالي المبلغ المسترد</td><td class="space-header" style="font-weight:700;color:#dc3545">${refundTotal.toFixed(2)} جنية</td></tr>
        ${order.status === 'delivered' && order.refund_receipt ? `<tr><td class="spec-value">إيصال التحويل</td><td class="space-header"><button onclick="viewRefundReceiptInOrders('/${order.refund_receipt}')" style="background:#17a2b8;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:.85rem;font-weight:600;"><i class="bi bi-image"></i> عرض إيصال التحويل</button></td></tr>` : ''}`;
    } else {
      /* Purchase order summary */
      const grandTotal = productsTotal + shipping;

      let paymentLabel = '—';
      const pm = (order.payment_method || '').toLowerCase();
      if (pm === 'cash' || pm === 'cod')     paymentLabel = 'عند الاستلام';
      else if (pm === 'wallet')              paymentLabel = 'فودافون كاش';
      else if (pm === 'instapay')            paymentLabel = 'إنستا باي';

      const showProof = (pm === 'instapay' || pm === 'wallet') && order.payment_proof;
      const proofRow  = showProof
        ? `<tr>
            <td class="spec-value">إيصال التحويل</td>
            <td class="space-header">
              <img src="${order.payment_proof}" alt="إيصال التحويل"
                   class="proof-thumb" onclick="openProofLightbox('${order.payment_proof}')">
            </td>
          </tr>`
        : '';

      tbody.innerHTML = `
        <tr><td class="spec-value">عدد المنتجات</td><td class="space-header">${totalQty} قطعة</td></tr>
        <tr><td class="spec-value">مجموع المنتجات</td><td class="space-header">${productsTotal.toFixed(2)} جنية</td></tr>
        <tr><td class="spec-value">رسوم الشحن</td><td class="space-header">${shipping.toFixed(2)} جنية</td></tr>
        <tr><td class="spec-value">طريقة الدفع</td><td class="space-header">${paymentLabel}</td></tr>
        ${proofRow}
        <tr><td class="spec-value">عنوان الشحن</td><td class="space-header" style="line-height:1.5">${address}</td></tr>
        <tr><td class="spec-value">رقم الهاتف</td><td class="space-header">${order.phone || '—'}</td></tr>
        <tr class="summary-total-row"><td class="spec-value" style="font-weight:700">الإجمالي</td><td class="space-header" style="font-weight:700;color:#31694e">${grandTotal.toFixed(2)} جنية</td></tr>`;
    }

    document.getElementById('summaryModal').classList.add('active');
  }

  /* ── DETAILS MODAL ─────────────────────────────────────────────── */
  function openDetailsModal(orderId) {
    const order = ORDERS_DATA.find(o => String(o.id) === String(orderId));
    if (!order) return;
    const reason = order.failure_reason || order.rejection_reason || '—';
    const textEl = document.getElementById('detailsModalText');
    if (textEl) textEl.textContent = reason || 'لا توجد تفاصيل متاحة';
    document.getElementById('detailsModal')?.classList.add('active');
  }

  /* ── PROOF LIGHTBOX ────────────────────────────────────────────── */
  window.openProofLightbox = function (src) {
    let lb = document.getElementById('proofLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'proofLightbox';
      lb.className = 'proof-lightbox';
      lb.innerHTML = `
        <div class="proof-lightbox-backdrop"></div>
        <div class="proof-lightbox-content">
          <button class="proof-lightbox-close">&times;</button>
          <img class="proof-lightbox-img" src="" alt="إيصال التحويل">
        </div>`;
      document.body.appendChild(lb);

      lb.querySelector('.proof-lightbox-backdrop').addEventListener('click', closeProofLightbox);
      lb.querySelector('.proof-lightbox-close').addEventListener('click', closeProofLightbox);
    }
    lb.querySelector('.proof-lightbox-img').src = src;
    lb.classList.add('active');
  };

  function closeProofLightbox() {
    const lb = document.getElementById('proofLightbox');
    if (lb) lb.classList.remove('active');
  }

  /* ── CANCEL MODAL ──────────────────────────────────────────────── */
  function openCancel(orderId) {
    activeOrderId = orderId;
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelModal').classList.add('active');
  }

  document.getElementById('confirmCancel')?.addEventListener('click', async () => {
    if (!activeOrderId) return;
    const reason = document.getElementById('cancelReason').value.trim();
    const btn    = document.getElementById('confirmCancel');
    btn.disabled = true;
    btn.textContent = 'جاري الإلغاء...';

    try {
      const res  = await fetch(`/web/orders/${activeOrderId}/cancel`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'فشل الإلغاء');

      const order = ORDERS_DATA.find(o => String(o.id) === String(activeOrderId));
      if (order) {
        order.status = 'cancelled';
        order.rejection_reason = reason || null;
        order.updated_at = data.updated_at || new Date().toISOString();
      }

      const card = document.getElementById(`order-card-${activeOrderId}`);
      if (card) {
        card.outerHTML = buildCard(order);
        bindCardEvents();
      }

      closeModal('cancelModal');
      showToast('تم إلغاء الطلبية بنجاح', 'ok');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'موافق';
    }
  });

  /* ── RATING MODAL ──────────────────────────────────────────────── */
  function openRating(orderId) {
    const order = ORDERS_DATA.find(o => String(o.id) === String(orderId));
    if (!order) return;

    activeOrderId = orderId;
    const items   = Array.isArray(order.items) ? order.items : [];
    const unrated = items.filter(it => {
      const pid = String(it.product_id || it.id || '');
      return !localReviews[`${orderId}_${pid}`];
    });
    if (!unrated.length) return;

    /* Populate product selector */
    const selEl    = document.getElementById('ratingProductSelect');
    const selGroup = document.getElementById('ratingProductSelectGroup');
    if (selEl) {
      selEl.innerHTML = unrated.map(it => {
        const pid  = String(it.product_id || it.id || '');
        const name = it.name || it.product_name || 'منتج';
        return `<option value="${pid}">${name}</option>`;
      }).join('');
      activeProductId = String(unrated[0].product_id || unrated[0].id || '');
      if (selGroup) selGroup.style.display = unrated.length === 1 ? 'none' : '';
    }

    resetRatingForm();
    document.getElementById('ratingModal').classList.add('active');
  }

  function resetRatingForm() {
    currentRating = 0;
    uploadedFiles = [];
    document.getElementById('productComment').value  = '';
    document.getElementById('imageUpload').value     = '';
    document.getElementById('submitRating').disabled = true;
    updateStars(0);
    const prev = document.getElementById('imagePreviewContainer');
    const uploadLabel = prev.querySelector('label');
    prev.innerHTML = '';
    uploadLabel.style.display = '';
    prev.appendChild(uploadLabel);
  }

  const stars = document.querySelectorAll('#ratingModal .star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.value);
      updateStars(currentRating);
      checkRatingReady();
    });
    star.addEventListener('mouseenter', () => updateStars(parseInt(star.dataset.value)));
    star.addEventListener('mouseleave', () => updateStars(currentRating));
  });

  function updateStars(val) {
    stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= val));
  }

  document.getElementById('ratingProductSelect')?.addEventListener('change', function () {
    activeProductId = this.value;
    resetRatingForm();
  });

  document.getElementById('imageUpload')?.addEventListener('change', function () {
    const prev = document.getElementById('imagePreviewContainer');
    const uploadLabel = prev.querySelector('label');

    const remaining = 4 - uploadedFiles.length;
    const newFiles  = Array.from(this.files).slice(0, remaining);
    uploadedFiles   = uploadedFiles.concat(newFiles);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrap = document.createElement('div');
        wrap.className = 'preview-img-wrap';
        wrap.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="صورة">
          <button class="remove-img" data-idx="${uploadedFiles.indexOf(file)}">&times;</button>`;
        prev.insertBefore(wrap, uploadLabel);
      };
      reader.readAsDataURL(file);
    });

    if (uploadedFiles.length >= 4) uploadLabel.style.display = 'none';
    this.value = '';
    checkRatingReady();
  });

  document.getElementById('imagePreviewContainer')?.addEventListener('click', e => {
    if (!e.target.classList.contains('remove-img')) return;
    const idx   = parseInt(e.target.dataset.idx);
    const wrap  = e.target.closest('.preview-img-wrap');
    if (wrap) wrap.remove();
    uploadedFiles.splice(idx, 1);

    document.querySelectorAll('#imagePreviewContainer .remove-img').forEach((btn, i) => {
      btn.dataset.idx = i;
    });

    const uploadLabel = document.querySelector('#imagePreviewContainer label');
    if (uploadLabel) uploadLabel.style.display = '';
    checkRatingReady();
  });

  function checkRatingReady() {
    document.getElementById('submitRating').disabled = (currentRating === 0);
  }

  document.getElementById('submitRating')?.addEventListener('click', async () => {
    const selEl     = document.getElementById('ratingProductSelect');
    const productId = (selEl && selEl.value) ? selEl.value : (activeProductId || '');
    if (!activeOrderId || currentRating === 0) return;

    const btn = document.getElementById('submitRating');
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';

    const comment   = document.getElementById('productComment').value.trim();
    const imageUrls = uploadedFiles.map(f => URL.createObjectURL(f));

    const fd = new FormData();
    fd.append('rating',     currentRating);
    fd.append('review',     comment);
    fd.append('product_id', productId);
    uploadedFiles.forEach((f, i) => fd.append(`images[${i}]`, f));

    try {
      const res  = await fetch(`/web/orders/${activeOrderId}/review`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Accept': 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'فشل الإرسال');

      /* Store review locally for "تقييمك" button */
      localReviews[`${activeOrderId}_${productId}`] = {
        rating: currentRating,
        comment,
        imageUrls,
        likes: data.likes ?? 0,
      };

      showToast('شكراً! تم إرسال تقييمك', 'ok');

      /* Check how many unrated items remain for this order */
      const order   = ORDERS_DATA.find(o => String(o.id) === String(activeOrderId));
      const items   = Array.isArray(order?.items) ? order.items : [];
      const unrated = items.filter(it => {
        const pid = String(it.product_id || it.id || '');
        return !localReviews[`${activeOrderId}_${pid}`];
      });

      if (unrated.length === 0) {
        /* All products rated – mark order reviewed, rebuild card, close modal */
        if (order) order.reviewed = true;
        const card = document.getElementById(`order-card-${activeOrderId}`);
        if (card && order) { card.outerHTML = buildCard(order); bindCardEvents(); }
        closeModal('ratingModal');
      } else {
        /* More products left – update selector, reset form, keep modal open */
        if (selEl) {
          selEl.innerHTML = unrated.map(it => {
            const pid  = String(it.product_id || it.id || '');
            const name = it.name || it.product_name || 'منتج';
            return `<option value="${pid}">${name}</option>`;
          }).join('');
          activeProductId = String(unrated[0].product_id || unrated[0].id || '');
          const selGroup = document.getElementById('ratingProductSelectGroup');
          if (selGroup) selGroup.style.display = unrated.length === 1 ? 'none' : '';
        }
        resetRatingForm();
        /* Rebuild card so already-rated product shows its "تقييمك" btn */
        const card = document.getElementById(`order-card-${activeOrderId}`);
        if (card && order) { card.outerHTML = buildCard(order); bindCardEvents(); }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'إرسال';
    }
  });

  /* ── RETURN REQUEST MODAL ──────────────────────────────────────── */
  function openReturnModal(orderId) {
    const order = ORDERS_DATA.find(o => String(o.id) === String(orderId));
    if (!order) return;

    activeOrderId = orderId;
    returnFiles   = [];

    /* Update shipping note with order's shipping cost */
    const shippingNote = document.getElementById('returnShippingNote');
    if (shippingNote && order) {
      const shippingCost = parseFloat(order.express_price || 0);
      shippingNote.textContent = `ملاحظة: سيتم خصم تكلفة شحن وهي (${shippingCost.toFixed(2)} جنية) الاسترجاع من قيمة المبلغ المسترد`;
    }

    /* Reset form */
    document.querySelectorAll('input[name="returnReason"]').forEach(r => r.checked = false);
    const detail = document.getElementById('returnReasonDetail');
    if (detail) detail.value = '';
    const pmSel = document.getElementById('returnPaymentMethod');
    if (pmSel) pmSel.value = '';
    const accNum = document.getElementById('returnAccountNumber');
    if (accNum) accNum.value = '';

    /* Reset image preview */
    const imgPrev = document.getElementById('returnImagePreview');
    if (imgPrev) {
      const lbl = imgPrev.querySelector('label');
      imgPrev.innerHTML = '';
      if (lbl) { lbl.style.display = ''; imgPrev.appendChild(lbl); }
    }
    const returnUpload = document.getElementById('returnImageUpload');
    if (returnUpload) returnUpload.value = '';

    /* Build product rows – only items with remaining returnable qty */
    const productList = document.getElementById('returnProductList');
    if (productList) {
      const items = Array.isArray(order.items) ? order.items : [];
      const returnableItems = items.filter(it => {
        const pid = String(it.product_id || it.id || '');
        const maxQty = Number(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
        const returned = localReturnedQty[`${orderId}_${pid}`] || 0;
        return returned < maxQty;
      });
      productList.innerHTML = returnableItems.map(it => {
        const pid          = String(it.product_id || it.id || '');
        const name         = it.name || it.product_name || 'منتج';
        const maxQty       = Number(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
        const returned     = localReturnedQty[`${orderId}_${pid}`] || 0;
        const remainingQty = maxQty - returned;
        const autoChecked  = returnableItems.length === 1 ? 'checked' : '';
        const qtyHtml = remainingQty === 1
          ? `<span style="margin-right:auto;font-size:.83rem;color:#596d52;font-weight:500;white-space:nowrap">الكمية: 1</span>`
          : `<select class="return-qty-select" data-pid="${pid}"
               style="margin-right:auto;padding:4px 10px;border:1.5px solid #eaf2e4;border-radius:6px;font-family:inherit;font-size:.83rem;color:#2c4b2c;outline:none;background:#fff;">
               ${Array.from({ length: remainingQty }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
             </select>`;
        return `<label class="return-product-row" style="justify-content:space-between;align-items:center;gap:10px">
          <input type="checkbox" name="returnProducts" value="${pid}" ${autoChecked}>
          <span style="flex:1">${name}</span>
          ${qtyHtml}
        </label>`;
      }).join('') || '<p style="color:#848570;font-size:13px;">لا توجد منتجات</p>';
    }

    document.getElementById('returnModal').classList.add('active');
  }

  /* Return image upload (max 6) */
  document.getElementById('returnImageUpload')?.addEventListener('change', function () {
    const prev = document.getElementById('returnImagePreview');
    const uploadLabel = prev.querySelector('label');
    const remaining = 6 - returnFiles.length;
    const newFiles  = Array.from(this.files).slice(0, remaining);
    returnFiles = returnFiles.concat(newFiles);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrap = document.createElement('div');
        wrap.className = 'preview-img-wrap';
        wrap.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="صورة">
          <button class="remove-img" data-idx="${returnFiles.indexOf(file)}">&times;</button>`;
        prev.insertBefore(wrap, uploadLabel);
      };
      reader.readAsDataURL(file);
    });

    if (returnFiles.length >= 6) uploadLabel.style.display = 'none';
    this.value = '';
  });

  document.getElementById('returnImagePreview')?.addEventListener('click', e => {
    if (!e.target.classList.contains('remove-img')) return;
    const idx  = parseInt(e.target.dataset.idx);
    const wrap = e.target.closest('.preview-img-wrap');
    if (wrap) wrap.remove();
    returnFiles.splice(idx, 1);
    document.querySelectorAll('#returnImagePreview .remove-img').forEach((btn, i) => {
      btn.dataset.idx = i;
    });
    const lbl = document.querySelector('#returnImagePreview label');
    if (lbl) lbl.style.display = '';
  });

  document.getElementById('submitReturn')?.addEventListener('click', async () => {
    if (!activeOrderId) return;

    const selectedProducts = Array.from(document.querySelectorAll('input[name="returnProducts"]:checked')).map(c => c.value);
    if (!selectedProducts.length) { showToast('الرجاء اختيار منتج واحد على الأقل', 'error'); return; }

    const reasonRadio = document.querySelector('input[name="returnReason"]:checked');
    if (!reasonRadio) { showToast('الرجاء اختيار سبب الاسترجاع', 'error'); return; }

    const pm = document.getElementById('returnPaymentMethod')?.value;
    if (!pm) { showToast('الرجاء اختيار طريقة استلام المبلغ', 'error'); return; }

    const btn = document.getElementById('submitReturn');
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';

    /* Capture product+qty pairs before closing modal */
    const returnedData = selectedProducts.map(p => {
      const qtyEl = document.querySelector(`.return-qty-select[data-pid="${p}"]`);
      return { pid: p, qty: qtyEl ? (parseInt(qtyEl.value) || 1) : 1 };
    });

    const fd = new FormData();
    fd.append('order_id',       activeOrderId);
    fd.append('reason_type',    reasonRadio.value);
    fd.append('reason_detail',  document.getElementById('returnReasonDetail')?.value.trim() || '');
    fd.append('payment_method', pm);
    fd.append('account_number', document.getElementById('returnAccountNumber')?.value.trim() || '');
    returnedData.forEach(({ pid, qty }, i) => {
      fd.append(`products[${i}]`, pid);
      fd.append(`quantities[${i}]`, qty);
    });
    returnFiles.forEach((f, i) => fd.append(`images[${i}]`, f));

    try {
      const res  = await fetch('/web/orders/return', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Accept': 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'فشل الإرسال');

      closeModal('returnModal');
      showToast('تم إرسال طلب الاسترجاع بنجاح، سنتواصل معك قريباً', 'ok');

      /* Mark order as having a return so the button hides */
      const order = ORDERS_DATA.find(o => String(o.id) === String(activeOrderId));
      if (order) order.has_return = true;
      const card = document.getElementById(`order-card-${activeOrderId}`);
      if (card && order) { card.outerHTML = buildCard(order); bindCardEvents(); }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'إرسال طلب الاسترجاع';
    }
  });

  /* ── Modal close helpers ───────────────────────────────────────── */
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('active');
    });
  });

  document.getElementById('closeSummaryModal')?.addEventListener('click',  () => closeModal('summaryModal'));
  document.getElementById('closeCancelModal')?.addEventListener('click',   () => closeModal('cancelModal'));
  document.getElementById('closeTrackingModal')?.addEventListener('click', () => closeModal('trackingModal'));
  document.getElementById('closeModal')?.addEventListener('click',         () => closeModal('trackingModal'));
  document.getElementById('closeReturnModal')?.addEventListener('click',   () => closeModal('returnModal'));
  document.getElementById('closeDetailsModal')?.addEventListener('click',  () => closeModal('detailsModal'));

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  /* ── VIEW RATING MODAL ─────────────────────────────────────────── */
  function openViewRating(orderId, productId) {
    const review = localReviews[`${orderId}_${productId}`];
    if (!review) return;

    const starsEl = document.getElementById('viewRatingStars');
    if (starsEl) {
      starsEl.innerHTML = [1, 2, 3, 4, 5].map(v =>
        `<i class="bi bi-star-fill" style="color:${v <= review.rating ? '#f5a800' : '#e0e0e0'};font-size:28px;margin:0 2px"></i>`
      ).join('');
    }

    const imgsEl = document.getElementById('viewRatingImages');
    if (imgsEl) {
      if (review.imageUrls && review.imageUrls.length) {
        imgsEl.style.display = 'flex';
        imgsEl.innerHTML = review.imageUrls.map(src =>
          `<img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #eee">`
        ).join('');
      } else {
        imgsEl.style.display = 'none';
      }
    }

    const commentEl = document.getElementById('viewRatingComment');
    if (commentEl) {
      if (review.comment) {
        commentEl.style.display = '';
        commentEl.innerHTML = `<p style="color:#2c4b2c;font-size:.92rem;line-height:1.6;background:#f8fbf5;padding:12px;border-radius:8px;border:1px solid #eaf2e4">"${review.comment}"</p>`;
      } else {
        commentEl.style.display = 'none';
      }
    }

    const likesEl = document.getElementById('viewRatingLikes');
    if (likesEl) {
      likesEl.innerHTML = `<i class="bi bi-hand-thumbs-up" style="color:#596d52"></i>&nbsp;${review.likes || 0} إعجاب`;
    }

    document.getElementById('viewRatingModal')?.classList.add('active');
  }

  document.getElementById('closeViewRatingModal')?.addEventListener('click', () => closeModal('viewRatingModal'));

  /* ── Init ──────────────────────────────────────────────────────── */
  /* Pre-populate localReviews from server-persisted reviews */
  ORDERS_DATA.forEach(order => {
    (order.reviews || []).forEach(r => {
      const key = `${order.id}_${r.product_id}`;
      localReviews[key] = {
        rating:    r.rating,
        comment:   r.review || '',
        imageUrls: (r.images || []).map(p => p.startsWith('http') ? p : '/' + p),
        likes:     r.likes || 0,
      };
    });
  });

  const firstFilterBtn = document.querySelector('#dateFilterDropdown button.active');
  const initFilter = firstFilterBtn ? firstFilterBtn.dataset.filter : 'all';
  activeDateFilter = initFilter;
  renderOrders(initFilter);

  /* ── View Refund Receipt Modal ────────────────────────────────────── */
  window.viewRefundReceiptInOrders = function(receiptPath) {
    let viewModal = document.getElementById('viewRefundReceiptModal');
    if (!viewModal) {
      viewModal = document.createElement('div');
      viewModal.id = 'viewRefundReceiptModal';
      viewModal.className = 'custom-modal active';
      viewModal.innerHTML = `
        <div class="modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1001;display:flex;align-items:center;justify-content:center;">
          <div class="modal-content" style="background:#fff;border-radius:12px;padding:20px;width:90%;max-width:600px;max-height:80vh;overflow:auto;">
            <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
              <h3 style="margin:0;color:#28a745;font-size:1.1rem;font-weight:700;">
                <i class="bi bi-image"></i> إيصال التحويل
              </h3>
              <button onclick="closeRefundReceiptModal()" style="background:none;border:none;font-size:1.5rem;color:#666;cursor:pointer;">×</button>
            </div>
            <div class="modal-body">
              <img id="viewRefundReceiptImg" style="width:100%;height:auto;border-radius:8px;border:2px solid #28a745;">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(viewModal);
    }
    document.getElementById('viewRefundReceiptImg').src = receiptPath;
    viewModal.classList.add('active');
  };

  window.closeRefundReceiptModal = function() {
    const modal = document.getElementById('viewRefundReceiptModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  };

})();
