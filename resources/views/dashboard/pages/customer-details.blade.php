@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/customers.css')}}">
<style>
  .btn-back.role-ceo {
    background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%);
    color: #fffdf3;
  }

  .btn-back.role-manager {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: #fff;
  }

  .btn-back.role-trader {
    background: linear-gradient(135deg, #16a34a 0%, #166534 100%);
    color: #fff;
  }

  #customerDetailsContainer.role-ceo .info-section {
    background: linear-gradient(135deg, #fff8dc 0%, #fff1b8 100%);
    border: 1px solid #e7c766;
  }

  #customerDetailsContainer.role-ceo .section-title {
    color: #7a5700;
    border-bottom-color: #e7c766;
  }

  #customerDetailsContainer.role-ceo .field-label,
  #customerDetailsContainer.role-ceo .detail-label,
  #customerDetailsContainer.role-ceo .review-text {
    color: #8a6a10;
  }

  #customerDetailsContainer.role-ceo .field-value,
  #customerDetailsContainer.role-ceo .product-card,
  #customerDetailsContainer.role-ceo .order-item,
  #customerDetailsContainer.role-ceo .review-item {
    background: #fffaf0;
    border-color: #e7c766;
  }

  #customerDetailsContainer.role-ceo .order-item {
    border-left-color: #d4a017;
  }

  #customerDetailsContainer.role-ceo .product-name,
  #customerDetailsContainer.role-ceo .product-name-review,
  #customerDetailsContainer.role-ceo .order-id,
  #customerDetailsContainer.role-ceo .field-value,
  #customerDetailsContainer.role-ceo .detail-value {
    color: #7a5700;
  }

  #customerDetailsContainer.role-ceo .product-price {
    color: #b8860b;
  }

  #customerDetailsContainer.role-manager .info-section {
    background: linear-gradient(135deg, #fff1f1 0%, #ffe2e2 100%);
    border: 1px solid #f5b7b1;
  }

  #customerDetailsContainer.role-manager .section-title {
    color: #8b1f1f;
    border-bottom-color: #f5b7b1;
  }

  #customerDetailsContainer.role-manager .field-label,
  #customerDetailsContainer.role-manager .detail-label,
  #customerDetailsContainer.role-manager .review-text {
    color: #9b2c2c;
  }

  #customerDetailsContainer.role-manager .field-value,
  #customerDetailsContainer.role-manager .product-card,
  #customerDetailsContainer.role-manager .order-item,
  #customerDetailsContainer.role-manager .review-item {
    background: #fff6f6;
    border-color: #f5b7b1;
  }

  #customerDetailsContainer.role-manager .order-item {
    border-left-color: #dc2626;
  }

  #customerDetailsContainer.role-manager .product-name,
  #customerDetailsContainer.role-manager .product-name-review,
  #customerDetailsContainer.role-manager .order-id,
  #customerDetailsContainer.role-manager .field-value,
  #customerDetailsContainer.role-manager .detail-value {
    color: #8b1f1f;
  }

  #customerDetailsContainer.role-manager .product-price {
    color: #b91c1c;
  }

  #customerDetailsContainer.role-trader .info-section {
    background: linear-gradient(135deg, #effdf2 0%, #dcfce7 100%);
    border: 1px solid #a7f3d0;
  }

  #customerDetailsContainer.role-trader .section-title {
    color: #166534;
    border-bottom-color: #a7f3d0;
  }

  #customerDetailsContainer.role-trader .field-label,
  #customerDetailsContainer.role-trader .detail-label,
  #customerDetailsContainer.role-trader .review-text {
    color: #1f7a45;
  }

  #customerDetailsContainer.role-trader .field-value,
  #customerDetailsContainer.role-trader .product-card,
  #customerDetailsContainer.role-trader .order-item,
  #customerDetailsContainer.role-trader .review-item {
    background: #f5fff8;
    border-color: #a7f3d0;
  }

  #customerDetailsContainer.role-trader .order-item {
    border-left-color: #16a34a;
  }

  #customerDetailsContainer.role-trader .product-name,
  #customerDetailsContainer.role-trader .product-name-review,
  #customerDetailsContainer.role-trader .order-id,
  #customerDetailsContainer.role-trader .field-value,
  #customerDetailsContainer.role-trader .detail-value {
    color: #166534;
  }

  #customerDetailsContainer.role-trader .product-price {
    color: #15803d;
  }
