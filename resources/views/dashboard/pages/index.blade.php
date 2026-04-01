
@include('dashboard.include.head')

  </head>
<body>
    @include('dashboard.include.sidebar')
    <div class="container-dashboard">
        <!-- بطاقات الاحصائية -->
        <div class="cadrs-details">
            <!-- المنتجات المتاحة -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/boxes.png')}}" alt="">
                <div class="card-content">
                    <p>عدد المنتجات المتاحة</p>
                    <h2>{{$products->where('type', 'product')->count()}} <span>منتج</span></h2>
                </div>
            </div>

             <!-- Arbeto Boxs -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/gift.png')}}" alt="">
                <div class="card-content">
                    <p>عدد بوكسات اربيتو</p>
                    <h2>{{$products->where('type', 'box')->count()}} <span>بوكس متاح</span></h2>
                </div>
            </div>

            <!-- عدد الأوردرات -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/checklist.png')}}" alt="">
                <div class="card-content">
                    <p>عدد الأوردرات المباعة</p>
                    <h2>{{ $soldOrders }} <span>أوردر</span></h2>
                </div>
            </div>

            <!-- العملاء -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/people.png')}}" alt="">
                <div class="card-content">
                    <p>العملاء</p>
                    <h2>{{ $totalCustomers }} <span>عميل</span></h2>
                </div>
            </div>

            <!-- عدد الزوار -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/audience.png')}}" alt="">
                <div class="card-content">
                    <p>عدد الزوار</p>
                    <h2>{{ $visitors }} <span>زائر</span></h2>
                </div>
            </div>

            @php $isCeo = auth()->user()?->user_type === 'ceo'; @endphp
            @if($isCeo)
                <!-- المبيعات -->
                <div class="card">
                    <img src="{{asset('arbeto_dashboard/image/dashboard/price-tag.png')}}" alt="">
                    <div class="card-content">
                        <p>المبيعات</p>
                        <h2>{{ number_format($totalSales, 2) }} <span>جنية</span></h2>
                    </div>
                </div>

                <!-- صافي الربح -->
                <div class="card">
                    <img src="{{asset('arbeto_dashboard/image/dashboard/profits.png')}}" alt="">
                    <div class="card-content">
                        <p>صافي الربح</p>
                        <h2>{{ number_format($netProfit, 2) }} <span>جنية</span></h2>
                    </div>
                </div>
                @endif

            <!-- المرتجعات -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/loss.png')}}" alt="">
                <div class="card-content">
                    <p>عدد المرتجعات</p>
                    <h2 style="color: rgb(201, 59, 59);">{{ $returnedOrders }} <span>أوردر</span></h2>
                </div>
            </div>

            <!-- الاوردرات الملغية -->
            <div class="card">
                <img src="{{asset('arbeto_dashboard/image/dashboard/wrong-parcel.png')}}" alt="">
                <div class="card-content">
                    <p>عدد الأوردرات الملغية</p>
                    <h2 style="color: rgb(201, 59, 59);">{{ $cancelledOrders }} <span>أوردر</span></h2>
                </div>
            </div>

            @if($isCeo)
                <!-- مدفوعات الشحن -->
                <div class="card">
                    <img src="{{asset('arbeto_dashboard/image/dashboard/cod.png')}}" alt="">
                    <div class="card-content">
                        <p>المبالغ المدفوعة للشحن</p>
                        <h2>{{ number_format($totalShipping, 2) }} <span>جنية</span></h2>
                    </div>
                </div>

                <!-- شركات الشحن - ديناميكية -->
                @foreach ($shippingCompanies as $company)
                <div class="card">
                    <img style="border-radius: 50%;" src="{{ $company['logo'] ?: asset('arbeto_dashboard/image/dashboard/boxes.png') }}" alt="{{ $company['name'] }}">
                    <div class="card-content">
                        <p>شحن عن طريق {{ $company['name'] }}</p>
                        <h2>{{ number_format($company['total'], 2) }} <span>جنية</span></h2>
                    </div>
                </div>
                @endforeach
                @endif

        </div>

        <!-- ترتيب أفضل -->
        <div class="container-top-5">

            <!-- أفضل المنتجات مبيعا -->
            <div class="table-top-product card-table">
                <h3>افضل المنتجات مبيعا</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الكمية المباعة</th>
                            <th>اسم المنتج</th>
                            <th>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($topProducts as $name => $data)
                        <tr>
                            <td>{{ $data['qty'] }} قطعة</td>
                            <td>{{ $name }}</td>
                            <td>{{ $loop->iteration }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="3">لا توجد بيانات</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <!-- اعلى المحافظات طلبا -->
            <div class="table-top-city card-table">
                <h3>اعلى المحافظات طلبا</h3>
                <table>
                    <thead>
                        <tr>
                            <th>العدد</th>
                            <th>العنوان</th>
                            <th>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($topGovs as $gov => $count)
                        <tr>
                            <td>{{ $count }}</td>
                            <td>{{ $gov ?: 'غير محدد' }}</td>
                            <td>{{ $loop->iteration }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="3">لا توجد بيانات</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <!-- اعلى العملاء طلبا -->
            <div class="table-top-customer card-table">
                <h3>اعلى العملاء طلبا</h3>
                <table>
                    <thead>
                        <tr>
                            <th>السعر</th>
                            <th>اسم العميل</th>
                            <th>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($topCustomers as $customer)
                        <tr>
                            <td>{{ number_format($customer['total'], 2) }} جنية</td>
                            <td>{{ $customer['name'] }}</td>
                            <td>{{ $loop->iteration }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="3">لا توجد بيانات</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    @include('dashboard.include.footer')