@include('website.includ.head')
    <link rel="stylesheet" href="{{asset('Arbeto/css/account.css')}}" />
    <link rel="stylesheet" href="{{asset('Arbeto/css/orders.css')}}" />
</head>
<body>
    @include('website.includ.bars')
    @include('website.includ.navbar')
    </header>

    {{-- تمرير بيانات الطلبات للـ JavaScript --}}
    <script>
      const ORDERS_DATA = @json($ordersData);
      const CSRF_TOKEN  = '{{ csrf_token() }}';
    </script>

    <main class="account" style="gap: 0" dir="rtl">
      <div class="container-header-orders" style="margin-bottom: 12px; padding: 0 25px">
        <h2>طلباتك</h2>

        <section class="coontainer-filter" style="gap:8px">
          {{-- فلتر نوع الطلب --}}
          <div style="position:relative;display:inline-block">
            <button id="orderTypeFilterBtn" class="pagination-order" style="display:flex;flex-direction:row-reverse;align-items:center;gap:10px;">
              الكل <span class="bi bi-caret-down-fill"></span>
            </button>
            <div id="orderTypeFilterDropdown" class="pagination-order-dropdown">
              <button data-type="all" class="active">الكل</button>
              <button data-type="purchase">طلبات الشراء</button>
              <button data-type="return">طلبات المرتجعات</button>
            </div>
          </div>

          {{-- فلتر التاريخ --}}
          @if(count($uniqFilters))
          <button id="dateFilterBtn" class="pagination-order" style="display:flex;flex-direction:row-reverse;align-items:center;gap:10px;">
            {{ $uniqFilters[0]['label'] }} <span class="bi bi-caret-down-fill"></span>
          </button>
          <div id="dateFilterDropdown" class="pagination-order-dropdown">
            @foreach($uniqFilters as $f)
              <button class="{{ $loop->first ? 'active' : '' }}" data-filter="{{ $f['key'] }}">{{ $f['label'] }}</button>
            @endforeach
          </div>
          @endif
        </section>
      </div>

      <div id="toastContainer" class="toast-container"></div>

      <div class="orders-container" id="ordersContainer"></div>

      <div id="emptyOrders" style="display:none;text-align:center;padding:60px 20px;color:#848570;">
        <i class="bi bi-bag-x" style="font-size:48px;display:block;margin-bottom:16px;"></i>
        <p style="font-size:18px;">لا توجد طلبات في هذه الفترة</p>
      </div>
    </main>

    {{-- النوافذ المنبثقة --}}

    {{-- نافذة تقييم المنتج --}}
    <div id="ratingModal" class="modal-overlay">
      <div class="modal-content">
        <button class="close-modal">&times;</button>
        <div class="modal-header"><h3>تقييم المنتج</h3></div>
        <div class="modal-body">
          <div id="ratingProductSelectGroup" class="form-group" style="margin-bottom:14px">
            <label for="ratingProductSelect" style="font-weight:600;display:block;margin-bottom:8px">اختر المنتج</label>
            <select id="ratingProductSelect"
              style="width:100%;padding:10px;border:1.5px solid #eaf2e4;border-radius:8px;font-family:inherit;font-size:.9rem;color:#2c4b2c;outline:none;background:#fff;"></select>
          </div>
          <div class="stars-container">
            <i class="bi bi-star-fill star" data-value="5"></i>
            <i class="bi bi-star-fill star" data-value="4"></i>
            <i class="bi bi-star-fill star" data-value="3"></i>
            <i class="bi bi-star-fill star" data-value="2"></i>
            <i class="bi bi-star-fill star" data-value="1"></i>
          </div>
          <div class="comment-section">
            <label for="productComment">اكتب تعليقك على المنتج وأضف رأيك للآخرين</label>
            <textarea id="productComment" placeholder="اكتب هنا..." rows="4" style="color:#2c4b2c"></textarea>
          </div>
          <div class="upload-section">
            <p class="upload-note">يمكنك إضافة بحد أقصى 4 صور للمنتج</p>
            <div id="imagePreviewContainer" class="preview-container">
              <label for="imageUpload" class="upload-btn">
                <i class="bi bi-camera"></i>
                <input type="file" id="imageUpload" multiple accept="image/*" hidden />
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="submitRating" class="submit-btn" disabled>إرسال</button>
        </div>
      </div>
    </div>

    {{-- نافذة ملخص الطلبية --}}
    <div id="summaryModal" class="modal-overlay">
      <div class="modal-content">
        <button class="close-modal" id="close-modal">&times;</button>
        <div class="modal-header"><h3 id="summaryModalTitle">ملخص الطلبية</h3></div>
        <div class="modal-body">
          <table class="specs-table"><tbody id="summaryTableBody"></tbody></table>
        </div>
        <div class="modal-footer">
          <button id="closeSummaryModal" class="submit-btn">إغلاق</button>
        </div>
      </div>
    </div>

    {{-- نافذة إلغاء الطلبية --}}
    <div id="cancelModal" class="modal-overlay">
      <div class="modal-content">
        <button class="close-modal">&times;</button>
        <div class="modal-header"><h3>إلغاء الطلبية</h3></div>
        <div class="modal-body">هل أنت متأكد من إلغاء الطلبية؟</div>
        <div class="comment-section" style="margin-top:20px">
          <label for="cancelReason">سبب الإلغاء (اختياري)</label>
          <textarea id="cancelReason" placeholder="اكتب هنا..." rows="4" style="color:#2c4b2c"></textarea>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px">
          <button id="confirmCancel" class="submit-btn" style="background-color:#dc3545">موافق</button>
          <button id="closeCancelModal" class="submit-btn" style="background-color:#a7a7a7">إغلاق</button>
        </div>
      </div>
    </div>

    {{-- نافذة تتبع الطلبية --}}
    <div id="trackingModal" class="modal-overlay">
      <div class="modal-content">
        <button id="closeModal" class="close-modal">&times;</button>
        <div class="modal-header"><h3 id="trackingModalTitle">تتبع الطلبية</h3></div>
        <div class="modal-body">
          <div class="tracking-timeline" id="trackingTimeline"></div>
        </div>
        <div class="modal-footer">
          <button id="closeTrackingModal" class="submit-btn" style="background-color:#a7a7a7">إغلاق</button>
        </div>
      </div>
    </div>

    {{-- نافذة طلب الاسترجاع --}}
    <div id="returnModal" class="modal-overlay">
      <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
        <button class="close-modal">&times;</button>
        <div class="modal-header"><h3>طلب استرجاع</h3></div>
        <div class="modal-body">

          {{-- اختيار المنتجات --}}
          <div class="form-group" style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:8px">المنتجات المراد إرجاعها</label>
            <div id="returnProductList"></div>
          </div>

          {{-- سبب الاسترجاع --}}
          <div class="form-group" style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:8px">سبب الاسترجاع</label>
            <div class="return-reasons" style="display:flex;flex-direction:column;gap:8px">
              <label class="return-reason-opt"><input type="radio" name="returnReason" value="damaged"> المنتج تالف</label>
              <label class="return-reason-opt"><input type="radio" name="returnReason" value="not_working"> المنتج لا يعمل بشكل صحيح</label>
              <label class="return-reason-opt"><input type="radio" name="returnReason" value="other"> سبب آخر</label>
            </div>
            <textarea id="returnReasonDetail" placeholder="اكتب تفاصيل السبب هنا..." rows="3"
              style="margin-top:10px;width:100%;padding:10px;border:1.5px solid #eaf2e4;border-radius:8px;font-family:inherit;font-size:.9rem;color:#2c4b2c;resize:vertical;outline:none;box-sizing:border-box;"></textarea>
          </div>

          {{-- صور المنتج --}}
          <div class="form-group" style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:8px">صور المنتج <small style="font-weight:400;color:#848570">(حد أقصى 6 صور)</small></label>
            <div id="returnImagePreview" class="preview-container">
              <label for="returnImageUpload" class="upload-btn">
                <i class="bi bi-camera"></i>
                <input type="file" id="returnImageUpload" multiple accept="image/*" hidden />
              </label>
            </div>
          </div>

          {{-- ملاحظة تكلفة الشحن --}}
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 14px;font-size:.85rem;color:#7b6200;display:flex;gap:8px;align-items:flex-start;margin-bottom:16px">
            <i class="bi bi-info-circle" style="margin-top:2px;flex-shrink:0"></i>
            <span id="returnShippingNote">ملاحظة: سيتم خصم تكلفة شحن الاسترجاع من قيمة المبلغ المسترد</span>
          </div>

          {{-- طريقة استلام المبلغ --}}
          <div class="form-group" style="margin-bottom:16px">
            <label style="font-weight:600;display:block;margin-bottom:8px">طريقة استلام المبلغ المسترد</label>
            <select id="returnPaymentMethod"
              style="width:100%;padding:10px;border:1.5px solid #eaf2e4;border-radius:8px;font-family:inherit;font-size:.9rem;color:#2c4b2c;outline:none;background:#fff;">
              <option value="">اختر طريقة الاستلام</option>
              <option value="instapay">إنستا باي</option>
              <option value="wallet">محفظة الكاش</option>
            </select>
            <input type="text" id="returnAccountNumber" placeholder="رقم الحساب / رقم المحفظة (اختياري)"
              style="margin-top:10px;width:100%;padding:10px;border:1.5px solid #eaf2e4;border-radius:8px;font-family:inherit;font-size:.9rem;color:#2c4b2c;outline:none;box-sizing:border-box;" />
          </div>

        </div>
        <div class="modal-footer" style="display:flex;gap:10px">
          <button id="submitReturn" class="submit-btn">إرسال طلب الاسترجاع</button>
          <button id="closeReturnModal" class="submit-btn" style="background-color:#a7a7a7">إغلاق</button>
        </div>
      </div>
    </div>

    {{-- نافذة عرض التقييم --}}
    <div id="viewRatingModal" class="modal-overlay">
      <div class="modal-content" style="max-width:460px">
        <button class="close-modal">&times;</button>
        <div class="modal-header"><h3>تقييمك للمنتج</h3></div>
        <div class="modal-body">
          <div id="viewRatingStars" style="display:flex;justify-content:center;gap:4px;margin-bottom:18px"></div>
          <div id="viewRatingImages" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px"></div>
          <div id="viewRatingComment" style="margin-bottom:14px"></div>
          <div id="viewRatingLikes" style="color:#848570;font-size:.88rem;display:flex;align-items:center;gap:6px"></div>
        </div>
        <div class="modal-footer">
          <button id="closeViewRatingModal" class="submit-btn" style="background-color:#a7a7a7">إغلاق</button>
        </div>
      </div>
    </div>

    {{-- نافذة تفاصيل الرفض / الفشل --}}
    <div id="detailsModal" class="modal-overlay">
      <div class="modal-content" style="max-width:420px">
        <button class="close-modal">&times;</button>
        <div class="modal-header"><h3>تفاصيل الطلبية</h3></div>
        <div class="modal-body">
          <p id="detailsModalText" style="color:#2c4b2c;line-height:1.7;font-size:.95rem;white-space:pre-wrap"></p>
        </div>
        <div class="modal-footer">
          <button id="closeDetailsModal" class="submit-btn" style="background-color:#a7a7a7">إغلاق</button>
        </div>
      </div>
    </div>

    @include('website.includ.footer')
    <script src="{{asset('Arbeto/js/orders.js')}}"></script>

</body>
</html>
