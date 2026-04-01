<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>حساب جديد - Arbeto</title>
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
            <h2>إنشاء حساب جديد</h2>

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

            <form action="{{ route('register') }}" method="POST">
                @csrf

                <div class="form-row">
                    <div class="form-group">
                        <label for="first_name">الاسم الأول</label>
                        <input type="text" id="first_name" name="first_name" value="{{ old('first_name') }}" required />
                    </div>
                    <div class="form-group">
                        <label for="last_name">الاسم الأخير</label>
                        <input type="text" id="last_name" name="last_name" value="{{ old('last_name') }}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="email">البريد الإلكتروني</label>
                        <input type="email" id="email" name="email" value="{{ old('email') }}" required />
                    </div>
                    <div class="form-group">
                        <label for="phone">رقم الهاتف</label>
                        <input type="text" id="phone" name="phone" value="{{ old('phone') }}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="age">العمر</label>
                        <input type="number" id="age" name="age" value="{{ old('age') }}" />
                    </div>
                    <div class="form-group">
                        <label for="gender">النوع</label>
                        <select id="gender" name="gender" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                            <option value="">اختر...</option>
                            <option value="male" {{ old('gender') == 'male' ? 'selected' : '' }}>ذكر</option>
                            <option value="female" {{ old('gender') == 'female' ? 'selected' : '' }}>أنثى</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="address">العنوان</label>
                    <textarea id="address" name="address" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">{{ old('address') }}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="password">كلمة المرور</label>
                        <input type="password" id="password" name="password" required />
                    </div>
                    <div class="form-group">
                        <label for="password_confirmation">تأكيد كلمة المرور</label>
                        <input type="password" id="password_confirmation" name="password_confirmation" required />
                    </div>
                </div>

                <a href="{{ route('login') }}" class="login-link">لديك حساب بالفعل؟ تسجيل الدخول</a>

                <button type="submit" class="register-btn">تسجيل</button>
            </form>
        </div>
    </main>
</body>

</html>