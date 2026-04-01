@include('dashboard.include.head')
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/orders.css') }}">
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/prooducts.css')}}">

<style>
  /* ===== Layout ===== */
  .sc-page {
    padding: 28px 22px;
    direction: rtl;
  }

  .dashboard-container {
    width: 85%;
    margin-left: 0%;
  }

  /* ===== Page Header ===== */
  .sc-page-header {
    margin-bottom: 28px;
  }

  .sc-page-header h1 {
    font-size: 1.7rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sc-page-header p {
    color: #596d52;
    font-size: 0.95rem;
    margin: 0;
  }

  /* ===== Stats Row ===== */
  .sc-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  .sc-stat {
    background: #fff;
    border-radius: 14px;
    padding: 18px 16px;
    box-shadow: 0 2px 12px rgba(89, 109, 82, .1);
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .sc-stat .s-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    margin-bottom: 2px;
  }

  .sc-stat .s-val {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d4a1e;
  }

  .sc-stat .s-lbl {
    font-size: 0.8rem;
    color: #7d9a72;
    font-weight: 500;
  }

  .s-icon.blue {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .s-icon.green {
    background: #dff0d8;
    color: #3a5c28;
  }

  .s-icon.yellow {
    background: #fff3cd;
    color: #8a6d3b;
  }

  .s-icon.purple {
    background: #f3e8ff;
    color: #7c3aed;
  }

  /* ===== Tabs ===== */
  .sc-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 24px;
    border-bottom: 2px solid #eaf2e4;
    padding-bottom: 0;
  }

  .sc-tab {
    padding: 10px 22px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 0.93rem;
    font-weight: 600;
    color: #7d9a72;
    cursor: pointer;
    transition: all .2s;
    margin-bottom: -2px;
    border-radius: 8px 8px 0 0;
  }

  .sc-tab.active {
    color: #2d4a1e;
    border-bottom-color: #596d52;
    background: #f5fbf0;
  }

  .sc-tab-panel {
    display: none;
  }

  .sc-tab-panel.active {
    display: block;
  }

  /* ===== Two-column layout on companies tab ===== */
  .sc-layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 22px;
    align-items: start;
  }

  @media(max-width:900px) {
    .sc-layout {
      grid-template-columns: 1fr;
    }
  }

  /* ===== Form Card ===== */
  .sc-form-card {
    background: #fff;
    border-radius: 16px;
    padding: 26px 22px;
    box-shadow: 0 2px 14px rgba(89, 109, 82, .1);
  }

  .sc-form-card h2 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0 0 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eaf2e4;
  }

  .sc-field {
    margin-bottom: 14px;
  }

  .sc-field label {
    display: block;
    font-size: 0.83rem;
    font-weight: 600;
    color: #596d52;
    margin-bottom: 5px;
  }

  .sc-field input[type="text"],
  .sc-field input[type="number"],
  .sc-field select {
    width: 100%;
    padding: 9px 12px;
    border: 2px solid #eaf2e4;
    border-radius: 9px;
    font-size: 0.88rem;
    color: #2d4a1e;
    outline: none;
    transition: border .2s;
    background: #fff;
  }

  .sc-field input:focus,
  .sc-field select:focus {
    border-color: #596d52;
  }

  .sc-field .price-wrap {
    display: none;
  }

  .sc-field .price-wrap.visible {
    display: block;
  }

  /* Logo upload */
  .logo-upload-area {
    border: 2px dashed #c4d8b4;
    border-radius: 10px;
    padding: 14px;
    text-align: center;
    cursor: pointer;
    transition: border .2s;
    position: relative;
  }

  .logo-upload-area:hover {
    border-color: #596d52;
  }

  .logo-upload-area input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .logo-upload-area .upload-icon {
    font-size: 1.5rem;
    color: #7d9a72;
    margin-bottom: 4px;
  }

  .logo-upload-area .upload-txt {
    font-size: 0.8rem;
    color: #7d9a72;
  }

  .logo-preview {
    display: none;
    margin-top: 8px;
  }

  .logo-preview img {
    width: 70px;
    height: 50px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid #eaf2e4;
  }

  /* Type radio */
  .type-radios {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .type-radio-label {
    border: 2px solid #eaf2e4;
    border-radius: 9px;
    padding: 9px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #596d52;
    transition: all .2s;
  }

  .type-radio-label input {
    accent-color: #596d52;
  }

  .type-radio-label:has(input:checked) {
    border-color: #596d52;
    background: #f5fbf0;
    color: #2d4a1e;
  }

  .btn-sc-submit {
    width: 100%;
    padding: 11px;
    background: #596d52;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.93rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 6px;
  }

  .btn-sc-submit:hover {
    background: #3a5c28;
  }

  .btn-sc-submit .sp {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, .4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: none;
  }

  .btn-sc-submit.loading .btn-txt {
    display: none;
  }

  .btn-sc-submit.loading .sp {
    display: inline-block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ===== Companies Table ===== */
  .sc-table-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 14px rgba(89, 109, 82, .1);
    overflow: hidden;
  }

  .sc-table-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid #eaf2e4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }

  .sc-table-header h2 {
    font-size: 1.0rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-search {
    position: relative;
  }

  .sc-search input {
    padding: 8px 14px 8px 36px;
    border: 2px solid #eaf2e4;
    border-radius: 9px;
    font-size: 0.87rem;
    color: #2d4a1e;
    outline: none;
    width: 200px;
    transition: border .2s;
  }

  .sc-search input:focus {
    border-color: #596d52;
  }

  .sc-search .bi-search {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #7d9a72;
    font-size: 0.9rem;
    pointer-events: none;
  }

  table.sc-table {
    width: 100%;
    border-collapse: collapse;
    direction: rtl;
  }

  table.sc-table thead th {
    background: #f5fbf0;
    color: #596d52;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 11px 16px;
    text-align: right;
    border-bottom: 1px solid #eaf2e4;
    white-space: nowrap;
  }

  table.sc-table tbody tr {
    transition: background .15s;
  }

  table.sc-table tbody tr:hover {
    background: #fafdf8;
  }

  table.sc-table tbody td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f5eb;
    font-size: 0.88rem;
    color: #2d4a1e;
    vertical-align: middle;
  }

  .co-logo-cell {
    width: 52px;
    height: 38px;
    object-fit: contain;
    border-radius: 7px;
    border: 1px solid #eaf2e4;
    background: #f5fbf0;
  }

  .co-no-logo {
    width: 52px;
    height: 38px;
    background: #edf3e8;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .co-no-logo .bi {
    font-size: 1.2rem;
    color: #596d52;
  }

  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 11px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .type-badge.fixed {
    background: #dff0d8;
    color: #3a5c28;
  }

  .type-badge.manual {
    background: #fff3cd;
    color: #8a6d3b;
  }

  .td-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-td {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all .2s;
  }

  .btn-td.view {
    background: #e8f0fe;
    color: #1a73e8;
  }

  .btn-td.edit {
    background: #f5fbf0;
    color: #596d52;
  }

  .btn-td.del {
    background: #fde8e8;
    color: #c0392b;
  }

  .btn-td:hover {
    transform: scale(1.1);
  }

  .sc-empty {
    text-align: center;
    padding: 40px;
    color: #7d9a72;
  }

  .sc-empty .bi {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 8px;
  }

  /* ===== Governorates Tab ===== */
  .gov-table-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 14px rgba(89, 109, 82, .1);
    overflow: hidden;
  }

  .gov-table-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid #eaf2e4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }

  .gov-table-header h2 {
    font-size: 1.0rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-save-all {
    padding: 9px 20px;
    background: #596d52;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-save-all:hover {
    background: #3a5c28;
  }

  .btn-save-all .sp {
    width: 13px;
    height: 13px;
    border: 2px solid rgba(255, 255, 255, .4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: none;
  }

  .btn-save-all.loading .btn-txt {
    display: none;
  }

  .btn-save-all.loading .sp {
    display: inline-block;
  }

  .gov-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(262px, 1fr));
    gap: 1px;
    background: #eaf2e4;
  }

  .gov-row {
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    gap: 14px;
    transition: background .15s;
  }

  .gov-row:hover {
    background: #fafdf8;
  }

  .gov-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #2d4a1e;
    flex: 1;
  }

  .gov-price-input {
    width: 110px;
    padding: 7px 10px;
    border: 2px solid #eaf2e4;
    border-radius: 8px;
    font-size: 0.87rem;
    color: #2d4a1e;
    text-align: center;
    outline: none;
    transition: border .2s;
  }

  .gov-price-input:focus {
    border-color: #596d52;
  }

  .gov-currency {
    font-size: 0.8rem;
    color: #7d9a72;
    font-weight: 500;
    white-space: nowrap;
  }

  /* ===== Edit Modal ===== */
  .sc-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .sc-modal-overlay.active {
    display: flex;
  }

  .sc-modal {
    background: #fff;
    border-radius: 18px;
    padding: 30px 28px;
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 12px 50px rgba(0, 0, 0, .2);
  }

  .sc-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #eaf2e4;
  }

  .sc-modal-head h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0;
  }

  .btn-modal-close {
    width: 30px;
    height: 30px;
    background: #f5f5f5;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-modal-close:hover {
    background: #fde8e8;
    color: #c0392b;
  }

  /* ===== Delete Modal ===== */
  .del-modal {
    background: #fff;
    border-radius: 18px;
    padding: 32px 26px;
    width: 100%;
    max-width: 380px;
    text-align: center;
    box-shadow: 0 12px 50px rgba(0, 0, 0, .2);
  }

  .del-modal .del-icon {
    width: 64px;
    height: 64px;
    background: #fde8e8;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
    font-size: 1.8rem;
    color: #c0392b;
  }

  .del-modal h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #2d4a1e;
    margin: 0 0 8px;
  }

  .del-modal p {
    font-size: 0.88rem;
    color: #7d9a72;
    margin: 0 0 20px;
  }

  .del-modal-btns {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .btn-confirm-del {
    padding: 10px 26px;
    background: #c0392b;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s;
  }

  .btn-confirm-del:hover {
    background: #a93226;
  }

  .btn-cancel-del {
    padding: 10px 26px;
    background: #f5f5f5;
    color: #596d52;
    border: none;
    border-radius: 9px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-cancel-del:hover {
    background: #eaf2e4;
  }

  /* ===== Loading ===== */
  .sc-loading {
    text-align: center;
    padding: 40px;
    color: #596d52;
    font-weight: 600;
  }

  /* ===== Company Gov Prices Modal Grid ===== */
  .co-gov-row {
    background: #fff;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    transition: background .15s;
  }
  .co-gov-row:hover { background: #fafdf8; }
  .co-gov-name {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 600;
    color: #2d4a1e;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .co-gov-name .bi { color: #596d52; font-size: 0.8rem; }
  .co-gov-input {
    width: 90px;
    padding: 6px 8px;
    border: 2px solid #eaf2e4;
    border-radius: 7px;
    font-size: 0.85rem;
    color: #2d4a1e;
    text-align: center;
    outline: none;
    transition: border .2s;
  }
  .co-gov-input:focus { border-color: #596d52; }
  .co-gov-currency { font-size: 0.78rem; color: #7d9a72; white-space: nowrap; }

  /* ===== Pricing Button in Table ===== */
  .btn-gov-prices {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: #f0f7f0;
    border: 1px solid #c4d8b4;
    border-radius: 8px;
    color: #3a5c28;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    white-space: nowrap;
  }
  .btn-gov-prices:hover { background: #596d52; color: #fff; border-color: #596d52; }
</style>
</head>

<body>
  @include('dashboard.include.sidebar')

  <div class="dashboard-container">
    <div class="sc-page">

      {{-- Page Header --}}
      <div class="sc-page-header">
        <h1><span class="bi bi-truck"></span> إدارة شركات الشحن</h1>
        <p>تسجيل وإدارة شركات الشحن وأسعار توصيل المحافظات</p>
      </div>

      {{-- Statistics --}}
      <div class="sc-stats">
        <div class="sc-stat">
          <div class="s-icon blue"><span class="bi bi-building"></span></div>
          <div class="s-val" id="stat-companies">{{ $companies->count() }}</div>
          <div class="s-lbl">إجمالي الشركات</div>
        </div>
        <div class="sc-stat">
          <div class="s-icon green"><span class="bi bi-lock-fill"></span></div>
          <div class="s-val" id="stat-fixed">{{ $companies->where('shipping_type','fixed')->count() }}</div>
          <div class="s-lbl">شحن بسعر محدد</div>
        </div>
        <div class="sc-stat">
          <div class="s-icon yellow"><span class="bi bi-pencil-fill"></span></div>
          <div class="s-val" id="stat-manual">{{ $companies->where('shipping_type','manual')->count() }}</div>
          <div class="s-lbl">شحن يدوي</div>
        </div>
        <div class="sc-stat">
          <div class="s-icon purple"><span class="bi bi-geo-alt-fill"></span></div>
          <div class="s-val">{{ $governoratePrices->count() }}</div>
          <div class="s-lbl">محافظة مسجّلة</div>
        </div>
      </div>

      {{-- Tabs --}}
      <div class="sc-tabs">
        <button class="sc-tab active" data-tab="companies">
          <span class="bi bi-building"></span> شركات الشحن
        </button>
        <button class="sc-tab" data-tab="governorates">
          <span class="bi bi-geo-alt"></span> أسعار شحن المحافظات للطلبات
        </button>
      </div>

      {{-- TAB 1 : Companies --}}
      <div class="sc-tab-panel active" id="panel-companies">
        <div class="sc-layout">

          {{-- Registration Form --}}
          <aside class="sc-form-card">
            <h2><span class="bi bi-plus-circle-fill"></span> تسجيل شركة جديدة</h2>

            <div class="sc-field">
              <label>اسم الشركة <span style="color:#c0392b">*</span></label>
              <input type="text" id="reg-name" placeholder="مثال: DHL ،Aramex ..." />
            </div>

            <div class="sc-field">
              <label>شعار الشركة</label>
              <div class="logo-upload-area" id="regLogoArea">
                <input type="file" id="reg-logo" accept="image/*" />
                <div class="upload-icon"><span class="bi bi-cloud-arrow-up"></span></div>
                <div class="upload-txt">اسحب الصورة هنا أو اضغط للرفع<br><small>PNG, JPG, GIF – حد أقصى 2MB</small></div>
              </div>
              <div class="logo-preview" id="regLogoPreview">
                <img id="regLogoImg" src="" alt="Preview" />
              </div>
            </div>

            <div class="sc-field">
              <label>نوع الشحن <span style="color:#c0392b">*</span></label>
              <div class="type-radios">
                <label class="type-radio-label">
                  <input type="radio" name="reg-type" value="fixed" checked />
                  <span class="bi bi-lock-fill"></span> أوتوماتيكي
                </label>
                <label class="type-radio-label">
                  <input type="radio" name="reg-type" value="manual" />
                  <span class="bi bi-pencil-fill"></span> يدوي
                </label>
              </div>
            </div>

            <button class="btn-sc-submit" id="regSubmitBtn" onclick="registerCompany()">
              <span class="sp"></span>
              <span class="btn-txt"><span class="bi bi-plus-lg"></span> تسجيل الشركة</span>
            </button>
          </aside>

          {{-- Companies Table --}}
          <div class="sc-table-card">
            <div class="sc-table-header">
              <h2><span class="bi bi-list-ul"></span> الشركات المسجّلة</h2>
              <div class="sc-search">
                <span class="bi bi-search"></span>
                <input type="text" id="scSearch" placeholder="بحث باسم الشركة..." oninput="filterTable()" />
              </div>
            </div>
            <div id="companiesTableWrap">
              <div class="sc-loading"><span class="bi bi-hourglass-split"></span> جاري التحميل...</div>
            </div>
          </div>

        </div>
      </div>

      {{-- TAB 2 : Governorates --}}
      <div class="sc-tab-panel" id="panel-governorates">
        <div class="gov-table-card">
          <div class="gov-table-header">
            <h2><span class="bi bi-geo-alt-fill"></span> أسعار شحن المحافظات</h2>
            <button class="btn-save-all" id="saveGovBtn" onclick="saveAllGovPrices()">
              <span class="sp"></span>
              <span class="btn-txt"><span class="bi bi-save2-fill"></span> حفظ جميع الأسعار</span>
            </button>
          </div>
          <div class="gov-grid" id="govGrid">
            <div class="sc-loading"><span class="bi bi-hourglass-split"></span> جاري التحميل...</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  {{-- Edit Company Modal --}}
  <div class="sc-modal-overlay" id="editModal">
    <div class="sc-modal">
      <div class="sc-modal-head">
        <h3><span class="bi bi-pencil-square"></span> تعديل بيانات الشركة</h3>
        <button class="btn-modal-close" onclick="closeEditModal()"><span class="bi bi-x"></span></button>
      </div>

      <input type="hidden" id="edit-id" />

      <div class="sc-field">
        <label>اسم الشركة</label>
        <input type="text" id="edit-name" placeholder="اسم الشركة" />
      </div>

      <div class="sc-field">
        <label>شعار الشركة</label>
        <div class="logo-upload-area" id="editLogoArea">
          <input type="file" id="edit-logo" accept="image/*" />
          <div class="upload-icon"><span class="bi bi-cloud-arrow-up"></span></div>
          <div class="upload-txt">اسحب الصورة هنا أو اضغط للتغيير<br><small>اتركه فارغاً للإبقاء على الشعار الحالي</small></div>
        </div>
        <div class="logo-preview" id="editLogoPreview">
          <img id="editLogoImg" src="" alt="Preview" />
        </div>
      </div>

      <div class="sc-field">
        <label>نوع الشحن</label>
        <div class="type-radios">
          <label class="type-radio-label">
            <input type="radio" name="edit-type" value="fixed" />
            <span class="bi bi-lock-fill"></span> أوتوماتيكي
          </label>
          <label class="type-radio-label">
            <input type="radio" name="edit-type" value="manual" />
            <span class="bi bi-pencil-fill"></span> يدوي
          </label>
        </div>
      </div>

      <button class="btn-sc-submit" id="editSubmitBtn" onclick="submitEditCompany()">
        <span class="sp"></span>
        <span class="btn-txt"><span class="bi bi-save2-fill"></span> حفظ التعديلات</span>
      </button>
    </div>
  </div>

  {{-- Delete Confirm Modal --}}
  <div class="sc-modal-overlay" id="deleteModal">
    <div class="del-modal">
      <div class="del-icon"><span class="bi bi-trash3-fill"></span></div>
      <h3>تأكيد الحذف</h3>
      <p id="deleteModalTxt">هل أنت متأكد من حذف هذه الشركة؟</p>
      <div class="del-modal-btns">
        <button class="btn-confirm-del" id="confirmDelBtn" onclick="confirmDelete()">
          <span class="bi bi-trash3"></span> حذف
        </button>
        <button class="btn-cancel-del" onclick="closeDeleteModal()">إلغاء</button>
      </div>
    </div>
  </div>

  @include('dashboard.include.toast')

  {{-- Company Governorate Prices Modal --}}
  <div class="sc-modal-overlay" id="govPricesModal">
    <div class="sc-modal" style="max-width:620px;">
      <div class="sc-modal-head">
        <h3 id="govPricesModalTitle"><span class="bi bi-geo-alt-fill"></span> أسعار شحن المحافظات</h3>
        <button class="btn-modal-close" onclick="closeGovPricesModal()"><span class="bi bi-x"></span></button>
      </div>
      <p style="font-size:0.83rem;color:#7d9a72;margin:0 0 14px;">
        حدد سعر الشحن لكل محافظة. الأسعار مرتبطة بهذه الشركة فقط وتُستخدم لحساب أرباح التوصيل.
      </p>
      <div id="govPricesGrid" style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
        gap:1px;
        background:#eaf2e4;
        border-radius:10px;
        overflow:hidden;
        max-height:460px;
        overflow-y:auto;
      ">
      </div>
      <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn-cancel-del" onclick="closeGovPricesModal()">إلغاء</button>
        <button class="btn-sc-submit" id="saveGovPricesBtn" onclick="saveCompanyGovPrices()" style="width:auto;padding:10px 28px;">
          <span class="sp"></span>
          <span class="btn-txt"><span class="bi bi-save2-fill"></span> حفظ الأسعار</span>
        </button>
      </div>
    </div>
  </div>

  <script src="{{ asset('arbeto_dashboard/js/shipping-companies.js') }}"></script>
  @include('dashboard.include.footer')