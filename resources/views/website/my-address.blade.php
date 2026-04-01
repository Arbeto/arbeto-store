@include('website.includ.head')
    <link rel="stylesheet" href="{{asset('Arbeto/css/account.css')}}" />
    <link rel="stylesheet" href="{{asset('Arbeto/css/item.css')}}" />
  
</head>
<body>
    @include('website.includ.bars')
    @include('website.includ.navbar')
    </header>


  <main class="account">
      <h2>عناوينك</h2>
      <p>
        قم بإدارة عناوينك المحفوظة لتتمكن من إنهاء عمليات الشراء بسرعة وسهولة
        عبر متاجرنا
      </p>

      <div id="addressToast" style="display:none;padding:12px 18px;border-radius:8px;font-size:14px;margin-bottom:10px;"></div>

      <div class="contact-info">
        <h2>التسليم إلى</h2>
        <div class="container-info-input" style="flex-direction: column">
          <div
            class="phone"
            style="
              flex-direction: column;
              align-items: right;
              gap: 15px;
              justify-content: center;
            "
          >
            <span>نوع العنوان</span>
            <div style="display: flex; justify-content: center">
              <div class="options-item">
                <div
                  class="second-option"
                  style="flex-direction: row-reverse; gap: 15px"
                >
                  <button type="button" class="btn-dev opt-btn addr-type-btn {{ ($userAddress->address_type ?? 'home') === 'home'  ? 'active' : '' }}" data-type="home">
                    المنزل <i class="bi bi-house"></i>
                  </button>
                  <button type="button" class="btn-dev opt-btn addr-type-btn {{ ($userAddress->address_type ?? '') === 'work'  ? 'active' : '' }}" data-type="work">
                    العمل <i class="bi bi-briefcase"></i>
                  </button>
                  <button type="button" class="btn-dev opt-btn addr-type-btn {{ ($userAddress->address_type ?? '') === 'other' ? 'active' : '' }}" data-type="other">
                    أخرى <i class="bi bi-geo-alt"></i>
                  </button>
                </div>
              </div>
            </div>
            <input type="hidden" id="addressType" value="{{ $userAddress->address_type ?? 'home' }}" />
          </div>

          {{-- المحافظة والمدينة --}}
          <div class="phone" style="flex-direction: column; gap: 8px;">
            <span>المحافظة والمدينة</span>
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
          </div>

          <div class="email">
            <label for="streetInput">العنوان بالتفصيل (الشارع، المنزل، أقرب معلم...)</label>
            <textarea id="streetInput" style="text-align: right; width:100%; min-height:80px; border:1px solid #ddd; border-radius:8px; padding:10px; font-family:inherit; font-size:14px; resize:vertical; background:#fffdf1; color:#2c4b2c; outline:none;">{{ $userAddress->street ?? '' }}</textarea>
          </div>
        </div>
      </div>
      <button class="btn-update-account" id="updateAddressBtn">تحديث عنوانك</button>
    </main>
    
    @include('website.includ.footer')
    <script src="{{asset('Arbeto/js/governorates.js')}}"></script>
    <script src="{{asset('Arbeto/js/tabs.js')}}"></script>
    <script>
            document.addEventListener('DOMContentLoaded', function () {
              // ── Cascade init with pre-selected values ──
              initGovCityCascade(document.querySelector('.contact-info'), {
                govSelectId:  'govSelect',
                citySelectId: 'citySelect',
                initGov:  '{{ $userAddress->governorate ?? '' }}',
                initCity: '{{ $userAddress->city ?? '' }}',
              });
        
              // ── Address type toggle ──
              document.querySelectorAll('.addr-type-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                  document.querySelectorAll('.addr-type-btn').forEach(function (b) { b.classList.remove('active'); });
                  btn.classList.add('active');
                  document.getElementById('addressType').value = btn.dataset.type;
                });
              });
        
              // ── Update button ──
              document.getElementById('updateAddressBtn').addEventListener('click', async function () {
                const toast = document.getElementById('addressToast');
                const gov    = document.getElementById('govSelect').value;
                const city   = document.getElementById('citySelect').value;
                const street = document.getElementById('streetInput').value.trim();
                const type   = document.getElementById('addressType').value;
        
                if (!gov)    { showAddrToast('الرجاء اختيار المحافظة', false); return; }
                if (!city)   { showAddrToast('الرجاء اختيار المدينة', false); return; }
                if (!street) { showAddrToast('الرجاء إدخال تفاصيل العنوان', false); return; }
        
                const btn = document.getElementById('updateAddressBtn');
                btn.disabled = true;
                btn.textContent = 'جاري الحفظ...';
        
                const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
                try {
                  const res = await fetch('/web/address', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                    body: JSON.stringify({ governorate: gov, city: city, street: street, address_type: type }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    showAddrToast('تم تحديث العنوان بنجاح ✓', true);
                  } else {
                    showAddrToast(data.error || 'حدث خطأ أثناء الحفظ', false);
                  }
                } catch {
                  showAddrToast('حدث خطأ في الاتصال', false);
                }
                btn.disabled = false;
                btn.textContent = 'تحديث عنوانك';
              });
        
              function showAddrToast(msg, success) {
                const el = document.getElementById('addressToast');
                el.textContent = msg;
                el.style.display = 'block';
                el.style.background = success ? '#e6f9ed' : '#fdecea';
                el.style.color      = success ? '#1a6e3a' : '#c0392b';
                el.style.border     = success ? '1px solid #b2dfcd' : '1px solid #f5c6cb';
                setTimeout(function () { el.style.display = 'none'; }, 3500);
              }
            });
    </script>

</body>

</html>

