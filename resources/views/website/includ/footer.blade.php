@php
    $dashboardUser = auth()->user();
    $dashboardRole = $dashboardUser?->user_type;
    $showDashboardFab = in_array($dashboardRole, ['ceo', 'manager', 'trader'], true);
    $dashboardFabHref = $dashboardRole === 'trader'
        ? url('/dashboard-admin/products')
        : url('/dashboard-admin');
    $dashboardFabClass = match ($dashboardRole) {
        'ceo' => 'dashboard-fab--ceo',
        'manager' => 'dashboard-fab--manager',
        'trader' => 'dashboard-fab--trader',
        default => '',
    };
@endphp

@if($showDashboardFab)
<a
    href="{{ $dashboardFabHref }}"
    class="dashboard-fab {{ $dashboardFabClass }}"
    data-tooltip="الانتقال الى لوحة التحكم"
    aria-label="الانتقال الى لوحة التحكم"
>
    <span class="bi bi-speedometer2"></span>
</a>
@endif

<div class="up"><span class="bi bi-arrow-up-short"></span></div>

<footer>
    <section class="contact-footer">
        @if(!empty($storeSettings?->support_email))
        <a href="mailto:{{ $storeSettings->support_email }}" class="card-footer">
            <span class="bi bi-envelope-fill"></span>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <label>الدعم عبر البريد الإلكتروني</label>
                <p>{{ $storeSettings->support_email }}</p>
            </div>
        </a>
        @endif
        @if(!empty($storeSettings?->support_phone))
        <a href="tel:{{ $storeSettings->support_phone }}" class="card-footer">
            <span class="bi bi-telephone-fill"></span>
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <label>الدعم عبر الهاتف</label>
                <p>{{ $storeSettings->support_phone }}</p>
            </div>
        </a>
        @endif
    </section>

    <section class="category-footer">
        <ul>
            @foreach($categories as $category)
            <a href="{{ route('category.show', $category->slug) }}">
                <li>{{$category->name}}</li>
            </a>
            @endforeach
            @foreach($offerPages as $offerPage)
            @if(str_contains($offerPage->location, 'footer'))
            <a href="{{ route('offer.show', $offerPage->slug) }}">
                <li>{{ $offerPage->title }}</li>
            </a>
            @endif
            @endforeach

        </ul>
        <div class="social-footer">
            @if(!empty($storeSettings?->facebook_url))
            <a href="{{ $storeSettings->facebook_url }}" target="_blank" rel="noopener" class="bi bi-facebook"></a>
            @endif
            @if(!empty($storeSettings?->whatsapp_url))
            <a href="{{ $storeSettings->whatsapp_url }}" target="_blank" rel="noopener" class="bi bi-whatsapp"></a>
            @endif
            @if(!empty($storeSettings?->instagram_url))
            <a href="{{ $storeSettings->instagram_url }}" target="_blank" rel="noopener" class="bi bi-instagram"></a>
            @endif
            @if(!empty($storeSettings?->tiktok_url))
            <a href="{{ $storeSettings->tiktok_url }}" target="_blank" rel="noopener" class="bi bi-tiktok"></a>
            @endif
            @if(!empty($storeSettings?->twitter_url))
            <a href="{{ $storeSettings->twitter_url }}" target="_blank" rel="noopener" class="bi bi-twitter-x"></a>
            @endif
            @if(!empty($storeSettings?->youtube_url))
            <a href="{{ $storeSettings->youtube_url }}" target="_blank" rel="noopener" class="bi bi-youtube"></a>
            @endif
        </div>
    </section>

    <section class="line-footer">
        <span>جميع الحقوق محفوظة .Arbeto 2026©</span>
        <a href="{{ route('about') }}"> Arbeto حول</a>
    </section>
</footer>

<!-- JavaScript للسلايدر -->
<script src="{{asset('Arbeto/js/header.js')}}"></script>
<script src="{{asset('Arbeto/js/auth-sidebar.js')}}"></script>