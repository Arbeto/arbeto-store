@include('dashboard.include.head')
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/arexpress.css') }}">
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/orders-controls.css') }}">
<style>
    .btn-back { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; background: #596d52; color: #fff; border: none; border-radius: 9px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: background .2s; margin-bottom: 18px; }
    .btn-back:hover { background: #3a5c28; color: #fff; }
    .co-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .co-logo-wrap { width: 72px; height: 60px; background: #f5fbf0; border-radius: 10px; border: 2px solid #eaf2e4; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .co-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
    .co-logo-wrap .bi-building { font-size: 1.8rem; color: #596d52; }
    .co-title-group { flex: 1; }
    .co-title-group h1 { font-size: 1.5rem; font-weight: 700; color: #2d4a1e; margin: 0 0 5px; }
    .co-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 14px; border-radius: 14px; font-size: 0.85rem; font-weight: 600; }
    .co-badge.fixed { background: #dff0d8; color: #3a5c28; }
    .co-badge.manual { background: #fff3cd; color: #8a6d3b; }
    .co-price-tag { font-size: 0.9rem; color: #596d52; font-weight: 500; margin-top: 4px; }
    .co-page-top { padding: 24px 22px 0; direction: rtl; width: 80%; margin-left: 2%; }
    .small-modal { max-width: 400px; }
</style>
</head>

<body>
    @include('dashboard.include.sidebar')

    <div class="dashboard-container">

        {{-- Back + Company Header --}}
        <div class="co-page-top">
            <a href="{{ route('dashboard.shipping-companies') }}" class="btn-back">
                <span class="bi bi-arrow-right"></span>
                العودة لشركات الشحن
            </a>
            <div class="co-header">
                <div class="co-logo-wrap">
                    @if($company->logo)
                        <img src="{{ asset($company->logo) }}" alt="{{ $company->name }}" />
                    @else
                        <span class="bi bi-building"></span>
                    @endif
                </div>
                <div class="co-title-group">
                    <h1>{{ $company->name }}</h1>
                    <span class="co-badge {{ $company->shipping_type === 'fixed' ? 'fixed' : 'manual' }}">
                        <span class="bi bi-{{ $company->shipping_type === 'fixed' ? 'lock-fill' : 'pencil-fill' }}"></span>
                        {{ $company->shipping_type === 'fixed' ? 'أوتوماتيكي' : 'يدوي' }}
                    </span>
                    @if($company->shipping_type === 'fixed' && $company->fixed_price)
                        <p class="co-price-tag">
                            <span class="bi bi-tag-fill"></span>
                            سعر الشحن الثابت: {{ number_format($company->fixed_price, 2) }} جنيه
                        </p>
                    @endif
                </div>
            </div>
        </div>

        {{-- Statistics --}}
        <div class="statistics-section">
            <div class="stat-card profit">
                <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
                <div class="stat-content">
                    <div class="stat-label">صافي ربح الشركة من التوصيل</div>
                    <div class="stat-value" id="netProfit">0 جنيه</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-currency-dollar"></i></div>
                <div class="stat-content">
                    <div class="stat-label">إجمالي المبالغ المدفوعة للشحن</div>
                    <div class="stat-value" id="totalShipping">0 جنيه</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-cash-coin"></i></div>
                <div class="stat-content">
                    <div class="stat-label">إجمالي شحن الطلبية</div>
                    <div class="stat-value" id="totalPaid">0 جنيه</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
                <div class="stat-content">
                    <div class="stat-label">عدد الطلبات المسلّمة</div>
                    <div class="stat-value" id="totalOrders">0</div>
                </div>
            </div>
        </div>

        {{-- Orders Section --}}
        <div class="orders-section">
            <div class="orders-header">
                <h2 class="section-title">الطلبات المشحونة</h2>
                <div class="orders-controls">
                    <div class="search-box">
                        <i class="bi bi-search"></i>
                        <input type="text" id="searchInput" placeholder="بحث برقم الطلب او الاسم..." oninput="searchOrders(this.value)">
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" onclick="filterOrders('ongoing')">جاري</button>
                        <button class="filter-btn" onclick="filterOrders('delivered')">تم التوصيل</button>
                        <button class="filter-btn" onclick="filterOrders('failed')">لم يتم التوصيل</button>
                    </div>
                </div>
            </div>
            <div id="ordersContainer" class="orders-list">
            </div>
        </div>

    </div>

    {{-- Reset Cost Modal (shown only for manual companies by JS) --}}
    <div class="modal-overlay" id="resetModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>إعادة تعيين مبلغ الشحن</h3>
                <button class="btn-close-modal" onclick="closeResetModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-question">هل أنت متأكد من إعادة إدخال مبالغ الشحن من البداية؟</p>
                <div class="modal-actions">
                    <button class="btn-modal-confirm" onclick="confirmReset()">موافق</button>
                    <button class="btn-modal-cancel" onclick="closeResetModal()">إلغاء</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Delivery Confirmation Modal --}}
    <div class="modal-overlay" id="deliveryModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>تأكيد التوصيل</h3>
                <button class="btn-close-modal" onclick="closeDeliveryModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-question">هل تم توصيل الشحنة بنجاح؟</p>
                <div class="modal-actions">
                    <button class="btn-modal-confirm" id="confirmDeliveryBtn" onclick="confirmDelivery()">
                        <span class="btn-text">موافق</span>
                        <span class="btn-loader" style="display: none;">
                            <i class="bi bi-arrow-repeat rotating"></i>
                        </span>
                    </button>
                    <button class="btn-modal-cancel" onclick="closeDeliveryModal()">إلغاء</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Out For Delivery Confirmation Modal --}}
    <div class="modal-overlay" id="outForDeliveryModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>تأكيد الخروج للتوصيل</h3>
                <button class="btn-close-modal" onclick="closeOutForDeliveryModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <p class="modal-question">هل خرج هذا الطلب للتوصيل؟</p>
                <div class="modal-actions">
                    <button class="btn-modal-confirm" id="confirmOutForDeliveryBtn" onclick="confirmOutForDelivery()">
                        <span class="btn-text">نعم، خرج للتوصيل</span>
                        <span class="btn-loader" style="display: none;">
                            <i class="bi bi-arrow-repeat rotating"></i>
                        </span>
                    </button>
                    <button class="btn-modal-cancel" onclick="closeOutForDeliveryModal()">إلغاء</button>
                </div>
            </div>
        </div>
    </div>

    {{-- Failed Delivery Modal --}}
    <div class="modal-overlay" id="failedDeliveryModal">
        <div class="modal-container small-modal">
            <div class="modal-header">
                <h3>تعذر التوصيل</h3>
                <button class="btn-close-modal" onclick="closeFailedDeliveryModal()">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <textarea id="failedDeliveryReason" class="rejection-textarea" placeholder="اكتب سبب تعذر التوصيل..."></textarea>
                <button class="btn-submit btn-danger" id="submitFailedDeliveryBtn" onclick="submitFailedDelivery()">
                    <span class="btn-text">إرسال</span>
                    <span class="btn-loader" style="display: none;">
                        <i class="bi bi-arrow-repeat rotating"></i>
                    </span>
                </button>
            </div>
        </div>
    </div>

    @include('dashboard.include.toast')

    {{-- Pass company data to JS --}}
    <script>
        window.companyData = {
            id:            {{ $company->id }},
            name:          @json($company->name),
            shipping_type: @json($company->shipping_type),
            fixed_price:   {{ $company->fixed_price ?? 0 }},
            logo:          @json($company->logo ? asset($company->logo) : null),
        };
    </script>
    <script src="{{ asset('arbeto_dashboard/js/company-detail.js') }}"></script>
    @include('dashboard.include.footer')
</body>
