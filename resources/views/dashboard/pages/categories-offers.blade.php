@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/categories-offers.css')}}">

</head>

<body>
    @include('dashboard.include.sidebar')

    <!-- سلايد -->
    <div class="dashboard-container">
        <div class="sliders-added">
            <h2 class="section-title">إدارة صور السلايدر</h2>
            <div class="slider-upload-section">
                <div class="upload-controls">
                    <input type="file" id="sliderImageInput" accept="image/*" style="display: none;">
                    <button class="btn-upload" onclick="document.getElementById('sliderImageInput').click()">
                        <span class="bi bi-cloud-upload"></span>
                        إضافة صورة سلايدر
                    </button>
                    <input type="text" id="sliderLinkInput" class="link-input" placeholder="رابط التحويل (اختياري)">
                    <button class="btn-add-slider" id="addSliderBtn">
                        <span class="bi bi-plus-circle"></span>
                        إضافة
                    </button>
                    <div id="sliderAddPreviewContainer" class="slider-add-preview" style="display: none;">
                        <img id="sliderAddPreview" src="" alt="Preview">
                        <button type="button" class="btn-cancel-preview" id="cancelSliderPreview">&times;</button>
                    </div>
                </div>
            </div>
            <div class="sliders-preview" id="slidersPreview">
                <!-- Slider cards will be added here dynamically -->
            </div>
        </div>

        <div class="offer-page">
            <h2 class="section-title">إنشاء صفحة عروض جديدة</h2>
            <div class="offer-form">
                <div class="form-group">
                    <label>صورة العرض</label>
                    <div class="image-upload-area" id="offerImageArea">
                        <input type="file" id="offerImageInput" accept="image/*" style="display: none;">
                        <div class="upload-placeholder" onclick="document.getElementById('offerImageInput').click()">
                            <span class="bi bi-image"></span>
                            <p>اضغط لرفع صورة العرض</p>
                        </div>
                        <img id="offerImagePreview" class="image-preview" style="display: none;">
                    </div>
                </div>

                <div class="form-gr">
                    <div class="form-group">
                        <label>عنوان العرض</label>
                        <input type="text" id="offerTitle" class="form-input" placeholder="أدخل عنوان العرض">
                    </div>

                    <div class="form-group">
                        <label>وصف مختصر للعرض</label>
                        <input type="text" id="offerDescription" class="form-input" placeholder="أدخل وصفاً مختصراً للعرض">
                    </div>

                    <div class="form-group">
                        <label>رابط الصفحة</label>
                        <div class="url-builder">
                            <span class="url-prefix">arbeto.net/</span>
                            <input type="text" id="offerUrlPath" class="url-input" placeholder="اكتب رابط الصفحة">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>اسم زر التنقل</label>
                        <input type="text" id="offerBtnText" class="form-input" value="ابدأ الان" placeholder="اسم زر التنقل">
                    </div>
                </div>



                <div class="form-group">
                    <label>مواقع العرض</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" id="header" value="header">
                            <span class="checkbox-label">الهيدر (header)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="navbar" value="navbar">
                            <span class="checkbox-label">الناف بار (navbar)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="footer" value="footer">
                            <span class="checkbox-label">الفوتر (footer)</span>
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="home" value="home">
                            <span class="checkbox-label">الرئيسية (home)</span>
                        </label>
                    </div>
                </div>

                <button class="btn-add-products" id="openProductModalBtn">
                    <span class="bi bi-bag-plus"></span>
                    إضافة منتجات إلى العرض
                </button>

                <div class="selected-products" id="selectedProducts">
                    <!-- Selected products will appear here -->
                </div>

                <button class="btn-submit-offer" id="submitOfferBtn">
                    <span class="bi bi-check-circle"></span>
                    حفظ العرض
                </button>
            </div>

            <!-- Available Offers Section -->
            <div class="available-offers-section">
                <h3 class="subsection-title">العروض المتاحة حاليًا</h3>
                <div class="offers-grid" id="offersGrid">
                    <!-- Offer cards will appear here -->
                </div>
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
                    <input type="text" id="productSearch" class="search-input" placeholder="ابحث عن المنتجات...">
                </div>
                <div class="products-grid" id="productsGrid">
                    <!-- Products will be loaded here dynamically -->
                </div>
            </div>
        </div>
    </div>

    @include('dashboard.include.toast')
    <script>
        window.allProducts = @json($products);
        window.initialOffers = @json($offers);
    </script>
    <script src="{{asset('arbeto_dashboard/js/categories-offers.js')}}"></script>
    @include('dashboard.include.footer')