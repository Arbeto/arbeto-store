@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/orders.css')}}">
<style>
    .shipping-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .shipping-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid #d0dbc8; border-radius: 10px; cursor: pointer; transition: border .2s, background .2s; }
    .shipping-option:hover { border-color: #596d52; background: #f5fbf0; }
    .shipping-option input[type=radio] { accent-color: #596d52; width: 18px; height: 18px; }
    .shipping-option .option-label { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #3a5c28; font-size: 0.95rem; flex-wrap: wrap; }
    .shipping-option .option-logo { width: 36px; height: 28px; object-fit: contain; border-radius: 5px; }
    .no-companies-msg { text-align: center; color: #7d9a72; padding: 20px; font-size: 0.95rem; }
    .btn-receipt { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: #e8f0fe; color: #1a73e8; border: 1px solid #c5d8fb; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: background .2s; margin-right: 8px; }
    .btn-receipt:hover { background: #c5d8fb; }
    /* Shipped filter bar */
    .shipped-filter-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(89,109,82,.09); margin-bottom: 16px; direction: rtl; }
    .shipped-filter-bar .sf-search { position: relative; flex: 1; min-width: 200px; }
    .shipped-filter-bar .sf-search input { width: 100%; padding: 8px 36px 8px 12px; border: 2px solid #eaf2e4; border-radius: 9px; font-size: 0.87rem; color: #2d4a1e; outline: none; transition: border .2s; }
    .shipped-filter-bar .sf-search input:focus { border-color: #596d52; }
    .shipped-filter-bar .sf-search .bi-search { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); color: #7d9a72; pointer-events: none; }
    .sf-period-btns { display: flex; gap: 6px; }
    .sf-period-btn { padding: 7px 16px; background: #f5fbf0; border: 2px solid #eaf2e4; border-radius: 8px; font-size: 0.83rem; font-weight: 600; color: #596d52; cursor: pointer; transition: all .2s; }
    .sf-period-btn.active, .sf-period-btn:hover { background: #596d52; color: #fff; border-color: #596d52; }
    .sf-select { padding: 8px 12px; border: 2px solid #eaf2e4; border-radius: 9px; font-size: 0.85rem; font-weight: 600; color: #2d4a1e; background: #fafdf8; outline: none; cursor: pointer; transition: border .2s; min-width: 120px; }
    .sf-select:focus { border-color: #596d52; }
    /* Custom status tags */
    .custom-status-tag { display: inline-flex; align-items: center; gap: 5px; background: #f5fbf0; border: 1px solid #c4d8b4; border-radius: 14px; padding: 3px 10px 3px 8px; font-size: 0.8rem; color: #3a5c28; font-weight: 600; margin: 2px; }
    .btn-del-cs { background: none; border: none; cursor: pointer; color: #c0392b; font-size: 0.78rem; padding: 0; display: inline-flex; align-items: center; line-height: 1; }
    .btn-del-cs:hover { color: #922b21; }
</style>
</head>

<body>
    @include('dashboard.include.sidebar')

    <div class="dashboard-container">
        <div class="page-header">
            <h1><i class="bi bi-clipboard-check"></i> إدارة الطلبات</h1>
            <p>متابعة وإدارة طلبات العملاء</p>
        </div>

        <!-- New Orders Section -->
        <section class="orders-section">
            <h2 class="section-title">الطلبات الجديدة</h2>
            <div id="newOrdersContainer" class="orders-grid">
                <!-- New orders will be loaded here -->
            </div>
            <div id="newOrdersPagination"></div>
        </section>

        <!-- Shipped Orders Section -->
        <section class="orders-section">
            <h2 class="section-title">الطلبات المشحونة</h2>
            <!-- Filter bar -->
            <div class="shipped-filter-bar">
                <div class="sf-search">
                    <i class="bi bi-search"></i>
                    <input type="text" id="shippedSearch" placeholder="بحث برقم الطلب أو الاسم..." oninput="filterShippedOrders()">
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <select id="shippedYearSelect" class="sf-select" onchange="onShippedYearChange()">
                        <option value="all">كل السنوات</option>
                    </select>
                    <select id="shippedMonthSelect" class="sf-select" onchange="filterShippedOrders()">
                        <option value="all">كل الشهور</option>
                    </select>
                </div>
            </div>
            <div id="shippedOrdersContainer" class="shipped-orders-list">
                <!-- Shipped orders will be loaded here -->
            </div>
            <div id="shippedOrdersPagination"></div>
        </section>
    </div>

    <!-- Approval Confirm Modal -->
    <div class="modal-overlay" id="approvalConfirmModal">
        <div class="modal-container small-modal" style="overflow:hidden;">
            <div style="background:linear-gradient(135deg,#2d6a4f 0%,#40916c 100%);padding:28px 28px 22px;text-align:center;position:relative;">
                <button onclick="closeApprovalConfirmModal()" style="position:absolute;top:14px;left:14px;background:rgba(255,255,255,.18);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;">
                    <span class="bi bi-x-lg"></span>
                </button>
                <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                    <i class="bi bi-patch-check-fill" style="font-size:2rem;color:#fff;"></i>
                </div>
                <h3 style="margin:0;font-size:1.2rem;color:#fff;font-weight:800;">تأكيد قبول الطلبية</h3>
                <p style="margin:8px 0 0;font-size:.88rem;color:rgba(255,255,255,.82);">يرجى التأكد قبل المتابعة</p>
            </div>
            <div class="modal-body" style="padding:24px 28px 28px;text-align:center;">
                <p style="color:#2d4a1e;font-size:1rem;font-weight:600;margin:0 0 22px;">هل توافق على قبول الطلبية؟</p>
                <div style="display:flex;gap:12px;">
                    <button class="btn-modal-confirm" id="confirmApprovalBtn" onclick="confirmApproval()" style="flex:1;background:linear-gradient(135deg,#2d6a4f,#40916c);color:#fff;border:none;border-radius:10px;padding:13px;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:opacity .2s;" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                        <i class="bi bi-check-lg"></i>
                        <span class="btn-text">نعم، موافق</span>
                        <span class="btn-loader" style="display:none;"><i class="bi bi-arrow-repeat rotating"></i></span>
                    </button>
                    <button onclick="closeApprovalConfirmModal()" style="flex:1;background:#f0f4f0;color:#596d52;border:2px solid #d8e8d0;border-radius:10px;padding:13px;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .2s;" onmouseover="this.style.background='#e4ede4'" onmouseout="this.style.background='#f0f4f0'">إلغاء</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Shipping Company Modal (dynamic) -->
    <div class="modal-overlay" id="shippingModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>اختر شركة الشحن</h3>
                <button class="btn-close-modal" onclick="closeShippingModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <div class="shipping-options" id="shippingOptionsList">
                    <p class="no-companies-msg"><i class="bi bi-arrow-repeat rotating"></i> جاري تحميل الشركات...</p>
                </div>
                <button class="btn-submit" id="submitShippingBtn" onclick="submitShipping()">
                    <span class="btn-text">إرسال للشحن</span>
                    <span class="btn-loader" style="display: none;">
                        <i class="bi bi-arrow-repeat rotating"></i>
                    </span>
                </button>
            </div>
        </div>
    </div>

    <!-- Rejection Modal -->
    <div class="modal-overlay" id="rejectionModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>اكتب سبب الرفض</h3>
                <button class="btn-close-modal" onclick="closeRejectionModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <textarea id="rejectionReason" class="rejection-textarea" placeholder="أدخل سبب رفض الطلب..."></textarea>
                <button class="btn-submit btn-danger" id="submitRejectionBtn" onclick="submitRejection()">
                    <span class="btn-text">إرسال</span>
                    <span class="btn-loader" style="display: none;">
                        <i class="bi bi-arrow-repeat rotating"></i>
                    </span>
                </button>
            </div>
        </div>
    </div>

    @include('dashboard.include.toast')

    <!-- Custom Status Delete Modal -->
    <div id="customStatusDeleteModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:16px;padding:30px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 12px 50px rgba(0,0,0,.25);direction:rtl;">
            <div style="font-size:2.2rem;color:#c0392b;margin-bottom:12px;"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <h3 style="margin:0 0 8px;font-size:1rem;color:#2d4a1e;font-weight:700;">حذف الحالة المخصصة</h3>
            <p style="color:#596d52;font-size:.88rem;margin:0 0 22px;">هل أنت متأكد من حذف هذه الحالة؟ ستُزال من جميع الطلبات.</p>
            <div style="display:flex;gap:10px;">
                <button onclick="cancelDeleteCustomStatus()" style="flex:1;padding:10px;background:#f5f5f5;border:none;border-radius:9px;cursor:pointer;font-weight:600;font-size:.9rem;">إلغاء</button>
                <button onclick="doDeleteCustomStatus()" style="flex:1;padding:10px;background:#c0392b;color:#fff;border:none;border-radius:9px;cursor:pointer;font-weight:600;font-size:.9rem;">حذف</button>
            </div>
        </div>
    </div>

    <!-- Reset Order Modal -->
    <div class="modal-overlay" id="resetOrderModal">
        <div class="modal-container small-modal" style="overflow:hidden;">
            <div style="background:linear-gradient(135deg,#f39c12 0%,#e67e22 100%);padding:28px 28px 22px;text-align:center;position:relative;">
                <button onclick="closeResetOrderModal()" style="position:absolute;top:12px;left:14px;background:rgba(255,255,255,.2);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;">
                    <i class="bi bi-x-lg"></i>
                </button>
                <div style="width:64px;height:64px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                    <i class="bi bi-arrow-counterclockwise" style="font-size:1.8rem;color:#fff;"></i>
                </div>
                <h3 style="color:#fff;margin:0;font-size:1.1rem;font-weight:700;">إعادة تعيين الطلب</h3>
            </div>
            <div class="modal-body" style="padding:24px 28px 28px;text-align:center;">
                <p style="color:#596d52;font-size:.92rem;margin:0 0 22px;line-height:1.6;">سيتم إعادة الطلب إلى حالة <strong>طلب جديد</strong> وإزالته من شركة الشحن.<br>هل أنت متأكد؟</p>
                <div style="display:flex;gap:12px;">
                    <button id="confirmResetOrderBtn" onclick="confirmResetOrder()" style="flex:1;padding:12px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span class="btn-text"><i class="bi bi-arrow-counterclockwise"></i> إعادة تعيين</span>
                        <span class="btn-loader" style="display:none;"><i class="bi bi-hourglass-split"></i></span>
                    </button>
                    <button onclick="closeResetOrderModal()" style="flex:1;padding:12px;background:#f0ede3;color:#596d52;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;">إلغاء</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Receipt / Payment Proof Lightbox -->
    <div id="receiptLightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;align-items:center;justify-content:center;">
        <button onclick="closeReceiptLightbox()" style="position:absolute;top:18px;right:18px;background:rgba(255,255,255,.15);backdrop-filter:blur(4px);border:none;width:46px;height:46px;border-radius:50%;cursor:pointer;color:#fff;font-size:1.3rem;display:flex;align-items:center;justify-content:center;transition:background .2s;" onmouseover="this.style.background='rgba(255,255,255,.28)'" onmouseout="this.style.background='rgba(255,255,255,.15)'">
            <span class="bi bi-x-lg"></span>
        </button>
        <img id="receiptLightboxImg" src="" alt="إيصال الدفع" style="max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;box-shadow:0 10px 60px rgba(0,0,0,.5);" />
    </div>

    <!-- Image Gallery Modal -->
    <div id="imageGalleryModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:10000;align-items:center;justify-content:center;flex-direction:column;">
        <button onclick="closeImageGallery()" style="position:absolute;top:18px;right:18px;background:rgba(255,255,255,.15);backdrop-filter:blur(4px);border:none;width:46px;height:46px;border-radius:50%;cursor:pointer;color:#fff;font-size:1.3rem;display:flex;align-items:center;justify-content:center;z-index:1;">
            <span class="bi bi-x-lg"></span>
        </button>
        <button onclick="galleryPrev()" style="position:absolute;right:24px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;width:48px;height:48px;border-radius:50%;cursor:pointer;color:#fff;font-size:1.5rem;display:flex;align-items:center;justify-content:center;">
            <span class="bi bi-chevron-right"></span>
        </button>
        <img id="galleryImg" src="" alt="صورة الاسترجاع" style="max-width:88vw;max-height:80vh;border-radius:12px;object-fit:contain;box-shadow:0 10px 60px rgba(0,0,0,.5);">
        <div id="galleryCounter" style="color:#fff;font-size:1rem;font-weight:600;margin-top:16px;letter-spacing:2px;">1 / 1</div>
        <button onclick="galleryNext()" style="position:absolute;left:24px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;width:48px;height:48px;border-radius:50%;cursor:pointer;color:#fff;font-size:1.5rem;display:flex;align-items:center;justify-content:center;">
            <span class="bi bi-chevron-left"></span>
        </button>
    </div>

    <script src="{{asset('arbeto_dashboard/js/orders.js')}}"></script>
    @include('dashboard.include.footer')