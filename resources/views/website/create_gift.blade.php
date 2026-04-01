@include('website.includ.head')
<link rel="stylesheet" href="{{asset('Arbeto/css/create-gift.css')}}" />

</head>

<body>
  @include('website.includ.bars')
  @include('website.includ.navbar')
  </header>

  <!-- زر فتح القائمة للجوال -->
  <button class="mobile-menu-toggle" id="mobileMenuToggle">
    <i class="bi bi-list"></i>
  </button>
  <div class="menu-hint" id="menuHint">اضغط على القائمة لإضافة المنتجات</div>

  <!-- اصنع هديتك -->
  <main class="create-box">
    <!-- قائمة الجوال -->
    <div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>
    <div class="mobile-menu-container" id="mobileMenuContainer">
      <button class="mobile-menu-close" id="mobileMenuClose">
        <i class="bi bi-x"></i>
      </button>

      <!-- الجزء الأيمن -->
      <section class="rt-side">
        <p class="title-boxrt">أضف المنتجات الى الصندوق لصنع هديتك الخاصة</p>
        <br />
        <p class="title-boxrt2"></p>
        <div class="search">
          <input type="search" placeholder="إبحث للوصول للمنتجات" />
          <span class="bi bi-search"></span>
        </div>

        <span class="signature-title">بوكسات جاهزة</span>
        <div class="signature-box">
          <button id="ramadanBoxBtn">بوكس رمضاني</button>
          <button id="motherDayBoxBtn">بوكس عيد الأم</button>
          <button class="custom-box" id="openCustomModal">تخصيص</button>
        </div>

        <!-- المنتجات -->
        <div class="product-box" id="productsGrid">
          <!-- المنتج -->
          <div class="product" data-price="250" data-categories="فاخر,ام,حب">
            <a href="item.html">
              <img src="../images\bag-product.jpg" alt="" />
            </a>
            <div class="content">
              <div class="text">
                <a href="item.html" class="title"> شنطة جلدية فاخرة </a>
                <span class="subtitle">
                  شنطة نسائية من الجلد الطبيعي باللونين الاسود والبني
                </span>
              </div>
              <div class="add-num">
                <button class="add">أضف للبوكس</button>
              </div>
            </div>
          </div>
          <!-- /المنتج -->
          <!-- منتج إضافي للتجربة -->
          <div class="product" data-price="450" data-categories="فاخر,صداقة">
            <img src="../images\bag-product.jpg" alt="" />
            <div class="content">
              <div class="text">
                <span class="title"> ساعة يد راقية </span>
                <span class="subtitle"> ساعة يد كلاسيكية بسوار جلدي </span>
              </div>
              <div class="add-num">
                <button class="add">أضف للبوكس</button>
              </div>
            </div>
          </div>
          <!-- /منتج إضافي -->
        </div>
        <!-- /المنتجات -->
      </section>

      <!-- الجزء الأيسر -->
      <section class="lt-side">
        <p class="title-boxrt">منتجات خاصة فقط بتزيين البوكس</p>
        <br />
        <p class="title-boxrt2">
          (لا يتم احتساب عددها من اجمالي سعة البوكس يمكنك اضافة الا مالا نهاية
          منها)
        </p>
        <!-- المنتجات -->
        <div
          class="product-box"
          style="gap: 10px; display: flex; flex-direction: column">
          <!-- المنتج -->
          <div
            class="product"
            data-decoration="true"
            data-price="10"
            id="specialMessageItem">
            <img src="../images\papper.png" alt="" />
            <div class="content">
              <div class="text">
                <span class="title"> رسالة مميزة </span>
                <span class="subtitle"> كتابة رسالة مميزة داخل البوكس </span>
              </div>
              <div class="add-num">
                <button class="add message-btn">كتابة رسالة</button>
              </div>
            </div>
          </div>
          <!-- /المنتج -->
          <!-- المنتج -->
          <div class="product" data-decoration="true" data-price="15">
            <img src="../images\fly.png" alt="" />
            <div class="content">
              <div class="text">
                <span class="title"> فراشات مميزة </span>
                <span class="subtitle">
                  فراشات مميزة خاصة بتزيين البوكس
                </span>
              </div>
              <div class="add-num">
                <button class="add">أضف للبوكس</button>
              </div>
            </div>
          </div>
          <!-- /المنتج -->
        </div>
        <!-- /المنتجات -->
      </section>
    </div>
    <!-- /قائمة الجوال -->

    <!-- البوكس التفاعلي -->
    <section class="box-space">
      <div class="container">
        <div class="products-section" style="margin: auto">
          <!-- قسم العلبة -->
          <section class="box-space">
            <h2><i class="fas fa-box"></i> الصندوق التفاعلي</h2>

            <div class="size">
              <button id="small-btn">S (صغير)</button>
              <button id="medium-btn" class="active">M (متوسط)</button>
              <button id="large-btn">L (كبير)</button>
            </div>

            <div class="content-box">
              <div class="box-section">
                <div class="box-container">
                  <div class="open-box medium" id="openBox">
                    <!-- الجوانب -->
                    <div class="box-side left"></div>
                    <div class="box-side right"></div>
                    <div class="box-side back"></div>
                    <div class="box-side front"></div>

                    <!-- القاعدة -->
                    <div class="box-base">
                      <div class="box-content" id="boxContent">
                        <!-- العناصر ستضاف هنا عند النقر على "أضف للعلبة" -->
                      </div>
                    </div>

                    <!-- الغطاء -->
                    <div class="box-lid">
                      <div class="lid-side front"></div>
                      <div class="lid-side back"></div>
                      <div class="lid-side left"></div>
                      <div class="lid-side right"></div>
                    </div>

                    <!-- الشريط العمودي -->
                    <div class="box-ribbon vertical"></div>

                    <!-- الشريط الأفقي -->
                    <div class="box-ribbon horizontal"></div>

                    <!-- العقدة/الفيونكة -->
                    <div class="ribbon-bow">
                      <div class="ribbon-bow-center"></div>
                    </div>
                  </div>
                </div>

                <p id="box-price-note"></p>
                <p id="size-description" style="display: none"></p>

                <div class="capacity" style="text-align: center">
                  <p id="capacityInfo">السعة: 0/10 عناصر</p>
                </div>

                <div class="add-cart" style="margin-top: 15px">
                  <button class="add">
                    <i class="bi bi-bag"></i>
                    أضف البوكس لحقيبة التسوق
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- شريط الإجمالي -->
        <div class="summary-bar">
          <div class="summary-info">
            <div class="summary-title">ملخص الطلب</div>
            <div class="summary-details">
              <div class="item-count-box">
                عدد العناصر: <span id="totalItemsCount">0</span>
              </div>
              <div>
                عدد المنتجات المختلفة: <span id="uniqueProductsCount">0</span>
              </div>
            </div>
          </div>
          <div class="total-price">
            الإجمالي: <span id="totalPrice">0</span> جنية
          </div>
        </div>

        <!-- رسالة تنبيه -->
        <div class="alert-message" id="alertMessage">
          <i class="fas fa-check-circle"></i>
          <span id="alertText">تمت الإضافة بنجاح</span>
        </div>
      </div>
    </section>
  </main>
  <!-- /اصنع هديتك -->
  <!-- مودل كتابة الرسالة -->
  <div class="modal-overlay" id="messageModalOverlay">
    <div class="message-modal">
      <button class="close-modal" id="closeMessageModal">&times;</button>
      <p class="modal-label">اكتب ما تفكر به لإرسالة</p>
      <textarea
        id="messageTextArea"
        placeholder="اكتب رسالتك هنا..."
        maxlength="120"></textarea>
      <div class="char-count"><span id="currentCharCount">0</span>/120</div>
      <button class="add-to-box-btn modal-add-btn" id="confirmAddMessage">
        أضف للبوكس
      </button>
    </div>
  </div>

  <!-- مودل عرض الرسالة -->
  <div id="messagePreviewModal" class="modal-overlay">
    <div class="modal-content" style="max-width: 600px">
      <button id="closeMessagePreview" class="close-modal">&times;</button>
      <div class="modal-header">
        <h3>محتوى الرسالة</h3>
      </div>
      <div class="modal-body">
        <p
          id="messagePreviewText"
          style="
              margin-top: 15px;
              text-align: center;
              font-size: 24px;
              line-height: 2;
              color: #2c4b2c;
              padding: 30px;
              background: #f8f5da;
              border-radius: 15px;
              min-height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 500;
              letter-spacing: 0.5px;
            "></p>
      </div>
    </div>
  </div>

  <!-- مودل عرض الرسالة -->
  <div id="messagePreviewModal" class="modal-overlay">
    <div class="modal-content" style="max-width: 600px">
      <button id="closeMessagePreview" class="close-modal">&times;</button>
      <div class="modal-header">
        <h3>محتوى الرسالة</h3>
      </div>
      <div class="modal-body">
        <p
          id="messagePreviewText"
          style="
              text-align: center;
              font-size: 24px;
              line-height: 2;
              color: #2c4b2c;
              padding: 30px;
              background: #f8f5da;
              border-radius: 15px;
              min-height: 150px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 500;
              letter-spacing: 0.5px;
            "></p>
      </div>
    </div>
  </div>

  <!-- مودل تخصيص بوكس -->
  <div id="customBoxModal" class="modal-overlay">
    <div class="modal-content custom-modal-content">
      <button id="closeCustomModal" class="close-modal">&times;</button>
      <div class="modal-header">
        <h3>تخصيص هديتك حسب الميزانية</h3>
      </div>
      <div class="modal-body">
        <div class="custom-input-group">
          <label for="budgetInput">حدد ميزانيتك (جنية)</label>
          <input
            type="number"
            id="budgetInput"
            placeholder="مثال: 700"
            min="50" />
        </div>

        <div class="custom-input-group">
          <label>اختر الفئات (بحد أقصى 3)</label>
          <div class="category-grid" id="categoryGrid">
            <label class="category-item">
              <input type="checkbox" value="صداقة" /> <span>صداقة</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="ام" /> <span>أم</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="حب" /> <span>حب</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="رمضاني" /> <span>رمضاني</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="عيد" /> <span>عيد</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="بسيط" /> <span>بسيط</span>
            </label>
            <label class="category-item">
              <input type="checkbox" value="فاخر" /> <span>فاخر</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          id="applyCustomBox"
          class="submit-btn"
          style="
              background-color: #31694e;
              border: none;
              padding: 10px;
              color: #fdfcf4;
              border-radius: 8px;
            ">
          تطبيق التخصيص
        </button>
      </div>
    </div>
  </div>

  <div class="up"><span class="bi bi-arrow-up-short"></span></div>


  <script src="{{asset('Arbeto/js/create-box.js')}}"></script>
  @include('website.includ.footer')

</body>

</html>