@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/customers.css')}}">
</head>

<body>
    @include('dashboard.include.sidebar')
    <div class="dashboard-container">
        <div class="page-header">
            <h1><i class="bi bi-people"></i> إدارة العملاء</h1>
            <p>عرض ومتابعة بيانات العملاء المسجلين</p>
        </div>

        <!-- Customers Grid -->
        <div id="customersGrid" class="customers-grid">
            <!-- Customer cards will be loaded here -->
        </div>

        <!-- Pagination -->
        <div class="pagination" id="pagination">
            <!-- Pagination controls will be loaded here -->
        </div>
    </div>
    @include('dashboard.include.toast')
    <script src="{{asset('arbeto_dashboard/js/customers.js')}}"></script>
    @include('dashboard.include.footer')