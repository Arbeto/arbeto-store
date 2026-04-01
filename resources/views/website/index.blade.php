@include('website.includ.head')
</head>

<body>
  @include('website.includ.bars')
  <!-- سلايدر -->
  <div class="slider-container">
    <div class="slider-track">
      @foreach ($sliders as $index => $slider)
      <div class="slide {{ $index == 0 ? 'active' : '' }}">
        <img src="{{ asset($slider->img) }}" alt="Slide {{ $index + 1 }}" />
      </div>
      @endforeach
    </div>
    <div class="slider-dots">
      @foreach ($sliders as $index => $slider)
      <span class="dot {{ $index == 0 ? 'active' : '' }}" data-slide="{{ $index }}"></span>
      @endforeach
    </div>
  </div>
  </header>

  <main>

    <!-- الاقسام الخاصة -->
    <section class="container_offers">

      @foreach($offers as $offer)
      <div class="made-gift">
        <img src="{{asset($offer->img)}}" alt="" />
        <div class="content-card">
          <span style="color: #ffffff" class="title">{{ $offer->title }}</span>
          <span style="color: #ffffff" class="desc">{{ $offer->description }}</span>
          <a style="color: #2c4b2c; background: #f4ddb4 " href="{{ route('offer.show', $offer->slug) }}">{{ $offer->btn_text }}</a>
        </div>
      </div>
      @endforeach

      <!-- @if($fixedOffer)
      <div class="made-gift">
        <img src="{{asset($fixedOffer->img ?? 'Arbeto/images/make-gift.png')}}" alt="" />
        <div class="content-card">
          <span class="title">{{ $fixedOffer->title }}</span>
          <span class="desc">{{ $fixedOffer->description ?: 'اختر هديتك بلمساتك الخاصة' }}</span>
          <a href="{{ route('offer.show', $fixedOffer->slug) }}">{{ $fixedOffer->btn_text ?: 'ابدأ الآن' }}</a>
        </div>
      </div>
      @endif -->
    
    </section>

    <!-- الأقسام -->
    @if($categories->count() > 0)
    <section class="category">
      <h3>الأقســـــــــــــــام</h3>

      <div class="container">
        @foreach($categories as $category)
        <a href="{{ route('category.show', $category->slug) }}" class="single-cat">
          <img src="{{asset($category->img)}}" alt="" />
          <p>{{$category->name}}</p>
        </a>
        @endforeach
      </div>
    </section>
    @endif

    <!-- أحدث المنتجات -->
     @if($products->count() > 0)
    <section class="last-product">
      <h3>أحدث المنتجات</h3>

      <div class="container-product">
        @foreach($products as $product)
        @php
        // Active image: Use primary image method from model
        $activeImg = $product->getPrimaryImage();

        // Pricing
        $priceSell = $product->price_sell;
        $discount = $product->discount ?? 0;
        $oldPrice = $discount > 0 ? round($priceSell / (1 - $discount / 100)) : null;
        $finalPrice = $priceSell;

        // Rating
        $avgRating = round($product->reviews_avg_rating ?? 0, 1);
        $count = $product->reviews_count ?? 0;
        if ($avgRating >= 4.5) {
        $starClass = 'bi-star-fill';
        } elseif ($avgRating >= 3.8) {
        $starClass = 'bi-star-half'; // ثلاث ارباع → نصف (Bootstrap Icons)
        } elseif ($avgRating >= 2.1) {
        $starClass = 'bi-star-half';
        } elseif ($avgRating >= 0.1) {
        $starClass = 'bi-star'; // ربع → فارغة تقريباً
        } else {
        $starClass = 'bi-star';
        }

        // Suggested product (array → first item)
        $suggested = is_array($product->suggested_product) ? ($product->suggested_product[0] ?? null) : $product->suggested_product;
        @endphp
        <!-- المنتج -->
        <div class="card-product" data-product-id="{{ $product->id }}">
          <a href="{{route('product.show', $product->id)}}" class="card-img">
            @if($activeImg)
            <img src="{{ asset($activeImg) }}" alt="{{ $product->name }}" />
            @else
            <img src="{{ asset('Arbeto/images/placeholder.png') }}" alt="{{ $product->name }}" />
            @endif
          </a>
          <a href="{{route('product.show', $product->id)}}" class="title">
            {{ $product->name }}
          </a>

          <div class="cont-star">
            <div class="star">
              <span>({{ $count }})</span>
              <span>{{ $avgRating > 0 ? $avgRating : '' }}</span>
              <i class="bi {{ $starClass }}"></i>
            </div>
          </div>

          <div class="price">
            @if($discount > 0)
            <div>
              <span class="discount">{{ $discount }}%</span>
              <span class="last-price">جنية {{ $oldPrice }}</span>
            </div>
            @endif
            <span class="now-price">جنية {{ $finalPrice }}</span>
          </div>

          @if($suggested)
          <a class="text-box-page">
            "{{ $suggested }}"
          </a>
          @endif

          <div class="text-qountity">متبقي ( {{ $product->getInventoryQuantity() }} ) قطع فقط</div>

          <div class="add-cart">
            <div class="btns">
              <button class="share"><i class="bi bi-share"></i></button>
              <button class="favorite {{ isset($favoriteMap[$product->id]) ? 'active' : '' }}"
                data-favorite-id="{{ $favoriteMap[$product->id] ?? '' }}">
                <i class="bi {{ isset($favoriteMap[$product->id]) ? 'bi-heart-fill' : 'bi-heart' }}"></i>
              </button>
            </div>
            <button class="add">أضف للحقيبة</button>
          </div>
        </div>
        @endforeach
      </div>
    </section>
    @endif
  </main>

  @include('website.includ.footer')
  <script src="{{asset('Arbeto/js/slider.js')}}"></script>
  <script src="{{asset('Arbeto/js/product-interactions.js')}}"></script>

</body>

</html>