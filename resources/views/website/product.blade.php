@include('website.includ.head')
<link rel="stylesheet" href="{{asset('Arbeto/css/item.css')}}" />
</head>

<body>
  @include('website.includ.bars')
  @include('website.includ.navbar')
  </header>

  @php
  $images = collect($product->img ?? [])->filter()->values();
  $mainImg = $product->getPrimaryImage() ?: $images->first();
  $priceSell = (float) ($product->price_sell ?? 0);
  $discount = (float) ($product->discount ?? 0);
  $oldPrice = $discount > 0 ? round($priceSell / (1 - $discount / 100)) : null;
  $avgRating = round((float) ($product->reviews_avg_rating ?? 0), 1);
  $revCount = (int) ($product->reviews_count ?? 0);
  $starsFull = floor($avgRating);
  $decimal = $avgRating - $starsFull;
  $hasHalf = ($decimal >= 0.25 && $decimal < 0.75);
    $starsEmpty=5 - $starsFull - ($hasHalf ? 1 : 0);
    $categoryName=$product->category?->name;
    $categorySlug = $product->category?->slug;
    $overviewText = trim((string) ($product->description ?? ''));
    if ($overviewText === '') {
    $overviewText = 'لا يوجد وصف متاح حالياً لهذا المنتج';
    }
    $seller = $product->addedBy ?? null;
    $sellerBrand = $seller?->brand_name ?: ($seller ? trim(($seller->first_name ?? '') . ' ' . ($seller->last_name ?? '')) : 'غير معروف');
    // محاولة الحصول على رقم البائع من أي حقل متاح
    $sellerPhone = null;
    if ($seller) {
        if (!empty(trim($seller->brand_phone ?? ''))) {
            $sellerPhone = trim($seller->brand_phone);
        } elseif (!empty(trim($seller->phone ?? ''))) {
            $sellerPhone = trim($seller->phone);
        } elseif (!empty(trim($seller->mobile ?? ''))) {
            $sellerPhone = trim($seller->mobile);
        }
    }
    $isFavorited = $isFavorited ?? false;
    $favoriteId = $favoriteId ?? null;
    @endphp
    @if ($product)
    <main class="item"
          data-product-images="{{ json_encode(array_values($images->toArray())) }}"
          data-primary-index="{{ $product->primary_image_index ?? 0 }}">
      <section class="container-item">
        <div class="imgs">
          <div class="slider-item">
            <div class="zoom-container" id="mainImageContainer">
              <img id="mainImage" src="{{ $mainImg ? asset($mainImg) : asset('Arbeto/images/placeholder.png') }}" alt="{{ $product->name }}" />
            </div>
            <div class="btn">
              <button
                class="favorite{{ $isFavorited ? ' active' : '' }}"
                data-product-id="{{ $product->id }}"
                data-favorite-id="{{ $favoriteId ?? '' }}">
                <i class="bi {{ $isFavorited ? 'bi-heart-fill' : 'bi-heart' }}"></i>
              </button>
            </div>
          </div>
          <div class="thumbnails-wrapper">
            <button class="thumb-nav-btn prev"><i class="bi bi-chevron-left"></i></button>
            <div class="select-item" id="thumbnailStrip">
              @if($images->count() > 0)
              @php
                $primaryIndex = $product->primary_image_index ?? 0;
                $primaryIndex = $primaryIndex < $images->count() ? $primaryIndex : 0;
              @endphp
              @foreach($images as $idx => $imgPath)
              <img src="{{ asset($imgPath) }}" alt="{{ $product->name }}" class="{{ $idx === $primaryIndex ? 'active' : '' }}" />
              @endforeach
              @else
              <img src="{{ asset('Arbeto/images/placeholder.png') }}" alt="{{ $product->name }}" class="active" />
              @endif
            </div>
            <button class="thumb-nav-btn next"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>

        <div class="details">
          @if($categoryName)
          <a href="{{ $categorySlug ? route('category.show', $categorySlug) : '#' }}" class="category-item">قسم {{ $categoryName }}</a>
          @else
          <a href="#" class="category-item">قسم غير محدد</a>
          @endif

          <div class="title">{{ $product->name }}</div>

          <div class="stars">
            <button
              type="button"
              id="reviewsCountTrigger"
              class="reviews-trigger"
              data-reviews-count="{{ $revCount }}"
              @if($revCount < 1) disabled @endif>
              <span>{{ $revCount }}</span>
              تقييمات
            </button>
            <span>
              @for($s = 1; $s <= 5; $s++)
                @if($s <=$starsFull)
                <i class="bi bi-star-fill s{{ 6 - $s }}"></i>
                @elseif($s === $starsFull + 1 && $hasHalf)
                <i class="bi bi-star-half s{{ 6 - $s }}"></i>
                @else
                <i class="bi bi-star s{{ 6 - $s }}"></i>
                @endif
                @endfor
                {{ $avgRating > 0 ? $avgRating : '-' }}
            </span>
          </div>

          <div class="price">
            @if($discount > 0)
            <div>
              <span class="discount">
                %{{ rtrim(rtrim(number_format($discount, 2, '.', ''), '0'), '.') }}
                <p>خصم</p>
              </span>
              <span class="last-price">
                {{ $oldPrice }}
                <p>جنية</p>
              </span>
            </div>
            @endif
            <span class="now-price">
              <h3>{{ rtrim(rtrim(number_format($priceSell, 2, '.', ''), '0'), '.') }}</h3>
              <p>جنية</p>
            </span>
          </div>

          <div class="divaider-content"></div>

          @if($product->optionGroups && $product->optionGroups->count() > 0)
          <div class="options-item">
            @foreach($product->optionGroups as $group)
            @php
            $groupTitle = mb_strtolower((string) ($group->title ?? ''));
            $isSizeGroup = str_contains($groupTitle, 'مقاس') || str_contains($groupTitle, 'size');
            @endphp
            <span>{{ $group->title }}</span>
            <div class="second-option">
              @forelse($group->options as $option)
              @php
                $optionImages = $option->images ?? [];
                $optionPrimaryImage = $option->getPrimaryImage();
              @endphp
              <div
                class="btn-dev {{ $isSizeGroup ? 'size-btn' : 'opt-btn' }}"
                data-option-id="{{ $option->id }}"
                data-price="{{ $option->custom_price }}"
                data-qty="{{ $option->quantity }}"
                data-has-images="{{ !empty($optionImages) ? 'true' : 'false' }}"
                data-option-images="{{ !empty($optionImages) ? json_encode(array_values($optionImages)) : '' }}"
                data-primary-image="{{ $optionPrimaryImage ?: '' }}">
                {{ $option->name }}
              </div>
              @empty
              <div class="btn-dev {{ $isSizeGroup ? 'size-btn' : 'opt-btn' }}">غير متوفر</div>
              @endforelse
            </div>
            @endforeach
          </div>
          @endif
        </div>

        <div class="add-bag-item">
          <div class="seller">
            <span>
              : البائع
              <span class="seller-badge">
                <small>الرسمي</small>
                <i class="bi bi-patch-check-fill"></i>
                {{ $sellerBrand }}
              </span>
            </span>



            @php
              $hasPhone = false;
              $phoneDisplay = '';

              // قائمة الحقول المحتملة لأرقام البائع
              $phoneFields = ['brand_phone'];
              $addedPhones = []; // لتجنب تكرار نفس الرقم

              if($seller) {
                foreach($phoneFields as $field) {
                  $phoneValue = trim($seller->$field ?? '');
                  if(!empty($phoneValue) && !in_array($phoneValue, $addedPhones)) {
              
                    $phoneDisplay .= '<a href="tel:' . $phoneValue . '"><i class="bi bi-telephone-fill"></i> ' . $phoneValue . '</a>';
                    $addedPhones[] = $phoneValue;
                    $hasPhone = true;
                  }
                }
              }
            @endphp

            @if($hasPhone)
            <span>
              : التواصل مع البائع
              {!! $phoneDisplay !!}
            </span>
            @endif
          </div>

          <div class="divaider"></div>

          <div class="delivery">
            <span class="bi bi-truck">توصيل سريع وآمن من الصدمات</span>
            <span class="bi bi-clipboard2-check">ضمان على المنتج</span>
            <span class="bi bi-arrow-counterclockwise">استرجاع آمن للمنتج في حالة وجود عيب او مشكلة صناعية</span>
            <span class="bi bi-cash">طرق دفع آمنه</span>
          </div>

          <div class="divaider"></div>

          <div class="btn">
            <button class="add" data-product-id="{{ $product->id }}">إضافـــة للحقيبـــة</button>
            <button class="buy-now" data-product-id="{{ $product->id }}">اشتر الآن</button>
          </div>
        </div>
      </section>

      <div class="divaider-content"></div>

      <div class="details-more-item">
        <div class="container-details">
          <div class="container-dev-btn">
            <div class="btn-dev tab-btn active" data-tab="overview">نظرة عامة على المنتج</div>
            <span style="border: 1px solid #41644191;height:30px;margin: -25px;"></span>
            <div class="btn-dev tab-btn" data-tab="specs">المواصفات</div>
            <span style="border: 1px solid #41644191;height:30px;margin: -25px;"></span>
            <div class="btn-dev tab-btn" data-tab="reviews">مراجعات المنتج</div>
          </div>

          <div class="det">
            <div class="tab-content active" data-content="overview">
              <p>{{ $overviewText }}</p>
            </div>

            <div class="tab-content" data-content="specs">
              <table class="specs-table">
                @php
                $hasSpecsRows = false;
                @endphp

                @foreach($product->specs as $spec)
                @php
                $title = trim((string) ($spec->title ?? ''));
                $value = trim((string) ($spec->value ?? ''));
                @endphp
                @if($title !== '' || $value !== '')
                @php $hasSpecsRows = true; @endphp
                <tr>
                  <td class="spec-value">{{ $value !== '' ? $value : '-' }}</td>
                  <td class="spec-header">{{ $title !== '' ? $title : 'تفاصيل' }}</td>
                </tr>
                @endif
                @endforeach

                @if(!$hasSpecsRows)
                <tr>
                  <td colspan="2" style="text-align:center;color:#848570;padding:20px;">لا توجد مواصفات متاحة حالياً</td>
                </tr>
                @endif
              </table>
            </div>

            <div class="tab-content" data-content="reviews">
              <div class="reviews-header">
                <h3>جميع المراجعات</h3>
                <div class="reviews-summary">
                  <div class="stars">
                    @for($s = 1; $s <= 5; $s++)
                      @if($s <=$starsFull)
                      <i class="bi bi-star-fill"></i>
                      @elseif($s === $starsFull + 1 && $hasHalf)
                      <i class="bi bi-star-half"></i>
                      @else
                      <i class="bi bi-star"></i>
                      @endif
                      @endfor
                  </div>
                  <span class="review-count">({{ $revCount }} مراجعات)</span>
                </div>
              </div>

              <div class="reviews-list">
                @forelse($product->reviews->sortByDesc('id') as $review)
                @php
                $firstInitial = mb_substr((string) ($review->user?->first_name ?? 'م'), 0, 1);
                $reviewImages = is_array($review->images) ? $review->images : [];
                $reviewRating = (int) ($review->rating ?? 0);
                @endphp
                <div class="review-card">
                  <div class="review-header">
                    <div class="user-info" style="justify-content: flex-start;">
                      <div
                        class="user-avatar"
                        style="width:42px;height:42px;border-radius:50%;background:#dee0bd;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:18px;color:#2c4b2c;">
                        {{ $firstInitial }}
                      </div>
                      <div class="user-details">
                        <h4 class="user-name">{{ trim((string) (($review->user?->first_name ?? '') . ' ' . ($review->user?->last_name ?? ''))) ?: 'مستخدم' }}</h4>
                        <div class="review-stars">
                          @for($s = 1; $s <= 5; $s++)
                            <i class="bi {{ $s <= $reviewRating ? 'bi-star-fill' : 'bi-star' }}"></i>
                            @endfor
                        </div>
                      </div>
                    </div>
                  </div>
                  <h5 class="review-title">تقييم المنتج</h5>
                  <p class="review-description">{{ trim((string) ($review->review ?? '')) !== '' ? $review->review : 'بدون تعليق' }}</p>

                  @if(!empty($reviewImages))
                  <div class="review-images">
                    @foreach($reviewImages as $reviewImg)
                    <img src="{{ asset($reviewImg) }}" alt="صورة المراجعة">
                    @endforeach
                  </div>
                  @endif
                </div>
                @empty
                <p style="text-align:center;color:#848570;padding:20px;">لا توجد مراجعات بعد</p>
                @endforelse
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    @endif

    <div id="imageModal" class="image-modal">
      <span class="close-modal">&times;</span>
      <img class="modal-content" id="modalImage">
      <div class="modal-nav">
        <button class="modal-prev"><i class="bi bi-chevron-left"></i></button>
        <button class="modal-next"><i class="bi bi-chevron-right"></i></button>
      </div>
    </div>

    @include('website.includ.footer')
    <script src="{{asset('Arbeto/js/tabs.js')}}"></script>
    <script src="{{asset('Arbeto/js/product-page.js')}}"></script>

    <script>
    // البحث عن رقم البائع وعرضه إذا كان "غير متاح"
    document.addEventListener('DOMContentLoaded', function() {
        const sellerValueEl = document.querySelector('.seller-value');
        if (sellerValueEl && sellerValueEl.textContent.trim() === 'غير متاح') {
            // بيانات البائع من السيرفر
            @if($seller)
            const sellerData = {
                brand_phone: "{{ $seller->brand_phone ?? '' }}",
                phone: "{{ $seller->phone ?? '' }}",
                mobile: "{{ $seller->mobile ?? '' }}",
                whatsapp: "{{ $seller->whatsapp ?? '' }}",
                telephone: "{{ $seller->telephone ?? '' }}",
                contact_number: "{{ $seller->contact_number ?? '' }}"
            };

            // البحث عن أول رقم متاح
            let foundPhone = '';
            for (let field in sellerData) {
                const value = sellerData[field].trim();
                if (value && value !== '' && value !== 'null') {
                    foundPhone = value;
                    break;
                }
            }

            // إذا وُجد رقم، عرضه
            if (foundPhone) {
                sellerValueEl.textContent = foundPhone;
                sellerValueEl.style.color = '#2c4b2c';
                sellerValueEl.style.fontWeight = '600';

                // إضافة رابط للاتصال
                const phoneLink = document.createElement('a');
                phoneLink.href = 'tel:' + foundPhone;
                phoneLink.innerHTML = '<i class="bi bi-telephone-fill" style="margin-left: 5px;"></i>';
                phoneLink.style.color = '#416441';
                phoneLink.style.textDecoration = 'none';
                sellerValueEl.appendChild(phoneLink);
            }
            @endif
        }
    });
    </script>

</body>

</html>