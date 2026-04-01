@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/analysis.css')}}">
</head>

<body>
@include('dashboard.include.sidebar')
<div class="dashboard-container">
<div class="page-header">
<h1><i class="bi bi-bar-chart-line"></i> التقارير المالية</h1>
<p>تحليل شامل للأداء المالي والإحصائيات</p>
</div>

<!-- Financial Statistics -->
<div class="financial-stats">

<div class="stat-card">
<div class="stat-icon"><i class="bi bi-truck"></i></div>
<div class="stat-content">
<div class="stat-label">إجمالي مبالغ الشحن المدفوعة</div>
<div class="stat-value" id="totalShippingPaid">0 جنيه</div>
</div>
</div>

<div class="stat-card">
<div class="stat-icon"><i class="bi bi-receipt"></i></div>
<div class="stat-content">
<div class="stat-label">إجمالي الفواتير</div>
<div class="stat-value" id="totalBills">0 جنيه</div>
</div>
</div>

<div class="stat-card profit">
<div class="stat-icon"><i class="bi bi-graph-up"></i></div>
<div class="stat-content">
<div class="stat-label">الأرباح الإجمالية</div>
<div class="stat-value" id="totalProfit">0 جنيه</div>
</div>
</div>

<div class="stat-card net-profit">
<div class="stat-icon"><i class="bi bi-cash-coin"></i></div>
<div class="stat-content">
<div class="stat-label">صافي الربح (بعد الخصومات)</div>
<div class="stat-value" id="netProfit">0 جنيه</div>
</div>
</div>

<div class="stat-card loss">
<div class="stat-icon"><i class="bi bi-arrow-return-left"></i></div>
<div class="stat-content">
<div class="stat-label">المرتجعات</div>
<div class="stat-value" id="returnsTotal">0 جنيه</div>
</div>
</div>
</div>

<!-- Charts Section -->
<div class="charts-section">
<div class="chart-container">
<div class="chart-header">
<h3>الإحصائيات الأسبوعية</h3>
<select id="weeklyFilter" class="chart-filter">
<option value="revenue">الإيرادات</option>
<option value="profit">الأرباح</option>
<option value="orders">الطلبات</option>
</select>
</div>
<canvas id="weeklyChart"></canvas>
</div>

<div class="chart-container">
<div class="chart-header">
<h3>الإحصائيات السنوية</h3>
<select id="yearlyFilter" class="chart-filter">
<option value="revenue">الإيرادات</option>
<option value="profit">الأرباح</option>
<option value="orders">الطلبات</option>
</select>
</div>
<div id="yearlyChartWrapper">
<canvas id="yearlyChart"></canvas>
<div id="noYearlyDataMessage" style="display: none; text-align: center; padding: 40px; color: #999;">
<i class="bi bi-info-circle" style="font-size: 2rem;"></i>
<p style="margin-top: 10px;">لا توجد بيانات سنوية حاليا</p>
</div>
</div>
</div>
</div>

<!-- Report Generator -->
<div class="report-generator">
<h2 class="section-title">
<i class="bi bi-file-earmark-pdf"></i>
طلب تقرير مالي
</h2>

<div class="report-filters">
<div class="filter-group">
<label>السنة</label>
<select id="reportYearSelect" onchange="updateMonthOptions()">
@foreach(($years ?? collect([now()->year])) as $year)
<option value="{{ $year }}">{{ $year }}</option>
@endforeach
</select>
</div>

<div class="filter-group">
<label>الشهر</label>
<select id="reportMonthSelect">
<option value="all">الكل</option>
</select>
</div>

<button class="btn-apply" onclick="generateAdvancedReport()">
<i class="bi bi-check-circle"></i>
تطبيق
</button>
</div>

<div id="reportPreview" class="report-preview" style="display: none;">
<div class="preview-header">
<h3 id="reportTitle"></h3>
<button class="btn-view-pdf" onclick="viewAdvancedPDF()">
<i class="bi bi-file-pdf"></i>
عرض ملف PDF
</button>
</div>
</div>
</div>
</div>
@include('dashboard.include.toast')

<!-- Hidden PDF Template -->
<div id="pdfTemplate" style="display: none;"></div>

<script id="analysisBootstrapData" type="application/json">{!! json_encode($analysisPayload ?? null, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}</script>
<script>
window.analysisConfig = {
dataUrl: "{{ route('dashboard.analysis.data') }}",
availableMonthsUrl: "{{ route('dashboard.analysis.available-months') }}",
reportDataUrl: "{{ route('dashboard.analysis.report-data') }}"
};
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script src="{{asset('arbeto_dashboard/js/analysis.js')}}"></script>
@include('dashboard.include.footer')