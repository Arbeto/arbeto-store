@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/categories-offers.css')}}">
<style>
    /* Image hover-to-edit overlay */
    .img-hover-wrapper {
        position: relative;
        cursor: pointer;
        border-radius: 10px;
        overflow: hidden;
        display: inline-block;
    }
    .img-hover-wrapper .image-preview {
        display: block;
        max-width: 100%;
        max-height: 220px;
        border-radius: 10px;
        transition: filter .25s;
    }
    .img-hover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.45);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity .25s;
        border-radius: 10px;
        color: #fff;
        gap: 6px;
    }
    .img-hover-overlay .bi { font-size: 2rem; }
    .img-hover-overlay p { margin: 0; font-size: 0.95rem; font-weight: 600; }
    .img-hover-wrapper:hover .img-hover-overlay { opacity: 1; }
    .img-hover-wrapper:hover .image-preview { filter: brightness(.65); }
</style>
</head>

<body>
    @include('dashboard.include.sidebar')
    <div class="dashboard-container">
        <div class="offer-page">
            <h2 class="section-title">تعديل العرض</h2>
            <div class="offer-form">
                <div class="form-group">
                    <label>صورة العرض</label>
                    <div class="image-upload-area" id="offerImageArea">
                        <input
                            type="file"
                            id="offerImageInput"
                            accept="image/*"
                            style="display: none" />
                        <div
                            class="upload-placeholder"
                            onclick="document.getElementById('offerImageInput').click()"
                            style="{{ $offer->img ? 'display: none' : 'display: block' }}">
                            <span class="bi bi-image"></span>
                            <p>اضغط لرفع صورة العرض</p>
                        </div>
                        <div class="img-hover-wrapper" id="imgHoverWrapper" style="{{ $offer->img ? 'display: inline-block' : 'display: none' }}" onclick="document.getElementById('offerImageInput').click()">
                            <img id="offerImagePreview" class="image-preview" src="{{ $offer->img ? (str_starts_with($offer->img, 'http') ? $offer->img : '/'.$offer->img) : '' }}" />
                            <div class="img-hover-overlay">
                                <span class="bi bi-pencil-fill"></span>
                                <p>تغيير الصورة</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>عنوان العرض</label>
                    <input
                        type="text"
                        id="offerTitle"
                        class="form-input"
                        placeholder="أدخل عنوان العرض"
                        value="{{ $offer->title }}" />
                </div>

                <div class="form-group">
                    <label>رابط الصفحة</label>
                    <div class="url-builder">
                        <span class="url-prefix">arbeto.net/</span>
                        <input
                            type="text"
                            id="offerUrlPath"
                            class="url-input"
                            placeholder="اكتب رابط الصفحة"
                            value="{{ $offer->slug }}" />
                    </div>
                </div>

                <div class="form-group">
                    <label>مواقع العرض</label>
                    @php
                    $locations = explode(',', $offer->location);
                    @endphp
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" id="header" value="header" {{ in_array('header', $locations) ? 'checked' : '' }} />
                            <span class="checkbox-label">الهيدر (header)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="navbar" value="navbar" {{ in_array('navbar', $locations) ? 'checked' : '' }} />
                            <span class="checkbox-label">الناف بار (navbar)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="footer" value="footer" {{ in_array('footer', $locations) ? 'checked' : '' }} />
                            <span class="checkbox-label">الفوتر (footer)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="home" value="home" {{ in_array('home', $locations) ? 'checked' : '' }} />
                            <span class="checkbox-label">الرئيسية (home)</span>
                        </label> </label>
                    </div>
                </div>

                <button class="btn-add-products" id="openProductModalBtn">
                    <span class="bi bi-bag-plus"></span>
                    إضافة منتجات إلى العرض
                </button>

                <div class="selected-products" id="selectedProducts">
                    <!-- Selected products will appear here -->
                </div>

                <button class="btn-submit-offer" id="updateOfferBtn">
                    <span class="bi bi-arrow-repeat"></span>
                    تحديث العرض
                </button>

                <button class="btn-delete-offer" id="deleteOfferBtn">
                    <span class="bi bi-trash"></span>
                    حذف العرض
                </button>
            </div>
        </div>
    </div>

    <!-- Product Selection Modal -->
    <div class="modal-overlay" id="productModal">
        <div class="modal-container">
            <div class="modal-header">
                <h3>إضافة منتجات إلى العرض</h3>
                <button class="btn-close-modal" id="closeModalBtn">
                    <span class="bi bi-x-lg"></span>
                </button>
            </div>
            <div class="modal-body">
                <div class="search-container">
                    <span class="bi bi-search search-icon"></span>
                    <input
                        type="text"
                        id="productSearch"
                        class="search-input"
                        placeholder="ابحث عن المنتجات..." />
                </div>
                <div class="products-grid" id="productsGrid">
                    <!-- Products will be loaded here dynamically -->
                </div>
            </div>
        </div>
    </div>


    @include('dashboard.include.toast')
    <script>
        window.currentOffer = @json($offer);
        window.allProducts = @json($products);
    </script>
    <script src="{{asset('arbeto_dashboard/js/edit-offer.js')}}"></script>
    @include('dashboard.include.footer')