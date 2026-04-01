<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تسجيل الدخول - Arbeto</title>
  <link rel="icon" type="image/x-icon" href="{{ asset('Arbeto/images/favicoon.png') }}" />

  <!-- ملف الاستايل الاساسي -->
  <link rel="stylesheet" href="{{ asset('Arbeto/css/style.css') }}" />
  <link rel="stylesheet" href="{{ asset('Arbeto/css/login.css') }}" />
  <!-- مكتية الشعارات bootstrap -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css" />
</head>

<body>
  <main>
    <div class="register-container">
      <h2>تسجيل الدخول</h2>

      <!-- Display Validation Errors -->
      @if ($errors->any())
      <div style="color: red; margin-bottom: 15px; font-weight: bold;">
        <ul>
          @foreach ($errors->all() as $error)
          <li>{{ $error }}</li>
          @endforeach
        </ul>
      </div>
      @endif

      <form action="{{ route('login') }}" method="POST">
        @csrf
        <div class="form-row">
          <div class="form-group">
            <label for="phone">رقم الهاتف / البريد الإلكتروني</label>
            <input type="text" id="phone" name="phone" value="{{ old('phone') }}" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">كلمة المرور</label>
            <input type="password" id="password" name="password" required />
          </div>
        </div>
        <a href="{{ route('register') }}" class="login-link">ليس لديك حساب؟ سجل الآن </a>

        <button type="submit" class="register-btn">دخول</button>
      </form>
    </div>
  </main>
</body>

</html>