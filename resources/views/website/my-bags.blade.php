@include('website.includ.head')
    <link rel="stylesheet" href="{{asset('Arbeto/css/cart.css')}}" />
  
</head>
<body>
    @include('website.includ.bars')
    @include('website.includ.navbar')
    </header>




    @php
      $subtotal = $carts->sum(fn($c) => ($c->product->price_sell ?? 0) * $c->quantity);
      $shipping = 50;
      $total    = $subtotal + $shipping;
    @endphp

    <main class="cart-page">
      <div id="toastContainer" class="toast-container"></div>
      <div class="cart-container">
        <!-- قسم المنتجات -->
        <div class="cart-items">
          <h2 class="cart-title">عربة التسوق ({{ $carts->count() }} منتجات)</h2>

          @forelse($carts as $cart)
          @php
            $p        = $cart->product;
            $primaryImg = $p ? $p->getPrimaryImage() : null;
            $imgPath  = $primaryImg ? asset($primaryImg) : asset('Arbeto/images/placeholder.png');
            $discount = $p->discount ?? 0;
            $oldP     = $discount > 0 ? round($p->price_sell / (1 - $discount / 100)) : null;
            $isFav    = isset($favMap[$p->id]);
            $favId    = $favMap[$p->id] ?? '';

            // Get seller information
            $seller = $p?->addedBy;
            $sellerBrand = $seller?->brand_name ?: ($seller ? trim(($seller->first_name ?? '') . ' ' . ($seller->last_name ?? '')) : 'Arbeto');
            $sellerPhone = $seller?->brand_phone ?: $seller?->phone;
          @endphp
          <div class="cart-item"
               data-cart-id="{{ $cart->id }}"
               data-product-id="{{ $cart->product_id }}"
               data-price="{{ $p->price_sell ?? 0 }}">
            <div class="item-img-container">
              <a href="{{ route('product.show', $cart->product_id) }}">
                <img src="{{ $imgPath }}" alt="{{ $p->name ?? '' }}" class="item-img" />
              </a>
            </div>
            <div class="item-details">
              <div class="item-header">
                <h3 class="item-title">
                  <a href="{{ route('product.show', $cart->product_id) }}">{{ $p->name ?? '' }}</a>
                </h3>
                @if(!empty($cart->selected_options) && is_array($cart->selected_options))
                <div class="selected-options" style="margin-top: 8px; font-size: 13px; color: #616161;">
                  @foreach($cart->selected_options as $opt)
                  <div style="margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #2c4b2c;">{{ $opt['group'] ?? '' }}:</span>
                    <span>{{ $opt['optionName'] ?? '' }}</span>
                  </div>
                  @endforeach
                </div>
                @endif
                <div class="item-pricing">
                  <p class="current-price">{{ number_format($p->price_sell ?? 0, 2) }} جنية</p>
                  @if($discount > 0)
                  <div class="old-price-container">
                    <span class="old-price">{{ $oldP }} جنية</span>
                    <span class="discount-badge">خصم {{ $discount }}%</span>
                  </div>
                  @endif
                </div>
              </div>
              <p class="item-subtotal">الإجمالي: <strong class="item-total-val">{{ number_format(($p->price_sell ?? 0) * $cart->quantity, 2) }}</strong> جنية</p>

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

              <p class="seller-info"></p>
              <div class="item-footer">
                <div class="quantity-selector">
                  <button class="qty-btn minus"><i class="bi bi-dash"></i></button>
                  <span class="qty-value">{{ $cart->quantity }}</span>
                  <button class="qty-btn plus"><i class="bi bi-plus"></i></button>
                </div>
                <div class="item-actions">
                  <button class="action-btn remove">
                    <i class="bi bi-trash"></i> إزالة
                  </button>
                  <button class="action-btn favorite {{ $isFav ? 'active' : '' }}"
                          data-product-id="{{ $cart->product_id }}"
                          data-favorite-id="{{ $favId }}">
                    <i class="bi {{ $isFav ? 'bi-heart-fill' : 'bi-heart' }}"></i>
                    إضافة إلى المفضلة
                  </button>
                </div>
              </div>
            </div>
          </div>
          @empty
          <div class="empty-cart" style="text-align:center;padding:60px 20px;color:#848570;">
            <i class="bi bi-bag-x" style="font-size:48px;display:block;margin-bottom:16px;"></i>
            <p style="font-size:18px;">سلتك فارغة</p>
            <a href="/" style="color:#2c4b2c;font-weight:600;">تصفح المنتجات →</a>
          </div>
          @endforelse
        </div>

        <!-- قسم الملخص -->
        <aside class="cart-summary" {{ $carts->isEmpty() ? 'style=visibility:hidden' : '' }}>
          <div class="summary-card">
            <h3 class="summary-title">ملخص الطلب</h3>

            <div class="promo-code">
              <div class="promo-input-wrapper">
                <input type="text" placeholder="أدخل كود الخصم" class="promo-input" />
                <button class="apply-promo-btn">تطبيق</button>
              </div>
              <div id="promoApplied" style="display:none;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 12px;background:#f0f7f0;border-radius:8px;border:1px solid #c4d8b4;">
                <span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#2d4a1e;">
                  <i class="bi bi-check-circle-fill" style="color:#3a5c28;"></i>
                  <span id="promoAppliedCode" style="font-weight:700;"></span>
                  <span id="promoAppliedPercent" style="color:#596d52;"></span>
                </span>
                <button type="button" onclick="removePromoCode()" style="background:#fde8e8;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#c0392b;font-size:.9rem;flex-shrink:0;">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>

            <div class="summary-details">
              <div class="summary-row subtotal-row">
                <span class="row-label">المجموع الفرعي ({{ $carts->count() }} منتجات)</span>
                <span class="row-value" id="subtotalVal">{{ number_format($subtotal, 2) }} جنية</span>
              </div>
              <div class="summary-row shipping-row">
                <span class="row-label">رسوم الشحن</span>
                <span class="row-value" id="shippingPriceVal">اختر المحافظة لتحديد القيمة</span>
              </div>
              <div class="summary-row discount-row" style="display: none">
                <span class="row-label">كود خصم</span>
                <span class="row-value discount-val">0.00 جنية</span>
              </div>
              <hr class="summary-divider" />
              <div class="summary-row total-row">
                <span class="row-label">المجموع</span>
                <span class="row-value" id="totalVal">{{ number_format($total, 2) }} جنية</span>
              </div>
              <p class="vat-info">الأسعار تشمل ضريبة القيمة المضافة</p>
            </div>

            <!-- طريقة الدفع -->
            <div class="payment-section">
              <h4 class="section-subtitle">طريقة الدفع</h4>
              <div class="method-options">
                <label class="method-option">
                  <input type="radio" name="payment-method" value="instapay" />
                  <span>انستاباي</span>
                </label>
                <label class="method-option">
                  <input type="radio" name="payment-method" value="wallet" />
                  <span>محفظة الكاش</span>
                </label>
                <label class="method-option">
                  <input type="radio" name="payment-method" value="cod" />
                  <span>عند الاستلام</span>
                </label>
              </div>

              <!-- معلومات محفظة الكاش -->
              <div id="payment-info" class="payment-info-box" style="display:none;">
                <p class="transfer-number">رقم التحويل: <strong>0108873454</strong></p>
                <p class="working-hours-msg">سيتم اتمام الدفع خلال ساعة واحده من ساعات العمل 8ص - 8م</p>
                <div class="receipt-upload-area">
                  <input type="file" id="paymentProofWallet" accept="image/jpeg,image/png,image/jpg" class="receipt-file-input" />
                  <label for="paymentProofWallet" class="receipt-upload-label">
                    <span class="receipt-upload-icon"><i class="bi bi-cloud-arrow-up-fill"></i></span>
                    <span class="receipt-upload-text">
                      <strong>إرفاق إيصال الدفع</strong>
                      <small>PNG, JPG – حد أقصى 5MB</small>
                    </span>
                  </label>
                  <div class="receipt-file-info" id="walletFileInfo" style="display:none;">
                    <i class="bi bi-file-earmark-image-fill"></i>
                    <span id="walletFileName"></span>
                    <button type="button" class="receipt-clear-btn" onclick="clearReceiptFile('wallet')"><i class="bi bi-x"></i></button>
                  </div>
                </div>
              </div>

              <!-- معلومات انستاباي -->
              <div id="payment-info-ip" class="payment-info-box" style="display:none;">
                <p class="transfer-number">اسم المستخدم: <strong>@arbeto75</strong></p>
                <p class="working-hours-msg">سيتم اتمام الدفع خلال ساعة واحده من ساعات العمل 8ص - 8م</p>
                <div class="receipt-upload-area">
                  <input type="file" id="paymentProofInstapay" accept="image/jpeg,image/png,image/jpg" class="receipt-file-input" />
                  <label for="paymentProofInstapay" class="receipt-upload-label">
                    <span class="receipt-upload-icon"><i class="bi bi-cloud-arrow-up-fill"></i></span>
                    <span class="receipt-upload-text">
                      <strong>إرفاق إيصال الدفع</strong>
                      <small>PNG, JPG – حد أقصى 5MB</small>
                    </span>
                  </label>
                  <div class="receipt-file-info" id="instapayFileInfo" style="display:none;">
                    <i class="bi bi-file-earmark-image-fill"></i>
                    <span id="instapayFileName"></span>
                    <button type="button" class="receipt-clear-btn" onclick="clearReceiptFile('instapay')"><i class="bi bi-x"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- عنوان الشحن -->
            <div class="shipping-section">
              <h4 class="section-subtitle">عنوان الشحن</h4>

              <div class="gov-city-row">
                <select id="govSelect" name="governorate">
                  <option value="">اختر المحافظة</option>
                <option value="القاهرة">القاهرة</option>
                <option value="الجيزة">الجيزة</option>
                <option value="القليوبية">القليوبية</option>
                <option value="الإسكندرية">الإسكندرية</option>
                <option value="البحيرة">البحيرة</option>
                <option value="كفر الشيخ">كفر الشيخ</option>
                <option value="الدقهلية">الدقهلية</option>
                <option value="الغربية">الغربية</option>
                <option value="المنوفية">المنوفية</option>
                <option value="الشرقية">الشرقية</option>
                <option value="دمياط">دمياط</option>
                <option value="بورسعيد">بورسعيد</option>
                <option value="الإسماعيلية">الإسماعيلية</option>
                <option value="السويس">السويس</option>
                <option value="الفيوم">الفيوم</option>
                <option value="بني سويف">بني سويف</option>
                <option value="المنيا">المنيا</option>
                <option value="أسيوط">أسيوط</option>
                <option value="سوهاج">سوهاج</option>
                <option value="قنا">قنا</option>
                <option value="الأقصر">الأقصر</option>
                <option value="أسوان">أسوان</option>
                <option value="البحر الأحمر">البحر الأحمر</option>
                <option value="الوادي الجديد">الوادي الجديد</option>
                <option value="مطروح">مطروح</option>
                <option value="شمال سيناء">شمال سيناء</option>
                <option value="جنوب سيناء">جنوب سيناء</option>
                </select>
                <select id="citySelect" name="city">
                  <option value="">اختر المدينة</option>
                </select>
              </div>

              <textarea id="addressInput" class="address-input"
                placeholder="العنوان بالتفصيل (القرية أو الشارع، المنزل، أقرب معلم رئيسي...)"></textarea>
              <p class="delivery-highlight">
                سيصل في خلال 3 - 5 ايام عمل كحد اقصى سيتم تواصل الشحن للتأكيد قبل الوصول
              </p>
            </div>

            <button id="submitOrder" class="checkout-btn">اتمام الدفع</button>
          </div>
        </aside>
      </div>
    </main>
    
    @include('website.includ.footer')
    <script src="{{asset('Arbeto/js/governorates.js')}}"></script>
    <script src="{{asset('Arbeto/js/bags.js')}}"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function () {
      const initCity = '{{ $userAddress->city ?? '' }}';
      const widgets = initGovCityCascade(document.querySelector('.shipping-section'), {
        govSelectId:  'govSelect',
        citySelectId: 'citySelect',
        initGov:  '{{ $userAddress->governorate ?? '' }}',
        initCity: initCity,
      });

      // After bags.js triggers gov change for shipping price, restore the city
      if (widgets && initCity) {
        setTimeout(() => {
          widgets.cityWidget.setValue(initCity);
        }, 200);
      }

      // Pre-fill address textarea
      @if(!empty($userAddress->street))
        const addrInput = document.getElementById('addressInput');
        if (addrInput && !addrInput.value) addrInput.value = '{{ addslashes($userAddress->street) }}';
      @endif
    });
    </script>

</body>

</html>

