  <header>
    <div class="logo" style="margin-bottom: 15px; padding-top: 15px">
      @if(!empty($storeSettings?->logo))
        <img src="{{ asset('storage/'.$storeSettings->logo) }}" alt="Logo">
      @else
        <img src="{{ asset('arbeto_dashboard/image/logo-nunbg.png') }}" alt="Logo">
      @endif
    </div>
  </header>
  @php
      $currentUser = auth()->user();
      $role = $currentUser?->user_type;
      $isCeo = $role === 'ceo';
      $isManager = $role === 'manager';
      $isTrader = $role === 'trader';
      $roleLabel = $isCeo ? 'المدير التنفيذي' : ($isManager ? 'مشرف المتجر' : ($isTrader ? 'تاجر المتجر' : 'مدير المتجر'));
      $displayName = trim(($currentUser?->first_name ?? '').' '.($currentUser?->last_name ?? ''));
      if ($displayName === '') {
        $displayName = $currentUser?->name ?? '';
      }
      $sidebarRoleClass = $isCeo ? 'role-ceo' : ($isManager ? 'role-manager' : '');
    @endphp
  <nav class="sidebar {{ $sidebarRoleClass }}">
    <div class="side-name">
      <img class="user-image" src="{{asset('arbeto_dashboard/image/dashboard/user.png')}}" alt="">
      <span class="side-role-title">{{ $roleLabel }}</span>
      @if(!empty($displayName))
      <span class="side-user-name">{{ $displayName }}</span>
      @endif
      <div class="side-actions">
        <a href="/" class="side-action-btn visit-site-btn">زيارة الموقع</a>
        <form method="POST" action="{{ route('logout') }}" class="side-action-form">
          @csrf
          <button type="submit" class="side-action-btn logout-side-btn">تسجيل الخروج</button>
        </form>
      </div>
    </div>

    <div class="dvaider"></div>

    <ul class="page-sidebar">
      @if($isTrader)
      <label class="title-category-sidebar">اعدادات التاجر </label>
      <li class="{{ request()->routeIs('dashboard.store-settings') ? 'active' : '' }}"><a href="{{ route('dashboard.store-settings') }}">إعدادات المتجر <span style="font-size: 20px;" class="bi bi-gear-fill"></span></a></li>
      <label class="title-category-sidebar">المنتجات</label>
      <li class="{{ request()->routeIs('dashboard.products') ? 'active' : '' }}"><a href="{{route('dashboard.products')}}">المنتجات <span style="font-size: 20px;" class="bi bi-box-seam-fill"></span></a></li>
      @else
      <label class="title-category-sidebar">لوحة التحكم والاعدادات </label>
      <li class="{{ request()->routeIs('dashboard.index') ? 'active' : '' }}"><a href="{{route('dashboard.index')}}">لوحة التحكم <span style="font-size: 20px;" class="bi bi-speedometer"></span></a></li>
      <li class="{{ request()->routeIs('dashboard.store-settings') ? 'active' : '' }}"><a href="{{ route('dashboard.store-settings') }}">إعدادات المتجر <span style="font-size: 20px;" class="bi bi-gear-fill"></span></a></li>
      <li class="{{ request()->routeIs('my.account') ? 'active' : '' }}"><a href="{{ route('my.account') }}">إعدادات التاجر <span style="font-size: 20px;" class="bi bi-person-vcard-fill"></span></a></li>
      <label class="title-category-sidebar">المنتجات والطلبات</label>
      <li class="{{ request()->routeIs('dashboard.products') ? 'active' : '' }}"><a href="{{route('dashboard.products')}}">المنتجات <span style="font-size: 20px;" class="bi bi-box-seam-fill"></span></a></li>
      <li class="{{ request()->routeIs('dashboard.categories-offers') ? 'active' : '' }}"><a href="{{route('dashboard.categories-offers')}}">الصور والعروض <span style="font-size: 20px;" class="bi bi-image"></span></a></li>
      <li class="{{ request()->routeIs('dashboard.orders') ? 'active' : '' }}"><a href="{{route('dashboard.orders')}}">الطلبات <span style="font-size: 20px;" class="bi bi-clipboard2-minus-fill"></span></a></li>
      <label class="title-category-sidebar">الادارة والعملاء</label>
      @if($isCeo)
      <li class="{{ request()->routeIs('dashboard.trader-manager') ? 'active' : '' }}"><a href="{{route('dashboard.trader-manager')}}">المشرفون والتجار <span style="font-size: 20px;" class="bi bi-person-badge-fill"></span></a></li>
      @endif
      <li class="{{ request()->routeIs('dashboard.customers') || request()->routeIs('dashboard.customer-details') ? 'active' : '' }}"><a href="{{route('dashboard.customers')}}">العملاء <span style="font-size: 20px;" class="bi bi-people-fill"></span></a></li>
      <label class="title-category-sidebar">الفواتير والمخزون</label>
      <li class="{{ request()->routeIs('dashboard.bills') ? 'active' : '' }}"><a href="{{ route('dashboard.bills') }}">فواتير الشراء <span style="font-size: 20px;" class="bi bi-receipt-cutoff"></span></a></li>
      <li class="{{ request()->routeIs('dashboard.inventory') ? 'active' : '' }}"><a href="{{ route('dashboard.inventory') }}">المخزون <span style="font-size: 20px;" class="bi bi-box-seam-fill"></span></a></li>
      <label class="title-category-sidebar">شركات الشحن</label>
      <li class="{{ request()->routeIs('dashboard.shipping-companies') ? 'active' : '' }}"><a href="{{route('dashboard.shipping-companies')}}">ادارة شركات الشحن <span style="font-size: 20px;" class="bi bi-box-seam-fill"></span></a></li>
      @php
      try {
      $sidebarShippingCompanies = \App\Models\ShippingCompany::all();
      } catch (\Exception $e) {
      $sidebarShippingCompanies = collect([]);
      }
      @endphp
      @foreach($sidebarShippingCompanies as $sCompany)
      <li class="{{ request()->routeIs('dashboard.company-detail') && request()->route('id') == $sCompany->id ? 'active' : '' }}">
        <a href="{{ route('dashboard.company-detail', $sCompany->id) }}">
          {{ $sCompany->name }}
          @if($sCompany->logo)
          <img src="{{ asset($sCompany->logo) }}" style="width:22px;height:22px;object-fit:contain;border-radius:4px;vertical-align:middle;margin-right:4px;" alt="">
          @else
          <span style="font-size: 20px;" class="bi bi-building"></span>
          @endif
        </a>
      </li>
      @endforeach
      @if($isCeo)
      <label class="title-category-sidebar">الإحصائيات</label>
      <li class="{{ request()->routeIs('dashboard.Analysis') ? 'active' : '' }}"><a href="{{route('dashboard.Analysis')}}">التقارير المالية <span style="font-size: 20px;" class="bi bi-bar-chart-line-fill"></span></a></li>
      @endif
      @endif
    </ul>
  </nav>