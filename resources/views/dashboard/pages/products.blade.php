@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/prooducts.css')}}">

</head>

<body>
  @include('dashboard.include.sidebar')

  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1><i class="bi bi-box-seam"></i> لوحة إدارة المنتجات</h1>
      <p>أضف منتجات جديدة أو قم بتعديل المنتجات الحالية</p>
    </div>

    <div class="toggle-container">
      <button type="button" class="toggle-btn active" data-type="normal">
                <i class="bi bi-box"></i> إضافة بوكس
            </button>
      <button type="button" class="toggle-btn " data-type="box">
        <i class="bi bi-box-fill"></i> إضافة منتج
      </button>
      <button type="button" class="toggle-btn" data-type="new-box">
        <i class="bi bi-layers"></i> إضافة فئة جديدة
      </button>
        @if(auth()->user()?->user_type !== 'trader')
      <button type="button" class="toggle-btn" data-type="discount-code">
        <i class="bi bi-ticket-perforated"></i> إضافة كود خصم جديد
      </button>
        @endif
    </div>

    <!-- زر عرض البيانات الديناميكي -->
    <div id="viewBtnWrapper" style="margin:16px 0;">
      <button id="viewDataBtn" type="button" class="view-data-btn">
        <i class="bi bi-eye"></i> <span id="viewDataBtnLabel">عرض البيانات</span>
      </button>
    </div>

    <div id="formsContainer" class="forms-container">

      <!-- بوكس -->
      <div id="normalForm" class="form-card" >
        <div class="form-header">
          <div class="form-icon">
            <i class="bi bi-box"></i>
          </div>
          <div class="form-title">إضافة بوكس جديد</div>
        </div>

        <form class="compact-form add-new-product">
          <input type="hidden" name="type" value="box">
          <input type="hidden" name="added_by" value="{{ auth()->id() }}">

          <div class="form-group full-width">
            <label class="form-label" for="productName">
              <i class="bi bi-tag"></i> اسم البوكس
            </label>
            <input name="name" type="text" id="productName" class="form-control" placeholder="أدخل اسم البوكس">
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="productDescription">
              <i class="bi bi-text-paragraph"></i> نظرة عامة على البوكس (الوصف)
            </label>
            <textarea name="description" id="productDescription" class="form-control" placeholder="أدخل وصف البوكس"></textarea>
          </div>

          <!-- ربط المنتجات من المخزن (بوكس — متعدد الاختيار) -->
          <div class="form-group full-width">
            <label class="form-label"><i class="bi bi-archive"></i> عناصر المخزن المرتبطة بالبوكس</label>
            <button type="button" class="inv-pick-btn" onclick="openInventoryPicker('multi','normal')">
              <i class="bi bi-plus-circle"></i> اختر منتجات البوكس من المخزن
            </button>
            <div id="normal-inv-tags" class="inv-tags-wrap"></div>
            <input type="hidden" id="normal-inventory_item_ids" name="inventory_item_ids_json" value="[]">
          </div>

          <div class="form-group">
            <label class="form-label" for="productQuantity">
              <i class="bi bi-123"></i> الكمية
            </label>
            <input name="quantity" type="number" id="productQuantity" class="form-control" min="0" value="1">
          </div>

          <div class="price-group">

            <div class="form-group">
              <label class="form-label" for="totalPriceInput">
                <i class="bi bi-calculator"></i> السعر الإجمالي
              </label>
              <input type="number" id="totalPriceInput" class="form-control" step="0.01" readonly>
            </div>


            <div class="form-group">
              <label class="form-label" for="discountInput">
                <i class="bi bi-percent"></i> نسبة الخصم
              </label>
              <input name="discount" type="number" id="discountInput" class="form-control" placeholder="0" value="0" step="1" min="0" max="100">
            </div>

            <div class="form-group">
              <label class="form-label" for="priceInput">
                <i class="bi bi-currency-dollar"></i> سعر البيع
              </label>
              <input name="price_sell" type="number" id="priceInput" class="form-control" step="1" min="0" placeholder="0.00">
            </div>

          </div>

          <div class="image-upload-container" onclick="document.getElementById('productImages').click()">
            <input name="img" type="file" id="productImages" multiple accept="image/*" style="display: none;">
            <div class="upload-label">
              <i class="bi bi-cloud-arrow-up"></i>
              <span>صور المنتج (بحد أقصى 8 صور)</span>
              <small style="color: #8a9a8a; font-size: 12px;">انقر لرفع الصور</small>
            </div>
            <div id="imagePreviewContainer"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sentenceInput">
              <i class="bi bi-chat-text"></i> جمل بطاقة المنتج
            </label>
            <div class="input-with-btn">
              <input name="suggested_product" type="text" id="sentenceInput" class="form-control" placeholder="أدخل جملة لعرضها أسفل السعر">
              <button type="button" id="addSentenceBtn" class="add-small-btn">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div id="sentencePreviewContainer" class="tags-container"></div>
          </div>

          <div class="form-group ">
            <label class="form-label" for="hintInput">
              <i class="bi bi-search"></i> تلميحات البحث
            </label>
            <div class="input-with-btn">
              <input name="suggested_search" type="text" id="hintInput" class="form-control" placeholder="أدخل تلميحاً لتسهيل البحث عن المنتج">
              <button type="button" id="addHintBtn" class="add-small-btn">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div id="hintPreviewContainer" class="tags-container"></div>
          </div>

          <!-- إضافة خيارات -->
          <div class="form-group full-width">
            <div class="extra-section-header">
              <label class="form-label"><i class="bi bi-sliders"></i> إضافة خيارات المنتج</label>
            </div>
            <div id="optionGroupsContainer" class="option-groups-container"></div>
            <button type="button" id="addOptionGroupBtn" class="add-option-group-btn">
              <i class="bi bi-plus-circle"></i> إضافة مجموعة خيارات
            </button>
          </div>

          <!-- المواصفات -->
          <div class="form-group full-width">
            <div class="extra-section-header">
              <label class="form-label"><i class="bi bi-table"></i> المواصفات</label>
            </div>
            <div class="specs-table-wrapper">
              <table class="specs-builder-table">
                <thead>
                  <tr>
                    <th>القيمة / الإجابة</th>
                    <th>العنوان</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody id="specsTableBody"></tbody>
              </table>
            </div>
            <button type="button" id="addSpecRowBtn" class="add-spec-row-btn">
              <i class="bi bi-plus-circle"></i> إضافة صف
            </button>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              <i class="bi bi-check-circle"></i> حفظ المنتج
            </button>
          </div>
        </form>
      </div>

      <!-- نموذج منتج منفرد -->
      <div id="boxForm" class="form-card" style="display: none;">
        <div class="form-header">
          <div class="form-icon">
            <i class="bi bi-box-fill"></i>
          </div>
          <div class="form-title">إضافة منتج</div>
        </div>

        <form class="compact-form add-new-product">
          <input type="hidden" name="type" value="product">
          <input type="hidden" name="added_by" value="{{ auth()->id() }}">
          <div class="form-group">
            <label class="form-label" for="box-typeSelect">
              <i class="bi bi-boxes"></i> نوع المنتج
            </label>
            <select name="type_product" id="box-typeSelect" class="form-control">
              <option value="" disabled selected>اختر النوع</option>
              <option value="normal">عادي</option>
              <option value="decorated">تزيين (خاص بالبوكسات)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="box-productName">
              <i class="bi bi-tag"></i> اسم المنتج
            </label>
            <input name="name" type="text" id="box-productName" class="form-control" placeholder="أدخل اسم المنتج">
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="box-productDescription">
              <i class="bi bi-text-paragraph"></i> الوصف
            </label>
            <textarea name="description" id="box-productDescription" class="form-control" placeholder="أدخل وصف المنتج"></textarea>
          </div>

          <!-- ربط عنصر المخزن (منتج منفرد — اختيار واحد) -->
          <div class="form-group full-width">
            <label class="form-label"><i class="bi bi-archive"></i> ربط بعنصر من المخزن</label>
            <button type="button" class="inv-pick-btn" onclick="openInventoryPicker('single','box')">
              <i class="bi bi-link-45deg"></i> اختر المنتج من المخزن
            </button>
            <div id="box-inv-tags" class="inv-tags-wrap"></div>
            <input type="hidden" id="box-inventory_item_id" name="inventory_item_id" value="">
          </div>

          <div class="form-group">
            <label class="form-label" for="box-productQuantity">
              <i class="bi bi-123"></i> الكمية <small id="box-qty-note" style="color:#888;font-size:11px;"></small>
            </label>
            <input name="quantity" type="number" id="box-productQuantity" class="form-control" min="0" value="1">
          </div>

          <div class="price-group">
            <div class="form-group">
              <label class="form-label" for="box-totalPriceInput">
                <i class="bi bi-calculator"></i> السعر الإجمالي
              </label>
              <input type="number" id="box-totalPriceInput" class="form-control" step="0.01" readonly>
            </div>

            <div class="form-group">
              <label class="form-label" for="box-discountInput">
                <i class="bi bi-percent"></i> نسبة الخصم
              </label>
              <input name="discount" type="number" id="box-discountInput" class="form-control" value="0" step="1" min="0" max="100">
            </div>

            <div class="form-group">
              <label class="form-label" for="box-priceInput">
                <i class="bi bi-currency-dollar"></i> سعر البيع
              </label>
              <input name="price_sell" type="number" id="box-priceInput" class="form-control" step="1" min="0" placeholder="0.00">
            </div>
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="box-categorySelect">
              <i class="bi bi-grid"></i> الفئة
            </label>
            <select name="category_id" id="box-categorySelect" class="form-control">
              <option value="" disabled selected>اختر الفئة</option>
              @foreach ($categories as $category)
              <option value="{{ $category->id }}">{{ $category->name }}</option>
              @endforeach
              @if($categories->isEmpty())
              <option value="" disabled>لا توجد فئات</option>
              @endif
            </select>
          </div>

          <div class="image-upload-container" onclick="document.getElementById('box-productImages').click()">
            <input name="img" type="file" id="box-productImages" multiple accept="image/*" style="display: none;">
            <div class="upload-label">
              <i class="bi bi-cloud-arrow-up"></i>
              <span>صور المنتج (بحد أقصى 8 صور)</span>
              <small style="color: #8a9a8a; font-size: 12px;">انقر لرفع الصور</small>
            </div>
            <div id="box-imagePreviewContainer"></div>
          </div>

          <div class="form-group ">
            <label class="form-label" for="box-sentenceInput">
              <i class="bi bi-chat-text"></i> جمل بطاقة المنتج
            </label>
            <div class="input-with-btn">
              <input name="suggested_product" type="text" id="box-sentenceInput" class="form-control" placeholder="أدخل جملة لعرضها أسفل السعر">
              <button type="button" id="box-addSentenceBtn" class="add-small-btn">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div id="box-sentencePreviewContainer" class="tags-container"></div>
          </div>

          <div class="form-group ">
            <label class="form-label" for="box-hintInput">
              <i class="bi bi-search"></i> تلميحات البحث
            </label>
            <div class="input-with-btn">
              <input name="suggested_search" type="text" id="box-hintInput" class="form-control" placeholder="أدخل تلميحاً لتسهيل البحث عن المنتج">
              <button type="button" id="box-addHintBtn" class="add-small-btn">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div id="box-hintPreviewContainer" class="tags-container"></div>
          </div>

          <!-- إضافة خيارات -->
          <div class="form-group full-width">
            <div class="extra-section-header">
              <label class="form-label"><i class="bi bi-sliders"></i> إضافة خيارات المنتج</label>
            </div>
            <div id="box-optionGroupsContainer" class="option-groups-container"></div>
            <button type="button" id="box-addOptionGroupBtn" class="add-option-group-btn">
              <i class="bi bi-plus-circle"></i> إضافة مجموعة خيارات
            </button>
          </div>

          <!-- المواصفات -->
          <div class="form-group full-width">
            <div class="extra-section-header">
              <label class="form-label"><i class="bi bi-table"></i> المواصفات</label>
            </div>
            <div class="specs-table-wrapper">
              <table class="specs-builder-table">
                <thead>
                  <tr>
                    <th>القيمة / الإجابة</th>
                    <th>العنوان</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody id="box-specsTableBody"></tbody>
              </table>
            </div>
            <button type="button" id="box-addSpecRowBtn" class="add-spec-row-btn">
              <i class="bi bi-plus-circle"></i> إضافة صف
            </button>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              <i class="bi bi-check-circle"></i> حفظ المنتج
            </button>
          </div>
        </form>
      </div>

      <!-- فئه جديدة -->
      <div id="newBoxForm" class="form-card" style="display: none;">
        <div class="form-header">
          <div class="form-icon">
            <i class="bi bi-layers"></i>
          </div>
          <div class="form-title">إضافة فئة جديدة تندرج داخلها المنتجات التابعة لقسمها</div>
        </div>
        <form class="compact-form add-new-product">
          <div class="form-group full-width">
            <label class="form-label" for="new-box-productName">
              <i class="bi bi-tag"></i> اسم الفئة
            </label>
            <input name="name" type="text" id="new-box-productName" class="form-control" placeholder="أدخل اسم الفئة">
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="new-box-slug">
              <i class="bi bi-link-45deg"></i> رابط الصفحة (slug)
            </label>
            <div class="input-with-btn" style="gap:0;flex-direction: row !important;">
              <span style="padding:0 10px;background:#f0ede3;border:1px solid var(--border-color);border-right: none;border-radius: 8px 0 0 8px;line-height:38px;font-size:13px;color:#888;direction: ltr;">category/</span>
              <input name="slug" type="text" id="new-box-slug" class="form-control" placeholder="my-category" style="border-radius: 0 8px 8px 0;direction:ltr;text-align: left;padding: 10px 12px;">
            </div>
            <small style="color:#888;font-size:12px;">يُملأ تلقائياً من الاسم، يمكن تعديله</small>
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="new-box-productDescription">
              <i class="bi bi-text-paragraph"></i> الوصف
            </label>
            <textarea name="description" id="new-box-productDescription" class="form-control" placeholder="أدخل وصف الفئة"></textarea>
          </div>

          <div class="image-upload-container" onclick="document.getElementById('cat-productImage').click()">
            <input name="img" type="file" id="cat-productImage" accept="image/*" style="display: none;">
            <div class="upload-label">
              <i class="bi bi-cloud-arrow-up"></i>
              <span>صورة الفئة</span>
              <small style="color: #8a9a8a; font-size: 12px;">انقر لرفع الصورة</small>
            </div>
            <div id="cat-imagePreviewContainer"></div>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              <i class="bi bi-check-circle"></i> حفظ الفئة
            </button>
          </div>
        </form>
      </div>

      @if(auth()->user()?->user_type !== 'trader')
      <!-- كود خصم جديد -->
      <div id="discountCodeForm" class="form-card" style="display: none;">
        <div class="form-header">
          <div class="form-icon"><i class="bi bi-ticket-perforated"></i></div>
          <div class="form-title">إضافة كود خصم جديد</div>
        </div>
        <form class="compact-form" id="addDiscountCodeForm">
              <div class="form-group full-width">
            <label class="form-label"><i class="bi bi-ticket-perforated"></i> اسم الكود</label>
            <input type="text" id="dc-code" class="form-control" placeholder="مثال: SUMMER20" style="letter-spacing:2px;" />
    
          </div>
          <div class="form-group full-width" style="margin-bottom:0; flex-direction: column-reverse;">
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <button type="button" id="dc-type-percent-btn" onclick="dcSetType('percentage')" style="flex:1;padding:8px 0;border-radius:8px;border:2px solid #596d52;background:#596d52;color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;">
                <i class="bi bi-percent"></i> خصم نسبة مئوية
              </button>
              <button type="button" id="dc-type-fixed-btn" onclick="dcSetType('fixed')" style="flex:1;padding:8px 0;border-radius:8px;border:2px solid #596d52;background:#fff;color:#596d52;font-size:.85rem;font-weight:600;cursor:pointer;">
                <i class="bi bi-cash-coin"></i> خصم مبلغ مالي
              </button>
            </div>
            <input type="hidden" id="dc-type" value="percentage" />
            <div class="form-group" id="dc-percent-wrap">
              <label class="form-label"><i class="bi bi-percent"></i> نسبة الخصم %</label>
              <input type="number" id="dc-discount" class="form-control" min="1" max="100" placeholder="20" />
            </div>
            <div class="form-group" id="dc-amount-wrap" style="display:none;">
              <label class="form-label"><i class="bi bi-cash-coin"></i> مبلغ الخصم (جنيه)</label>
              <input type="number" id="dc-discount-amount" class="form-control" min="1" step="0.01" placeholder="50" />
            </div>
          </div>
          <div class="form-group full-width">
            <label class="form-label"><i class="bi bi-calendar-event"></i> تاريخ الانتهاء</label>
            <div style="display:flex;gap:18px;margin-top:6px;justify-content: flex-end;">
              <label class="dc-radio-label">
                <input type="radio" name="dc-expiry-type" value="permanent" checked onchange="dcToggleDate(this)" />
                <span>دائم</span>
              </label>
              <label class="dc-radio-label">
                <input type="radio" name="dc-expiry-type" value="date" onchange="dcToggleDate(this)" />
                <span>تاريخ محدد</span>
              </label>
            </div>
            <div id="dc-date-wrap" style="display:none;margin-top:10px;justify-content: flex-end;">
              <input type="date" id="dc-expires-at" class="form-control dc-date-input" />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="submit-btn">
              <i class="bi bi-check-circle"></i> حفظ الكود
            </button>
          </div>
        </form>
      </div>
      @endif

    </div><!-- /formsContainer -->

    <!-- ====  قسم عرض البيانات ==== -->
    <div id="dataSection" style="display:none; margin-top:28px;">

      <!-- شبكة العناصر -->
      <div id="itemsGrid" class="items-grid"></div>

      <!-- نموذج التعديل -->
      <div id="editSection" style="display:none;">
        <div class="form-card" id="editFormCard">
          <div class="form-header">
            <div class="form-icon"><i class="bi bi-pencil-square"></i></div>
            <div class="form-title" id="editFormTitle">تعديل العنصر</div>
          </div>
          <form class="compact-form" id="editForm">
            <input type="hidden" id="editItemId">
            <input type="hidden" id="editItemType">

            <!-- حقل نوع المنتج (product فقط) -->
            <div class="form-group edit-field" id="edit-type_product-wrap">
              <label class="form-label"><i class="bi bi-boxes"></i> نوع المنتج</label>
              <select id="edit-type_product" class="form-control">
                <option value="">--</option>
                <option value="normal">عادي</option>
                <option value="decorated">تزيين</option>
              </select>
            </div>

            <div class="form-group full-width edit-field">
              <label class="form-label"><i class="bi bi-tag"></i> الاسم</label>
              <input type="text" id="edit-name" class="form-control">
            </div>

            <div class="form-group full-width edit-field">
              <label class="form-label"><i class="bi bi-text-paragraph"></i> الوصف</label>
              <textarea id="edit-description" class="form-control" rows="3"></textarea>
            </div>

            <!-- ربط المخزن في التعديل -->
            <div class="form-group full-width edit-field product-field" id="edit-inv-wrap">
              <label class="form-label"><i class="bi bi-archive"></i> ربط المخزن</label>
              <button type="button" class="inv-pick-btn" onclick="openInventoryPicker('edit-single','edit')" id="edit-inv-pick-btn-single">
                <i class="bi bi-link-45deg"></i> اختر عنصراً من المخزن (منتج)
              </button>
              <button type="button" class="inv-pick-btn" onclick="openInventoryPicker('edit-multi','edit')" id="edit-inv-pick-btn-multi" style="display:none;">
                <i class="bi bi-plus-circle"></i> اختر عناصر من المخزن (بوكس)
              </button>
              <div id="edit-inv-tags" class="inv-tags-wrap"></div>
              <input type="hidden" id="edit-inventory_item_id" value="">
              <input type="hidden" id="edit-inventory_item_ids" value="[]">
            </div>

            <div class="form-group edit-field product-field">
              <label class="form-label"><i class="bi bi-123"></i> الكمية</label>
              <input type="number" id="edit-quantity" class="form-control" min="0">
            </div>

            <div class="price-group edit-field product-field">
              <div class="form-group">
                <label class="form-label" for="edit-totalPrice">
                  <i class="bi bi-calculator"></i> السعر الإجمالي
                </label>
                <input type="number" id="edit-totalPrice" class="form-control" step="0.01" readonly>
              </div>
              <div class="form-group">
                <label class="form-label"><i class="bi bi-percent"></i> نسبة الخصم</label>
                <input type="number" id="edit-discount" class="form-control" min="0" max="100">
              </div>
              <div class="form-group">
                <label class="form-label"><i class="bi bi-currency-dollar"></i> سعر البيع</label>
                <input type="number" id="edit-price_sell" class="form-control" min="0">
              </div>
            </div>

            <!-- حقل الفئة (product فقط) -->
            <div class="form-group full-width edit-field" id="edit-category-wrap">
              <label class="form-label"><i class="bi bi-grid"></i> الفئة</label>
              <select id="edit-category_id" class="form-control">
                <option value="">اختر الفئة</option>
                @foreach ($categories as $cat)
                <option value="{{ $cat->id }}">{{ $cat->name }}</option>
                @endforeach
              </select>
            </div>

            <!-- معرض صور التعديل -->
            <div class="form-group full-width edit-field">
              <label class="form-label"><i class="bi bi-images"></i> صور المنتج — اضغط على صورة لجعلها الرئيسية</label>
              <div id="edit-imagesGallery" class="edit-images-gallery"></div>
              <div style="margin-top:10px;">
                <div class="image-upload-container" onclick="document.getElementById('edit-img').click()" style="padding:10px;">
                  <input type="file" id="edit-img" accept="image/*" style="display:none;" multiple>
                  <div class="upload-label">
                    <i class="bi bi-cloud-arrow-up"></i>
                    <span style="font-size:13px;">إضافة صورة جديدة (اختياري)</span>
                  </div>
                  <div id="edit-newImgPreview"></div>
                </div>
              </div>
            </div>

            <!-- تلميحات (product/box فقط) -->
            <div class="form-group full-width edit-field product-field">
              <label class="form-label"><i class="bi bi-chat-text"></i> جمل بطاقة المنتج</label>
              <div class="input-with-btn">
                <input type="text" id="edit-sentenceInput" class="form-control" placeholder="أدخل جملة">
                <button type="button" id="edit-addSentenceBtn" class="add-small-btn"><i class="bi bi-plus-lg"></i></button>
              </div>
              <div id="edit-sentenceContainer" class="tags-container"></div>
            </div>

            <div class="form-group full-width edit-field product-field">
              <label class="form-label"><i class="bi bi-search"></i> تلميحات البحث</label>
              <div class="input-with-btn">
                <input type="text" id="edit-hintInput" class="form-control" placeholder="تلميح بحث">
                <button type="button" id="edit-addHintBtn" class="add-small-btn"><i class="bi bi-plus-lg"></i></button>
              </div>
              <div id="edit-hintContainer" class="tags-container"></div>
            </div>

            <!-- تعديل خيارات المنتج -->
            <div class="form-group full-width edit-field product-field">
              <div class="extra-section-header">
                <label class="form-label"><i class="bi bi-sliders"></i> خيارات المنتج</label>
              </div>
              <div id="edit-optionGroupsContainer" class="option-groups-container"></div>
              <button type="button" id="edit-addOptionGroupBtn" class="add-option-group-btn">
                <i class="bi bi-plus-circle"></i> إضافة مجموعة خيارات
              </button>
            </div>

            <!-- تعديل المواصفات -->
            <div class="form-group full-width edit-field product-field">
              <div class="extra-section-header">
                <label class="form-label"><i class="bi bi-table"></i> المواصفات</label>
              </div>
              <div class="specs-table-wrapper">
                <table class="specs-builder-table">
                  <thead>
                    <tr>
                      <th>القيمة / الإجابة</th>
                      <th>العنوان</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="edit-specsTableBody"></tbody>
                </table>
              </div>
              <button type="button" id="edit-addSpecRowBtn" class="add-spec-row-btn">
                <i class="bi bi-plus-circle"></i> إضافة صف
              </button>
            </div>

            <!-- رابط الفئة (للفئات فقط) -->
            <div class="form-group full-width edit-field" id="edit-slug-wrap" style="display:none;">
              <label class="form-label"><i class="bi bi-link-45deg"></i> رابط الصفحة (slug)</label>
              <div class="input-with-btn" style="gap:0;flex-direction: row !important;">
                <span style="padding:0 10px;background:#f0ede3;border:1px solid var(--border-color);border-right: none;border-radius: 8px 0 0 8px;line-height:38px;font-size:13px;color:#888;direction: ltr;">category/</span>
                <input type="text" id="edit-slug" class="form-control" placeholder="my-category" style="border-radius: 0 8px 8px 0;direction:ltr;text-align: left;padding: 10px 12px;">
              </div>
            </div>

            <div class="form-actions" style="gap:12px;">
              <button type="submit" class="submit-btn">
                <i class="bi bi-check-circle"></i> حفظ التغييرات
              </button>
              <button type="button" id="deleteItemBtn" class="delete-btn">
                <i class="bi bi-trash3"></i> حذف البيانات
              </button>
              <button type="button" id="backToGridBtn" class="back-btn">
                <i class="bi bi-arrow-right"></i> رجوع
              </button>
            </div>
          </form>
        </div>
      </div>
    </div><!-- /dataSection -->

    <!-- ==== مودال تأكيد الحذف ==== -->
    <div id="deleteModal" class="delete-modal-overlay" style="display:none;">
      <div class="delete-modal-box">
        <div class="delete-modal-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
        <h3>تأكيد الحذف</h3>
        <p>هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.</p>
        <div class="delete-modal-actions">
          <button id="cancelDeleteBtn" class="cancel-btn">إلغاء</button>
          <button id="confirmDeleteBtn" class="confirm-delete-btn">
            <i class="bi bi-trash3"></i> تأكيد الحذف
          </button>
        </div>
      </div>
    </div>

  </div><!-- /dashboard-container -->

  <!-- ==== مودال اختيار عناصر المخزن ==== -->
  <div id="invPickerModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2000;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:18px;width:100%;max-width:680px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 50px rgba(0,0,0,.25);direction:rtl;overflow:hidden;">
      <!-- Header -->
      <div style="padding:20px 24px 16px;border-bottom:1px solid #eaf2e4;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#2d4a1e;"><i class="bi bi-archive"></i> <span id="invPickerTitle">اختر من المخزن</span></h3>
        <button onclick="closeInventoryPicker()" style="background:#f5f5f5;border:none;border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <!-- Search -->
      <div style="padding:14px 24px 10px;flex-shrink:0;">
        <div style="position:relative;">
          <input type="text" id="invSearchInput" class="form-control" placeholder="ابحث باسم العنصر..." oninput="filterInvItems()" style="padding-left:36px;">
          <i class="bi bi-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#aaa;font-size:.9rem;pointer-events:none;"></i>
        </div>
      </div>
      <!-- Multi-select note -->
      <div id="invMultiNote" style="padding:0 24px 8px;font-size:0.8rem;color:#596d52;display:none;flex-shrink:0;">
        <i class="bi bi-info-circle"></i> يمكنك اختيار عدة عناصر — انقر للتحديد
      </div>
      <!-- Items Grid -->
      <div id="invItemsGrid" style="flex:1;overflow-y:auto;padding:10px 24px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;"></div>
      <!-- Footer -->
      <div style="padding:14px 24px;border-top:1px solid #eaf2e4;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <span id="invPickerSelCount" style="font-size:0.85rem;color:#596d52;font-weight:600;"></span>
        <div style="display:flex;gap:10px;">
          <button onclick="closeInventoryPicker()" style="padding:8px 20px;border-radius:9px;border:1.5px solid #ccc;background:#fff;color:#555;font-size:.88rem;cursor:pointer;">إلغاء</button>
          <button onclick="confirmInventoryPicker()" style="padding:8px 20px;border-radius:9px;border:none;background:#596d52;color:#fff;font-size:.88rem;font-weight:600;cursor:pointer;"><i class="bi bi-check-lg"></i> تأكيد</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==== مودال تعديل كود الخصم ==== -->
  <div id="dcEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:18px;padding:30px 28px;width:100%;max-width:420px;box-shadow:0 12px 50px rgba(0,0,0,.2);direction:rtl;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #eaf2e4;">
        <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#2d4a1e;">تعديل كود الخصم</h3>
        <button onclick="closeDcEditModal()" style="background:#f5f5f5;border:none;border-radius:7px;width:30px;height:30px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button type="button" id="dc-edit-type-percent-btn" onclick="dcEditSetType('percentage')" style="flex:1;padding:8px 0;border-radius:8px;border:2px solid #596d52;background:#596d52;color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;">
          <i class="bi bi-percent"></i> نسبة مئوية
        </button>
        <button type="button" id="dc-edit-type-fixed-btn" onclick="dcEditSetType('fixed')" style="flex:1;padding:8px 0;border-radius:8px;border:2px solid #596d52;background:#fff;color:#596d52;font-size:.85rem;font-weight:600;cursor:pointer;">
          <i class="bi bi-cash-coin"></i> مبلغ مالي
        </button>
      </div>
      <input type="hidden" id="dc-edit-id" />
      <input type="hidden" id="dc-edit-type" value="percentage" />
      <div class="sc-field" style="margin-bottom:14px;">
        <label style="display:block;font-size:0.83rem;font-weight:600;color:#596d52;margin-bottom:5px;">اسم الكود</label>
        <input type="text" id="dc-edit-code" class="form-control" style="width:100%;padding:9px 12px;border:2px solid #eaf2e4;border-radius:9px;font-size:0.88rem;outline:none;letter-spacing:2px;" />
      </div>
      <div class="sc-field" id="dc-edit-percent-wrap" style="margin-bottom:14px;">
        <label style="display:block;font-size:0.83rem;font-weight:600;color:#596d52;margin-bottom:5px;">نسبة الخصم %</label>
        <input type="number" id="dc-edit-discount" min="1" max="100" class="form-control" style="width:100%;padding:9px 12px;border:2px solid #eaf2e4;border-radius:9px;font-size:0.88rem;outline:none;" />
      </div>
      <div class="sc-field" id="dc-edit-amount-wrap" style="margin-bottom:14px;display:none;">
        <label style="display:block;font-size:0.83rem;font-weight:600;color:#596d52;margin-bottom:5px;">مبلغ الخصم (جنيه)</label>
        <input type="number" id="dc-edit-discount-amount" min="1" step="0.01" class="form-control" style="width:100%;padding:9px 12px;border:2px solid #eaf2e4;border-radius:9px;font-size:0.88rem;outline:none;" />
      </div>
      <div class="sc-field" style="margin-bottom:14px;">
        <label style="display:block;font-size:0.83rem;font-weight:600;color:#596d52;margin-bottom:5px;">تاريخ الانتهاء</label>
        <div style="display:flex;gap:16px;margin-bottom:8px;">
          <label class="dc-radio-label"><input type="radio" name="dc-edit-expiry-type" value="permanent" onchange="dcEditToggleDate(this)" /> <span>دائم</span></label>
          <label class="dc-radio-label"><input type="radio" name="dc-edit-expiry-type" value="date" onchange="dcEditToggleDate(this)" /> <span>تاريخ محدد</span></label>
        </div>
        <div id="dc-edit-date-wrap" style="display:none;">
          <input type="date" id="dc-edit-expires-at" class="form-control dc-date-input" style="width:100%;padding:9px 12px;border:2px solid #eaf2e4;border-radius:9px;font-size:0.88rem;outline:none;" />
        </div>
      </div>
      <button onclick="submitDcEdit()" style="width:100%;padding:11px;background:#596d52;color:#fff;border:none;border-radius:10px;font-size:0.93rem;font-weight:600;cursor:pointer;">
        <i class="bi bi-check-circle"></i> حفظ التعديلات
      </button>
    </div>
  </div>

  <style>
    /* ===== Inventory Picker ===== */
    .inv-pick-btn {
      display: inline-flex; justify-content: center; align-items: center; gap: 8px;
      padding: 8px 18px; border-radius: 9px;
      border: 2px dashed #596d52; background: #f5fbf0;
      color: #596d52; font-size: .88rem; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .inv-pick-btn:hover { background: #dff0d8; }
    .inv-tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .inv-tag {
      display: inline-flex; align-items: center; gap: 6px;
      background: #e8f5e2; border: 1px solid #a8d89a; border-radius: 20px;
      padding: 4px 12px 4px 8px; font-size: .82rem; color: #2d4a1e; font-weight: 600;
    }
    .inv-tag button {
      background: none; border: none; cursor: pointer; color: #c0392b;
      font-size: .85rem; padding: 0; line-height: 1; display: flex; align-items: center;
    }
    .inv-item-card {
      border: 2px solid #e0e8d8; border-radius: 12px; padding: 10px;
      cursor: pointer; transition: border-color .15s, background .15s;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      text-align: center; position: relative; background: #fff;
    }
    .inv-item-card:hover { border-color: #596d52; background: #f5fbf0; }
    .inv-item-card.selected { border-color: #3a7a2e; background: #e8f5e2; }
    .inv-item-card.selected::after {
      content: '✓'; position: absolute; top: 6px; right: 8px;
      background: #3a7a2e; color: #fff; border-radius: 50%;
      width: 18px; height: 18px; font-size: .7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .inv-item-img {
      width: 68px; height: 68px; object-fit: cover; border-radius: 8px;
      background: #f0ede3;
    }
    .inv-item-name { font-size: .8rem; font-weight: 600; color: #2d4a1e; }
    .inv-item-qty  { font-size: .75rem; color: #596d52; }
    /* ===== End Inventory Picker ===== */

    .dc-radio-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #596d52;
      cursor: pointer;
    }

    .dc-radio-label input {
      accent-color: #596d52;
    }

    .dc-date-input {
      color-scheme: light;
    }

    .dc-date-input::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(35%) sepia(30%) saturate(600%) hue-rotate(80deg);
    }

    .dc-table {
      width: 100%;
      border-collapse: collapse;
      direction: rtl;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(89, 109, 82, .1);
    }

    .dc-table thead th {
      background: #f5fbf0;
      color: #596d52;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 12px 16px;
      text-align: right;
      border-bottom: 1px solid #eaf2e4;
    }

    .dc-table tbody tr:hover {
      background: #fafdf8;
    }

    .dc-table tbody td {
      padding: 11px 16px;
      border-bottom: 1px solid #f0f5eb;
      font-size: 0.87rem;
      color: #2d4a1e;
      vertical-align: middle;
    }

    .dc-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .dc-badge.active {
      background: #dff0d8;
      color: #3a5c28;
    }

    .dc-badge.expired {
      background: #fde8e8;
      color: #c0392b;
    }

    .dc-badge.permanent {
      background: #e8f0fe;
      color: #1a73e8;
    }

    .btn-dc-edit {
      background: #f5fbf0;
      border: 1px solid #c4d8b4;
      border-radius: 6px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      color: #596d52;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background .15s;
    }

    .btn-dc-edit:hover {
      background: #dff0d8;
    }

    .btn-dc-del {
      background: #fde8e8;
      border: 1px solid #f5b7b1;
      border-radius: 6px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      color: #c0392b;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background .15s;
    }

    .btn-dc-del:hover {
      background: #f5b7b1;
    }
  </style>

  <script src="{{asset('arbeto_dashboard/js/products.js')}}"></script>
  @include('dashboard.include.footer')