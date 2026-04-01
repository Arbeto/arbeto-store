@include('website.includ.head')

</head>
<body>
    @include('website.includ.bars')
    @include('website.includ.navbar')
    </header>

    <main style="min-height:60vh; padding: 30px 0;">
        <section class="last-product" style="padding: 20px 40px;">
            <h3 id="searchResultHeading" style="text-align:right; color:#2c4b2c; margin-bottom:24px; font-size:1.3rem;">
                @if($q)
                    جاري البحث عن: &laquo;{{ $q }}&raquo;
                @else
                    ابحث عن منتج
                @endif
            </h3>
            <div class="container-product" id="searchResultsGrid">
                <div id="searchLoadingSpinner" style="width:100%; text-align:center; padding:40px 0; display:none;">
                    <i class="bi bi-arrow-repeat" style="font-size:2rem; color:#2c4b2c; animation: spin 1s linear infinite;"></i>
                    <p style="color:#2c4b2c; margin-top:8px;">جاري التحميل...</p>
                </div>
                <div id="searchEmptyMsg" style="width:100%; text-align:center; padding:60px 0; display:none;">
                    <i class="bi bi-search" style="font-size:3rem; color:#ccc;"></i>
                    <p style="color:#888; margin-top:12px; font-size:1.1rem;">لا توجد نتائج مطابقة</p>
                </div>
            </div>
        </section>
    </main>

    @include('website.includ.footer')
    <script src="{{ asset('Arbeto/js/slider.js') }}"></script>
    <script src="{{ asset('Arbeto/js/product-interactions.js') }}"></script>
    <script src="{{ asset('Arbeto/js/search.js') }}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const q = @json($q);
            if (q && q.trim()) {
                runSearchPage(q.trim());
            } else {
                document.getElementById('searchResultHeading').textContent = 'ابحث عن منتج';
            }
        });
    </script>
    <style>
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</body>
</html>
