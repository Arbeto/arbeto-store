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

  <main class="account" dir="rtl">
    <h2>حسابك</h2>
    <p>استعرض وحدّث بيانات التواصل ومعلومات حسابك</p>

    <div id="toastContainer" class="toast-container"></div>

    <div class="contact-info">
      <h2>معلومات المتجر</h2>
      <div class="container-info-input">
        <div class="email">
          <label for="userEmail">البريد الالكتروني الخاص بالدعم</label>
          <input type="email" id="userEmail" value="{{ $user->email }}" />
        </div>
        <div class="phone">
          <label for="userPhone">رقم الهاتف للدعم</label>
          <input type="text" id="userPhone" value="{{ $user->phone }}" />
        </div>
        <div class="phone">
          <label for="userPhone">لوجو المتجر</label>
          <input type="text" id="userPhone" value="{{ $user->phone }}" />
        </div>
        <div class="phone">
          <label for="userPhone">صورة الصفحة بصفحة الويب بالأعلى</label>
          <input type="text" id="userPhone" value="{{ $user->phone }}" />
      </div>
    </div>

    <div class="contact-info">
      <h2>معلومات وسائل التواصل الاجتماعي</h2>
      <div class="container-info-input">
        <div
          class="email"
          style="flex-direction: row-reverse; align-items: center; gap: 10px"
        >
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="firstName">رابط صفحة الفيسبوك</label>
            <input style="text-align: right" type="text" id="firstName" value="{{ $user->first_name }}" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="firstName">رابط شات واتساب</label>
            <input style="text-align: right" type="text" id="firstName" value="{{ $user->first_name }}" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="firstName">رابط صفحة الانستغرام</label>
            <input style="text-align: right" type="text" id="firstName" value="{{ $user->first_name }}" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 15px">
            <label for="firstName">رابط صفحة التيكتوك</label>
            <input style="text-align: right" type="text" id="firstName" value="{{ $user->first_name }}" />
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


  </main>

  @include('website.includ.footer')


</body>

</html>