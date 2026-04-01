@include('website.includ.head')
<link rel="stylesheet" href="{{asset('Arbeto/css/create-gift.css')}}" />
<link rel="stylesheet" href="{{asset('Arbeto/css/about.css')}}" />

</head>

<body>
  @include('website.includ.bars')
  @include('website.includ.navbar')
  </header>
  <main class="about">
      <!-- Section 1: Intro -->
      <section class="about-section">
        <div class="container-about animate-fade-up">
          <h2>مـن نـحـن</h2>
          <p>
            أهلاً بكم في <strong>أربيتو</strong>، حيث يلتقي الشغف بالإتقان. بدأت
            رحلتنا من فكرة بسيطة: تقديم منتجات جلدية وإكسسوارات تجمع بين الأناقة
            العصرية والجودة الأصيلة. نؤمن بأن التفاصيل تصنع الفارق، ولهذا نسعى
            دائماً لاختيار أجود الخامات وتقديم تصاميم تليق بتميزكم.
          </p>
        </div>
      </section>

      <!-- Section 2: Why Us -->
      <section class="about-section">
        <div class="container-about animate-fade-up">
          <h2>لمـاذا نـحـن؟</h2>
          <p>
            ما يميزنا هو التزامنا غير المحدود بالجودة. نحن لا نقدم مجرد منتج، بل
            نقدم تجربة. نهتم بأدق التفاصيل، من اختيار الجلد الطبيعي الفاخر وحتى
            التغليف الأنيق الذي يصل إليكم. رضاكم هو معيار نجاحنا الأول.
          </p>
          <div class="features-grid">
            <div class="feature-card">
              <i class="bi bi-gem"></i>
              <h3>جودة عالية</h3>
              <p>خامات مختارة بعناية فائقة</p>
            </div>
            <div class="feature-card">
              <i class="bi bi-palette"></i>
              <h3>تصاميم عصرية</h3>
              <p>تناسب جميع الأذواق والمناسبات</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Warranty -->
      <section class="about-section">
        <div class="container-about animate-fade-up">
          <h2>سياسـة الضـمـان</h2>
          <p>
            لأننا واثقون مما نقدم، نوفر لكم ضماناً شاملاً على عيوب الصناعة. نضمن
            لك استلام منتج مطابق للمواصفات وصور العرض. في حال وجود أي ملاحظات،
            فريق خدمة عملائنا جاهز دائماً لخدمتكم واستبدال المنتج فوراً.
          </p>
        </div>
      </section>

      <!-- Section 4: Shipping -->
      <section class="about-section">
        <div class="container-about animate-fade-up">
          <h2>شركاء النجاح وتوصيل الطلبات</h2>
          <p>
            نصل إليكم أينما كنتم في جميع أنحاء الجمهورية بأفضل جودة وأسرع وقت.
            نتعاون مع شركاء شحن موثوقين لضمان وصول طلباتكم بأمان.
          </p>
          <div class="shipping-partners">
            <div class="partner">
              <i class="bi bi-envelope-paper-fill"></i>
              <span>البريد المصري</span>
            </div>
            <div class="partner">
              <i class="bi bi-truck"></i>
              <span>Arbet Express</span>
            </div>
          </div>
        </div>
      </section>
    </main>

  @include('website.includ.footer')


</body>

</html>