@include('website.includ.head')
<link rel="stylesheet" href="{{asset('Arbeto/css/account.css')}}" />

</head>

<body>
  @include('website.includ.bars')
  @include('website.includ.navbar')
  </header>

  <script>
    const CSRF_TOKEN = '{{ csrf_token() }}';
  </script>

  @php
    $accountRole = auth()->user()?->user_type ?? 'customer';
    $accountRoleClass = in_array($accountRole, ['ceo', 'manager', 'trader'], true)
      ? 'role-' . $accountRole
      : 'role-customer';
  @endphp

  <main class="account {{ $accountRoleClass }}" dir="rtl" data-user-role="{{ $accountRole }}">
    <h2>حسابك</h2>
    <p>استعرض وحدّث بيانات التواصل ومعلومات حسابك</p>

    <div id="toastContainer" class="toast-container"></div>

    <div class="contact-info">
      <h2>معلومات الاتصال</h2>
      <div class="container-info-input">
        <div class="email">
          <label for="userEmail">البريد الإلكتروني</label>
          <input type="email" id="userEmail" value="{{ $user->email }}" />
        </div>
        <div class="phone">
          <label for="userPhone">رقم الهاتف</label>
          <input type="text" id="userPhone" value="{{ $user->phone }}" />
        </div>
      </div>
    </div>

    <div class="contact-info">
      <h2>المعلومات الشخصية</h2>
      <div class="container-info-input">
        <div
          class="email"
          style="flex-direction: row; align-items: center; gap: 10px"
        >
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="firstName">الاسم الأول</label>
            <input style="text-align: right" type="text" id="firstName" value="{{ $user->first_name }}" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="lastName">اسم العائلة</label>
            <input style="text-align: right" type="text" id="lastName" value="{{ $user->last_name }}" />
          </div>
        </div>
        <div
          class="phone"
          style="
            flex-direction: column;
            align-items: right;
            gap: 15px;
            justify-content: center;
          "
        >
          <span>النوع</span>
          <div
            style="
              display: flex;
              align-items: center;
              gap: 14px;
              background: #fffdf1;
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #2c4b2c;
            "
          >
            <div class="box-input">
              <span>ذكر</span>
              <input type="radio" name="gender" value="male" {{ $user->gender === 'male' ? 'checked' : '' }} />
            </div>
            <div class="box-input">
              <span>أنثى</span>
              <input type="radio" name="gender" value="female" {{ $user->gender === 'female' ? 'checked' : '' }} />
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-update-account" id="btnUpdateAccount">تحديث البيانات</button>

    @if(in_array(auth()->user()?->user_type, ['ceo','manager','trader']))
    <div class="contact-info" style="margin-top: 20px">
      <h2><i class="bi bi-shop" style="margin-left:6px;"></i> معلومات البراند</h2>
      <p style="font-size:.85rem;color:#777;margin-bottom:12px;">هذه البيانات ستظهر للعملاء في صفحة المنتج</p>
      <div class="container-info-input">
        <div class="email">
          <label for="brandName">اسم البراند</label>
          <input type="text" id="brandName" value="{{ auth()->user()->brand_name ?? '' }}" placeholder="أدخل اسم البراند"/>
        </div>
        <div class="phone">
          <label for="brandPhone">رقم هاتف البراند</label>
          <input type="text" id="brandPhone" value="{{ auth()->user()->brand_phone ?? '' }}" placeholder="أدخل رقم هاتف البراند"/>
        </div>
      </div>
      <button class="btn-update-account" id="btnUpdateBrandInfo" style="margin-top: 16px">تحديث بيانات البراند</button>
    </div>
    @endif

    <div class="contact-info" style="margin-top: 20px">
      <h2>تغيير كلمة المرور</h2>
      <div class="container-info-input">
        <div class="email">
          <label for="currentPassword">كلمة المرور الحالية</label>
          <input type="password" id="currentPassword" placeholder="أدخل كلمة المرور الحالية" />
        </div>
        <div class="phone">
          <label for="newPassword">كلمة المرور الجديدة</label>
          <input type="password" id="newPassword" placeholder="أدخل كلمة المرور الجديدة" />
        </div>
      </div>
      <button class="btn-update-account" id="btnChangePassword" style="margin-top: 16px">تغيير كلمة المرور</button>
    </div>
  </main>

  @include('website.includ.footer')

  <script>
    function showToast(msg, type) {
      const c = document.getElementById('toastContainer');
      if (!c) return;
      const t = document.createElement('div');
      t.className = 'toast-msg ' + (type === 'error' ? 'toast-error' : 'toast-ok');
      t.textContent = msg;
      c.appendChild(t);
      setTimeout(() => t.remove(), 3500);
    }

    document.getElementById('btnUpdateAccount')?.addEventListener('click', async () => {
      const btn    = document.getElementById('btnUpdateAccount');
      btn.disabled = true;
      btn.textContent = 'جاري التحديث...';

      const gender = document.querySelector('input[name="gender"]:checked')?.value || null;

      try {
        const res = await fetch('/web/account/update', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': CSRF_TOKEN,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            first_name:  document.getElementById('firstName').value.trim(),
            last_name:   document.getElementById('lastName').value.trim(),
            email:       document.getElementById('userEmail').value.trim(),
            phone:       document.getElementById('userPhone').value.trim(),
            gender,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'فشل التحديث');
        showToast(data.message || 'تم التحديث بنجاح', 'ok');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled    = false;
        btn.textContent = 'تحديث البيانات';
      }
    });

    document.getElementById('btnUpdateBrandInfo')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnUpdateBrandInfo');
      const brandName = document.getElementById('brandName')?.value.trim() || '';
      const brandPhone = document.getElementById('brandPhone')?.value.trim() || '';

      if (!brandName || !brandPhone) {
        showToast('من فضلك أدخل اسم البراند ورقم الهاتف', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'جاري التحديث...';

      try {
        const res = await fetch('/web/account/update-brand', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': CSRF_TOKEN,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            brand_name: brandName,
            brand_phone: brandPhone,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'فشل تحديث بيانات البراند');
        showToast(data.message || 'تم تحديث بيانات البراند بنجاح', 'ok');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'تحديث بيانات البراند';
      }
    });

    document.getElementById('btnChangePassword')?.addEventListener('click', async () => {
      const btn    = document.getElementById('btnChangePassword');
      btn.disabled = true;
      btn.textContent = 'جاري التغيير...';

      try {
        const res = await fetch('/web/account/change-password', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': CSRF_TOKEN,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            current_password: document.getElementById('currentPassword').value,
            new_password:     document.getElementById('newPassword').value,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'فشل تغيير كلمة المرور');
        showToast(data.message || 'تم تغيير كلمة المرور بنجاح', 'ok');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value     = '';
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled    = false;
        btn.textContent = 'تغيير كلمة المرور';
      }
    });
  </script>

</body>

</html>