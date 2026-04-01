@include('dashboard.include.head')
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/inventory.css') }}">
</head>

<body>
  @include('dashboard.include.sidebar')

  <div class="inventory-page">

    {{-- ═══ Header ═══ --}}
    <div class="inventory-page-header">
      <h2><i class="bi bi-box-seam-fill"></i> المخزون والموردون</h2>
      <div class="view-toggle">
        <button class="btn-toggle-view active" id="btnShowInventory">
          <i class="bi bi-grid-3x3-gap-fill"></i> المخزون
        </button>
        <button class="btn-toggle-view" id="btnShowSuppliers">
          <i class="bi bi-people-fill"></i> الموردون
        </button>
      </div>
    </div>

    {{-- ═══ Filter Bar ═══ --}}
    <div class="inv-filter-bar">
      <div id="inventoryFilters" class="inv-filters-inner">
        <div class="inv-dropdown" id="supplierDropdown">
          <button class="inv-dropdown-btn" id="supplierDropdownBtn">
            <i class="bi bi-person-fill"></i>
            <span id="supplierDropdownLabel">الكل</span>
            <i class="bi bi-chevron-down inv-drop-arrow"></i>
          </button>
          <div class="inv-dropdown-menu" id="supplierDropdownMenu">
            <div class="inv-drop-search-wrap">
              <i class="bi bi-search"></i>
              <input type="text" class="inv-drop-search-input" id="supplierDropdownSearch" placeholder="ابحث...">
            </div>
            <div id="supplierDropdownList">
              <div class="inv-dropdown-opt active" data-id="">الكل</div>
            </div>
          </div>
        </div>
        <div class="inv-status-group">
          <button class="inv-status-btn active" data-status="">الكل</button>
          <button class="inv-status-btn" data-status="available">متوفر</button>
          <button class="inv-status-btn" data-status="out_of_stock">منتهي الكمية</button>
        </div>
        <div class="inv-search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" class="inv-search-input" id="invSearchInput" placeholder="ابحث عن منتج...">
        </div>
      </div>
      <div id="suppliersFilters" class="inv-filters-inner" style="display:none">
        <div class="inv-search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" class="inv-search-input" id="suppSearchInput" placeholder="ابحث عن مورد...">
        </div>
      </div>
    </div>

    {{-- ═══ Inventory Section ═══ --}}
    <div id="inventorySection">
      <div class="inventory-grid" id="inventoryGrid">
        <div class="inv-loading">
          <i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري التحميل...
        </div>
      </div>
      <div class="inv-pagination" id="invPagination"></div>
    </div>

    {{-- ═══ Suppliers Section ═══ --}}
    <div id="suppliersSection" style="display:none">
      <div class="suppliers-grid" id="suppliersGrid">
        <div class="inv-loading">
          <i class="bi bi-arrow-repeat spin-icon-inv"></i> جاري التحميل...
        </div>
      </div>
    </div>

  </div>

  {{-- ═══ Invoices Mini-Modal ═══ --}}
  <div class="inv-mini-modal" id="invMiniModal">
    <div class="inv-mini-modal-box">
      <button class="inv-mini-modal-close" onclick="closeInvoiceModal()">
        <i class="bi bi-x-lg"></i>
      </button>
      <div class="inv-mini-modal-title" id="invMiniModalTitle"></div>
      <div id="invMiniModalContent"></div>
    </div>
  </div>

  @include('dashboard.include.toast')
  @include('dashboard.include.footer')
  <script src="{{ asset('arbeto_dashboard/js/inventory.js') }}"></script>