    <header>
        <section class="top">
            <a href="/" class="logo">
                @if(!empty($storeSettings?->logo))
                <img src="{{ asset('storage/'.$storeSettings->logo) }}" alt="Arbeto" />
                @else
                <img src="{{asset('Arbeto/images/logo green.png')}}" alt="Arbeto" />
                @endif
            </a>
            <!-- الناف بار -->
            <nav>
                <ul class="top-bar">
                    <!-- <li>
                        <i
                            style="color: #2c4b2c; margin: 0 3px 0 -5px"
                            class="bi bi-gift"></i>
                        <a href="{{ route('create.gift') }}">صمم هديتك</a>
                    </li> -->
                    @foreach($offerPages as $offerPage)
                    @if(str_contains($offerPage->location, 'header'))
                    <li>
                        <a href="{{ route('offer.show', $offerPage->slug) }}">{{ $offerPage->title }}</a>
                    </li>
                    @endif
                    @endforeach
                </ul>
            </nav>
            <section class="search" style="width: 50%; position: relative;">
                <input type="search" id="globalSearchInput" placeholder="إبحث للوصول للمنتجات" autocomplete="off" />
                <span style="right: 1.8%;" class="bi bi-search"></span>
                <div id="searchSuggestions"></div>
            </section>
            <nav>
                <ul class="top-bar icon">
                    <li class="nun user-menu-container">
                        @auth
                            {{-- المستخدم مسجل الدخول --}}
                            <a href="#" class="bi bi-person" id="userIcon"></a>
                            <div class="user-dropdown-menu" id="userDropdown">
                                <div class="user-info">
                                    <p class="user-name">{{ auth()->user()->first_name ?? 'مستخدم' }}</p>
                                </div>
                                <hr />
                                <ul class="dropdown-links">
                                    <li>
                                        <a href="{{ route('my.orders') }}"><i class="bi bi-bag-check"></i> الطلبات</a>
                                    </li>
                                    <li>
                                        <a href="{{ route('my.address') }}"><i class="bi bi-map"></i> العناوين</a>
                                    </li>
                                    <li>
                                        <a><i class="bi bi-cash"></i> الرصيد: {{ number_format(auth()->user()->wallet_balance, 2) }}</a>
                                    </li>
                                    <li>
                                        <a href="{{ route('my.account') }}"><i class="bi bi-person-gear"></i> الحساب</a>
                                    </li>
                                    <li>
                                        <a href="#" class="logout-btn" id="logoutBtn">
                                            <i class="bi bi-box-arrow-right"></i> تسجيل الخروج
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        @else
                            {{-- المستخدم غير مسجل --}}
                            <div class="guest-auth-btns">
                                <button class="auth-open-btn login-open-btn" id="openLoginSidebar">
                                    <i class="bi bi-box-arrow-in-right"></i> تسجيل الدخول
                                </button>
                                <!-- <button class="auth-open-btn register-open-btn" id="openRegisterSidebar">
                                    <i class="bi bi-person-plus"></i> مستخدم جديد
                                </button> -->
                            </div>
                        @endauth
                    </li>
                    <li
                        class="nun"
                        style="font-size: 20px; display: flex; align-items: center">
                        <a
                            href="{{ route('my.favorite') }}"
                            class="bi bi-heart-fill bag-order favorite-icon">
                        </a>
                    </li>
                    <li class="nun">
                        <a href="{{ route('my.bags') }}" class="bi bi-bag-fill bag-order cart-icon-link">
                            <span class="quntity" id="cartCount">@auth{{ auth()->user()->carts()->sum('quantity') }}@endauth</span>
                        </a>
                    </li>

                    <!-- <li><a href="pages/about.html">حول</a></li> -->
                </ul>
            </nav>
            <!-- /الناف بار -->
        </section>

    {{-- ======= Auth Overlay ======= --}}
    <div class="auth-overlay" id="authOverlay"></div>

    {{-- ======= Login Sidebar ======= --}}
    <div class="auth-sidebar" id="loginSidebar">
        <button class="auth-sidebar-close" id="closeLoginSidebar"><i class="bi bi-x-lg"></i></button>
        <div class="auth-sidebar-body">
            <div class="auth-sidebar-logo">
                <img src="{{ asset('Arbeto/images/logo-png.png') }}" alt="Arbeto">
            </div>
            <h2 class="auth-sidebar-title">تسجيل الدخول</h2>
            <div class="auth-error" id="loginError"></div>
            <div class="auth-form-group">
                <label>رقم الهاتف / البريد الإلكتروني</label>
                <input type="text" id="loginIdentifier" class="auth-input" placeholder="أدخل رقم الهاتف أو البريد الإلكتروني" autocomplete="username" inputmode="email" dir="auto" />
            </div>
            <div class="auth-form-group">
                <label>كلمة المرور</label>
                <input type="password" id="loginPassword" class="auth-input" placeholder="أدخل كلمة المرور" autocomplete="current-password" />
            </div>
            <button class="auth-submit-btn" id="loginSubmitBtn">
                <span class="btn-text">دخول</span>
                <span class="btn-spinner" style="display:none;"><i class="bi bi-arrow-repeat spin-icon"></i></span>
            </button>
            <p class="auth-switch-text">ليس لديك حساب؟ <a href="#" id="switchToRegister">سجل الآن</a></p>
        </div>
    </div>

    {{-- ======= Register Sidebar ======= --}}
    <div class="auth-sidebar" id="registerSidebar">
        <button class="auth-sidebar-close" id="closeRegisterSidebar"><i class="bi bi-x-lg"></i></button>
        <div class="auth-sidebar-body">
            <div class="auth-sidebar-logo">
                <img src="{{ asset('Arbeto/images/logo-png.png') }}" alt="Arbeto">
            </div>
            <h2 class="auth-sidebar-title">إنشاء حساب جديد</h2>
            <div class="auth-error" id="registerError"></div>
            <div class="auth-form-row">
                <div class="auth-form-group">
                    <label>الاسم الأول</label>
                    <input type="text" id="regFirstName" class="auth-input" placeholder="الاسم الأول بالعربي" />
                </div>
                <div class="auth-form-group">
                    <label>الاسم الأخير</label>
                    <input type="text" id="regLastName" class="auth-input" placeholder="الاسم الأخير بالعربي" />
                </div>
            </div>
            <div class="auth-form-group">
                <label>رقم الهاتف</label>
                <input type="text" id="regPhone" class="auth-input" placeholder="01XXXXXXXXX" />
            </div>
            <div class="auth-form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" id="regEmail" class="auth-input" placeholder="example@email.com" />
            </div>
            <div class="auth-form-group">
                <label>كلمة المرور</label>
                <input type="password" id="regPassword" class="auth-input" placeholder="6 أحرف على الأقل" />
            </div>
            <div class="auth-form-group">
                <label>النوع</label>
                <div class="auth-gender-group">
                    <label class="gender-option">
                        <input type="radio" name="regGender" value="male"> ذكر
                    </label>
                    <label class="gender-option">
                        <input type="radio" name="regGender" value="female"> أنثى
                    </label>
                </div>
            </div>
            <button class="auth-submit-btn" id="registerSubmitBtn">
                <span class="btn-text">إنشاء الحساب</span>
                <span class="btn-spinner" style="display:none;"><i class="bi bi-arrow-repeat spin-icon"></i></span>
            </button>
            <p class="auth-switch-text">لديك حساب؟ <a href="#" id="switchToLogin">سجل الدخول</a></p>
        </div>
    </div>

    {{-- ======= Guest Action Modal (favorites / cart) ======= --}}
    <div class="guest-modal-overlay" id="guestModalOverlay">
        <div class="guest-modal" id="guestModal">
            <button class="guest-modal-close" id="closeGuestModal"><i class="bi bi-x-lg"></i></button>
            <div class="guest-modal-icon"><i class="bi bi-person-lock"></i></div>
            <p class="guest-modal-msg" id="guestModalMsg">يجب تسجيل الدخول أولاً</p>
            <div class="guest-modal-btns">
                <button class="auth-open-btn login-open-btn" id="guestLoginBtn"><i class="bi bi-box-arrow-in-right"></i> تسجيل الدخول</button>
                <button class="auth-open-btn register-open-btn" id="guestRegisterBtn"><i class="bi bi-person-plus"></i> مستخدم جديد</button>
            </div>
        </div>
    </div>

    <script src="{{ asset('Arbeto/js/search.js') }}"></script>

    @auth
    <script>
    (function () {
        const THROTTLE_MS = 30000; // send at most once every 30 seconds
        const csrfToken   = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
        let lastSent = 0;

        function sendHeartbeat() {
            const now = Date.now();
            if (now - lastSent < THROTTLE_MS) return;
            lastSent = now;
            fetch('/update-last-seen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            }).catch(() => {});
        }

        // Send on page load
        sendHeartbeat();

        // Send on any user activity
        ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'visibilitychange'].forEach(function (evt) {
            document.addEventListener(evt, sendHeartbeat, { passive: true });
        });
    })();
    </script>
    @endauth