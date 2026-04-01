@include('dashboard.include.head')
<link rel="stylesheet" href="{{ asset('arbeto_dashboard/css/store-settings.css') }}">
<style>
  .container-dashboard {
    width: 60%;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
</head>

<body>
  @include('dashboard.include.sidebar')
  <div class="container-dashboard">

    <div class="page-header-store">
      <h2><i class="bi bi-gear-fill"></i> إعدادات المتجر</h2>
    </div>

    {{-- ═══════════ قسم اللوجو ═══════════ --}}
    <div class="settings-card">
      <h3 class="settings-card-title"><i class="bi bi-image"></i> لوجو الموقع</h3>
      <p class="settings-card-desc">تظهر هذه الصورة في الهيدر الخاص بالموقع</p>
      <div class="img-upload-wrapper" id="logoWrapper">
        <img id="logoPreview"
          src="{{ $storeSettings && $storeSettings->logo ? asset('storage/'.$storeSettings->logo) : asset('arbeto_dashboard/image/logo-nunbg.png') }}"
          alt="Logo" class="upload-preview-img" />
        <div class="img-hover-overlay" onclick="document.getElementById('logoInput').click()">
          <i class="bi bi-camera-fill"></i>
          <span>تغيير الصورة</span>
        </div>
        <input type="file" id="logoInput" accept="image/*" style="display:none" />
      </div>
      <div class="settings-actions" style="margin-top:14px">
        <button class="btn-save-settings" id="saveLogoBtn" onclick="uploadLogo()" disabled>
          <span class="btn-text"><i class="bi bi-cloud-arrow-up-fill"></i> تحديث اللوجو</span>
          <span class="btn-spinner" style="display:none"><i class="bi bi-arrow-repeat spin-icon"></i></span>
        </button>
      </div>
      <div class="upload-status" id="logoStatus"></div>
    </div>

    {{-- ═══════════ قسم الفافيكون ═══════════ --}}
    <div class="settings-card">
      <h3 class="settings-card-title"><i class="bi bi-stars"></i> Favicon الموقع</h3>
      <p class="settings-card-desc">الأيقونة الصغيرة التي تظهر في تبويب المتصفح</p>
      <div class="img-upload-wrapper favicon-wrapper" id="faviconWrapper">
        <img id="faviconPreview"
          src="{{ $storeSettings && $storeSettings->favicon ? asset('storage/'.$storeSettings->favicon) : asset('Arbeto/images/favicoon.png') }}"
          alt="Favicon" class="upload-preview-img favicon-preview-img" />
        <div class="img-hover-overlay" onclick="document.getElementById('faviconInput').click()">
          <i class="bi bi-camera-fill"></i>
          <span>تغيير الأيقونة</span>
        </div>
        <input type="file" id="faviconInput" accept="image/*" style="display:none" />
      </div>
      <div class="settings-actions" style="margin-top:14px">
        <button class="btn-save-settings" id="saveFaviconBtn" onclick="uploadFavicon()" disabled>
          <span class="btn-text"><i class="bi bi-cloud-arrow-up-fill"></i> تحديث الأيقونة</span>
          <span class="btn-spinner" style="display:none"><i class="bi bi-arrow-repeat spin-icon"></i></span>
        </button>
      </div>
      <div class="upload-status" id="faviconStatus"></div>
    </div>

    {{-- ═══════════ قسم معلومات التواصل ═══════════ --}}
    <div class="settings-card">
      <h3 class="settings-card-title"><i class="bi bi-telephone-fill"></i> معلومات التواصل</h3>
      <p class="settings-card-desc">تظهر هذه البيانات في الفوتر الخاص بالموقع</p>
      <div class="settings-form-grid">
        <div class="form-group-settings">
          <label>البريد الإلكتروني للدعم</label>
          <input type="email" id="supportEmail" class="settings-input"
            placeholder="support@example.com"
            value="{{ $storeSettings->support_email ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label>رقم هاتف الدعم</label>
          <input type="text" id="supportPhone" class="settings-input"
            placeholder="+201XXXXXXXXX"
            value="{{ $storeSettings->support_phone ?? '' }}" />
        </div>
      </div>
      <div class="settings-actions">
        <button class="btn-save-settings" id="saveContactBtn" onclick="saveContact()">
          <span class="btn-text"><i class="bi bi-floppy-fill"></i> حفظ بيانات التواصل</span>
          <span class="btn-spinner" style="display:none"><i class="bi bi-arrow-repeat spin-icon"></i></span>
        </button>
      </div>
      <div class="save-status" id="contactStatus"></div>
    </div>

    {{-- ═══════════ قسم السوشيال ميديا ═══════════ --}}
    <div class="settings-card">
      <h3 class="settings-card-title"><i class="bi bi-share-fill"></i> روابط السوشيال ميديا</h3>
      <p class="settings-card-desc">تظهر هذه الروابط في الفوتر الخاص بالموقع</p>
      <div class="settings-form-grid">
        <div class="form-group-settings">
          <label><i class="bi bi-facebook" style="color:#1877f2"></i> Facebook</label>
          <input type="url" id="facebookUrl" class="settings-input"
            placeholder="https://facebook.com/..."
            value="{{ $storeSettings->facebook_url ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label><i class="bi bi-instagram" style="color:#e1306c"></i> Instagram</label>
          <input type="url" id="instagramUrl" class="settings-input"
            placeholder="https://instagram.com/..."
            value="{{ $storeSettings->instagram_url ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label><i class="bi bi-twitter-x"></i> Twitter / X</label>
          <input type="url" id="twitterUrl" class="settings-input"
            placeholder="https://x.com/..."
            value="{{ $storeSettings->twitter_url ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label><i class="bi bi-whatsapp" style="color:#25d366"></i> WhatsApp</label>
          <input type="url" id="whatsappUrl" class="settings-input"
            placeholder="https://wa.me/201XXXXXXXXX"
            value="{{ $storeSettings->whatsapp_url ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label><i class="bi bi-youtube" style="color:#ff0000"></i> YouTube</label>
          <input type="url" id="youtubeUrl" class="settings-input"
            placeholder="https://youtube.com/..."
            value="{{ $storeSettings->youtube_url ?? '' }}" />
        </div>
        <div class="form-group-settings">
          <label><i class="bi bi-tiktok"></i> TikTok</label>
          <input type="url" id="tiktokUrl" class="settings-input"
            placeholder="https://tiktok.com/@..."
            value="{{ $storeSettings->tiktok_url ?? '' }}" />
        </div>
      </div>
      <div class="settings-actions">
        <button class="btn-save-settings" id="saveSocialBtn" onclick="saveSocial()">
          <span class="btn-text"><i class="bi bi-floppy-fill"></i> حفظ روابط السوشيال</span>
          <span class="btn-spinner" style="display:none"><i class="bi bi-arrow-repeat spin-icon"></i></span>
        </button>
      </div>
      <div class="save-status" id="socialStatus"></div>
    </div>

  </div>
  @include('dashboard.include.footer')
  <script src="{{ asset('arbeto_dashboard/js/store-settings.js') }}"></script>