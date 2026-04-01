@include('website.includ.head')
    <link rel="stylesheet" href="{{ asset('Arbeto/css/cart.css') }}" />
    <style>
      .item-title a { color: inherit; text-decoration: none; }
      .item-title a:hover { text-decoration: underline; }
      .cart-page { width: 65%; }
      .current-price { text-align: right; margin-top: 15px; }
    </style>
</head>
<body>
    @include('website.includ.bars')
    @include('website.includ.navbar')
    </header>

    <div id="toastContainer" class="toast-container"></div>

    <main class="cart-page">
      <div class="cart-container">
        <div class="cart-items">
          <h2 class="cart-title">قائمة المفضلة ({{ $favorites->count() }} منتجات)</h2>

          @forelse($favorites as $fav)
          @php
            $p = $fav->product;
            $primaryImg = $p ? $p->getPrimaryImage() : null;
            $imgPath = $primaryImg ? asset($primaryImg) : asset('Arbeto/images/placeholder.png');
            $discount = $p->discount ?? 0;
            $oldP = $discount > 0 ? round($p->price_sell / (1 - $discount / 100)) : null;

            // Get seller information
            $seller = $p?->addedBy;
            $sellerBrand = $seller?->brand_name ?: ($seller ? trim(($seller->first_name ?? '') . ' ' . ($seller->last_name ?? '')) : 'Arbeto');
            $sellerPhone = $seller?->brand_phone ?: $seller?->phone;
          @endphp
          <div class="cart-item" data-favorite-id="{{ $fav->id }}" data-product-id="{{ $fav->product_id }}">
            <div class="item-img-container">
              <a href="{{ route('product.show', $fav->product_id) }}">
                <img src="{{ $imgPath }}" alt="{{ $p->name ?? '' }}" class="item-img" />
              </a>
            </div>
            <div class="item-details">
              <div class="item-header">
                <h3 class="item-title">
                  <a href="{{ route('product.show', $fav->product_id) }}">{{ $p->name ?? '' }}</a>
                </h3>
              </div>

              <div class="item-pricing">
                <p class="current-price">{{ number_format($p->price_sell ?? 0, 2) }} جنية</p>
                @if($discount > 0)
                <div class="old-price-container">
                  <span class="old-price">{{ $oldP }} جنية</span>
                  <span class="discount-badge">خصم {{ $discount }}%</span>
                </div>
                @endif
              </div>

              <!-- عرض العدد المتبقي في المخزون -->
              <div style="margin: 8px 0; font-size: 13px; color: #666;">
                <span style="font-weight: 600;">المتبقي في المخزون:</span>
                <span style="color: {{ ($p->getInventoryQuantity()) > 10 ? '#2c4b2c' : (($p->getInventoryQuantity()) > 0 ? '#f39c12' : '#c0392b') }};">
                  {{ $p->getInventoryQuantity() }} قطعة
                </span>
              </div>

              <!-- معلومات البائع -->
              <div style="margin: 8px 0; font-size: 13px; color: #666;">
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600;">البائع:</span>
                  <span style="color: #2c4b2c;">{{ $sellerBrand }}</span>
                </div>
                @if($sellerPhone)
                <div>
                  <span style="font-weight: 600;">رقم البراند:</span>
                  <a href="tel:{{ $sellerPhone }}" style="color: #2c4b2c; text-decoration: none;">{{ $sellerPhone }}</a>
                </div>
                @endif
              </div>

              <!-- <p class="seller-info">يتم البيع عبر أربيتو الرسمي</p> -->

              <div class="item-footer">
                <div style="visibility: hidden" class="quantity-selector">
                  <button class="qty-btn minus"><i class="bi bi-dash"></i></button>
                  <span class="qty-value">1</span>
                  <button class="qty-btn plus"><i class="bi bi-plus"></i></button>
                </div>
                <div class="item-actions">
                  <button class="action-btn remove"><i class="bi bi-trash"></i> إزالة</button>
                  <button class="action-btn move-to-cart"><i class="bi bi-bag-plus"></i> أضف للحقيبة</button>
                </div>
              </div>
            </div>
          </div>
          @empty
          <div class="empty-cart" style="text-align: center; padding: 60px 20px; color: #848570;">
            <i class="bi bi-heart" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
            <p style="font-size: 18px;">قائمة المفضلة فارغة</p>
            <a href="/" style="color: #2c4b2c; font-weight: 600;">تصفح المنتجات</a>
          </div>
          @endforelse
        </div>

        <aside class="cart-summary" style="visibility: hidden"></aside>
      </div>
    </main>

    @include('website.includ.footer')
    <script src="{{ asset('Arbeto/js/bags.js') }}"></script>
</body>
</html>
