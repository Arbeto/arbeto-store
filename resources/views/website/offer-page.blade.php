@include('website.includ.head')
</head>

<body>
    @include('website.includ.bars')
    <main>
        <!-- أحدث المنتجات -->
        <section class="last-product" style="margin-top: 0">
            <h3 style="font-size: 35px">{{ $offerPage->title }}</h3>

            <div class="container-product">
                @foreach($products as $product)
                @php
                // Active image: img is a flat string array, first is the main image
                $images = $product->img ?? [];
                $activeImg = is_array($images) && count($images) > 0 ? $images[0] : null;

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
    </main>


    @include('website.includ.footer')
    <script src="{{asset('Arbeto/js/slider.js')}}"></script>
    <script src="{{asset('Arbeto/js/product-interactions.js')}}"></script>

</body>

</html>