</style>
</head>

<body>
    @include('dashboard.include.sidebar')

      <div class="dashboard-container" id="customerDetailsContainer">
      <div class="page-header" style="flex-direction: row">
        <div>
          <h1><i class="bi bi-person-circle"></i> تفاصيل العميل</h1>
          <p>عرض جميع بيانات ونشاطات العميل</p>
        </div>
        <button
          class="btn-back"
          id="backButton"
          type="button"
          data-target="{{route('dashboard.customers')}}"
        >
          <i class="bi bi-arrow-right"></i> <span id="backButtonText">العودة للعملاء</span>
        </button>
      </div>

      <!-- Personal Information -->
      <section class="info-section">
        <h2 class="section-title">
          <i class="bi bi-person-badge"></i> المعلومات الشخصية
        </h2>
        <div class="info-grid" id="personalInfo">
          <!-- Personal info will be loaded here -->
        </div>
        <button class="btn-change-password" id="changePasswordBtn">
          <i class="bi bi-key"></i> تغيير كلمة المرور
        </button>
      </section>

      <!-- Cart Items -->
      <section class="info-section">
        <h2 class="section-title">
          <i class="bi bi-cart"></i> المنتجات في السلة
        </h2>
        <div id="cartItems" class="products-list">
          <!-- Cart items will be loaded here -->
        </div>
      </section>

      <!-- Favorites -->
      <section class="info-section">
        <h2 class="section-title"><i class="bi bi-heart"></i> قائمة المفضلة</h2>
        <div id="favoriteItems" class="products-list">
          <!-- Favorite items will be loaded here -->
        </div>
      </section>

      <!-- Orders History -->
      <section class="info-section">
        <h2 class="section-title">
          <i class="bi bi-clock-history"></i> سجل الطلبات
        </h2>
        <div id="ordersHistory" class="orders-list">
          <!-- Orders will be loaded here -->
        </div>
      </section>

      <!-- Product Reviews -->
      <section class="info-section">
        <h2 class="section-title">
          <i class="bi bi-star"></i> تقييمات المنتجات
        </h2>
        <div id="productReviews" class="reviews-list">
          <!-- Reviews will be loaded here -->
        </div>
      </section>
    </div>

    <!-- Password Change Modal -->
    <div class="modal-overlay" id="passwordModal">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>تغيير كلمة المرور</h3>
          <button class="btn-close-modal" onclick="closePasswordModal()">
            <span class="bi bi-x-lg"></span>
          </button>
        </div>
        <div class="modal-body">
          <input
            type="password"
            id="newPassword"
            class="password-input"
            placeholder="كلمة المرور الجديدة"
          />
          <button
            class="btn-submit"
            id="submitPasswordBtn"
            onclick="changePassword()"
          >
            <span class="btn-text">تغيير</span>
            <span class="btn-loader" style="display: none">
              <i class="bi bi-arrow-repeat rotating"></i>
            </span>
          </button>
        </div>
      </div>
    </div>

    @include('dashboard.include.toast')

    <!-- Wallet Modal -->
    <div class="modal-overlay" id="walletModal">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3><i class="bi bi-wallet2"></i> تحديث رصيد المحفظة</h3>
          <button class="btn-close-modal" onclick="closeWalletModal()">
            <span class="bi bi-x-lg"></span>
          </button>
        </div>
        <div class="modal-body">
          <p style="color:#888;margin-bottom:12px;text-align:right;">الرصيد الحالي: <strong id="currentWalletDisplay">0</strong> جنيه</p>
          <input
            type="number"
            id="newWalletBalance"
            class="password-input"
            placeholder="الرصيد الجديد بالجنيه"
            min="0"
            step="0.01"
          />
          <button
            class="btn-submit"
            id="submitWalletBtn"
            onclick="confirmWalletUpdate()"
          >
            <span class="btn-text">تحديث الرصيد</span>
            <span class="btn-loader" style="display: none">
              <i class="bi bi-arrow-repeat rotating"></i>
            </span>
          </button>
        </div>
      </div>
    </div>

    <script src="{{asset('arbeto_dashboard/js/customer-details.js')}}"></script>
    @include('dashboard.include.footer')