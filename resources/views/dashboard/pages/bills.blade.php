@include('dashboard.include.head')
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/bills.css') }}">
</head>

<body>
  @include('dashboard.include.sidebar')

  <div class="bills-page">

    {{-- ═══ Header ═══ --}}
    <div class="bills-page-header">
      <h2><i class="bi bi-receipt-cutoff"></i> فواتير الشراء</h2>
      <button class="btn-add-bill" id="addBillBtn">
        <i class="bi bi-plus-lg"></i> إضافة فاتورة
      </button>
    </div>

    {{-- ═══ Filter Bar ═══ --}}
    <div class="bills-filter-bar">
      <div class="filter-search">
        <i class="bi bi-search search-icon"></i>
        <input type="text" id="billSearch" placeholder="بحث برقم الفاتورة أو اسم الصنف..." />
      </div>
      <select class="filter-select" id="monthFilter">
        <option value="all">الكل</option>
      </select>
      <select class="filter-select" id="yearFilter">
        <option value="all">الكل</option>
      </select>
    </div>

    {{-- ═══ Bills List ═══ --}}
    <div class="bills-list" id="billsList">
      <div class="bills-loading">
        <i class="bi bi-arrow-repeat spin-icon"></i> جاري التحميل...
      </div>
    </div>

    {{-- ═══ Pagination ═══ --}}
    <div class="bills-pagination" id="billsPagination"></div>

  </div>


  {{-- ═══════════════════════════════════════
         MODAL — إضافة فاتورة جديدة
    ═══════════════════════════════════════ --}}
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal-box">

      <div class="modal-header">
        <h3 class="modal-title"><i class="bi bi-receipt-cutoff"></i> إضافة فاتورة شراء جديدة</h3>
        <button class="modal-close-btn" id="modalClose" type="button">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <form id="billForm" novalidate>

        {{-- التاريخ --}}
        <div class="modal-date-row">
          <label for="billDate"><i class="bi bi-calendar3"></i> تاريخ الفاتورة</label>
          <input type="date" class="date-input" id="billDate" required />
        </div>

        {{-- اسم المورد --}}
        <div class="modal-date-row" style="position:relative">
          <label for="supplierInput"><i class="bi bi-person-fill"></i> اسم المورد <span style="color:#aaa;font-weight:400;font-size:.8rem">(اختياري)</span></label>
          <input type="text" class="date-input" id="supplierInput" autocomplete="off"
            placeholder="ابدأ الكتابة للبحث أو أدخل اسم مورد جديد..." />
          <div id="supplierDropdown"
            style="display:none;position:absolute;top:100%;right:0;left:0;background:#fff;border:1.5px solid #c8e6c9;border-radius:0 0 9px 9px;z-index:999;max-height:180px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1)">
          </div>
        </div>

        {{-- الأصناف --}}
        <div class="modal-items-label">
          <i class="bi bi-list-ul"></i> الأصناف / الخدمات
        </div>
        <div id="itemsContainer"></div>

        {{-- إجمالي متحرك --}}
        <div style="text-align:left;margin-top:10px;padding:8px 14px;background:#f0f7f4;border-radius:8px;font-weight:700;color:#1a3c34;font-size:.95rem">
          الإجمالي: <span id="liveTotalDisplay">0.00</span> ج.م
        </div>

        {{-- Footer --}}
        <div class="modal-footer">
          <button type="button" class="btn-add-row" id="addItemRowBtn">
            <i class="bi bi-plus-circle"></i> إضافة صنف جديد
          </button>
          <button type="submit" class="btn-submit-bill" id="submitBillBtn">
            <i class="bi bi-check-lg"></i> إضافة الفاتورة
          </button>
        </div>

      </form>
    </div>
  </div>


  @include('dashboard.include.toast')
  @include('dashboard.include.footer')
  <script src="{{ asset('arbeto_dashboard/js/bills.js') }}"></script>