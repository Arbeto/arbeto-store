<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Catetgory_prodect;
use App\Models\Order;
use App\Models\Products;
use App\Models\ShippingCompany;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PageDashboardController extends Controller
{
    public function indexDashboard()
    {
        $products = Products::all();
        $orders   = Order::with('user')->get();

        $soldOrders      = $orders->whereIn('status', ['delivered', 'on-the-way', 'out-for-delivery'])->count();
        $cancelledOrders = $orders->whereIn('status', ['cancelled', 'rejected'])->count();
        $returnedOrders  = $orders->where('status', 'failed-delivery')->count();

        $totalSales = $orders->sum('total_price');

        // حساب إجمالي الشحن بناءً على نوع الشركات (فقط الشركات اليدوية)
        $totalShipping = $orders->sum(function($order) {
            $company = ShippingCompany::find($order->shipping_company_id);
            if ($company && $company->shipping_type === 'manual') {
                return $order->express_price;
            }
            return 0;
        });

        $netProfit = $totalSales - $totalShipping;

        $totalCustomers = User::where('user_type', 'customer')->count();
        $visitors       = User::whereNotNull('last_seen')
                              ->where('last_seen', '>=', now()->subDay())
                              ->count();

        // Dynamic shipping companies with their respective shipping revenue
        $shippingCompanies = ShippingCompany::all()->map(function ($c) use ($orders) {
            // إذا كانت الشركة أوتوماتيكي (fixed) = اجعل الإيرادات = 0
            // إذا كانت الشركة يدوي (manual) = اعرض القيم الفعلية
            $total = ($c->shipping_type === 'manual')
                ? $orders->where('shipping_company_id', $c->id)->sum('express_price')
                : 0;

            return [
                'name'          => $c->name,
                'logo'          => $c->logo,
                'shipping_type' => $c->shipping_type,
                'total'         => $total,
            ];
        });

        // Top 5 products by quantity sold (from order items JSON)
        $productSales = [];
        foreach ($orders as $order) {
            foreach ($order->items ?? [] as $item) {
                $name  = $item['name']     ?? 'منتج غير معروف';
                $qty   = intval($item['quantity'] ?? 1);
                $price = floatval($item['price']  ?? 0);
                if (!isset($productSales[$name])) {
                    $productSales[$name] = ['qty' => 0, 'price' => $price];
                }
                $productSales[$name]['qty'] += $qty;
            }
        }
        uasort($productSales, fn($a, $b) => $b['qty'] <=> $a['qty']);
        $topProducts = array_slice($productSales, 0, 5, true);

        // Top 5 governorates by order count
        $topGovs = $orders->groupBy('governorate')
            ->map(fn($g) => $g->count())
            ->sortDesc()
            ->take(5);

        // Top 5 customers by total spend
        $topCustomers = $orders->groupBy('user_id')
            ->map(fn($g) => [
                'total' => $g->sum('total_price'),
                'name'  => trim((optional($g->first()->user)->first_name ?? '') . ' ' . (optional($g->first()->user)->last_name ?? '')) ?: 'غير معرف',
            ])
            ->sortByDesc('total')
            ->take(5);

        return view('dashboard.pages.index', compact(
            'products', 'soldOrders', 'cancelledOrders', 'returnedOrders',
            'totalSales', 'totalShipping', 'netProfit',
            'totalCustomers', 'visitors',
            'shippingCompanies', 'topProducts', 'topGovs', 'topCustomers'
        ));
    }

    // صفحة المنتجات
    public function showProducts()
    {
        $categories = Catetgory_prodect::all();
        return view('dashboard.pages.products', compact('categories'));
    }

    // صفحة الاقسام والعروض
    public function showcategoriesoffers()
    {
        $products = Products::all();

        // Ensure the fixed gift-box offer exists
        \App\Models\OffersPage::firstOrCreate(
            ['slug' => 'create-your-gift-box'],
            [
                'title'       => 'صمم هديتك',
                'description' => 'اختر هديتك بلمساتك الخاصة',
                'btn_text'    => 'ابدأ الآن',
                'location'    => 'home,header',
                'is_fixed'    => true,
            ]
        );

        $offers = \App\Models\OffersPage::with('products')->get();
        return view('dashboard.pages.categories-offers', compact('products', 'offers'));
    }

    // صفحة تعديل العرض
    public function editOfferPage($id)
    {
        $offer = \App\Models\OffersPage::with('products')->findOrFail($id);
        $products = Products::all();
        return view('dashboard.pages.edit-offer', compact('offer', 'products'));
    }

    // صفحة الطلبات
    public function showorders()
    {
        return view('dashboard.pages.orders');
    }

    // صفحة العملاء
    public function showcustomers()
    {
        return view('dashboard.pages.customers');
    }

    // صفحة تفاصيل العميل
    public function showCustomerDetails()
    {
        return view('dashboard.pages.customer-details');
    }

    // صفحة شركات الشحن
    public function showShippingCompanies()
    {
        $companies         = \App\Models\ShippingCompany::all();
        $governoratePrices = \App\Models\GovernorateShippingPrice::all();
        return view('dashboard.pages.shipping-companies', compact('companies', 'governoratePrices'));
    }

    // صفحة تفاصيل شركة الشحن
    public function showCompanyDetail($id)
    {
        $company = \App\Models\ShippingCompany::findOrFail($id);
        return view('dashboard.pages.company-detail', compact('company'));
    }

    // صفحة Arbeto Express
    public function showArExpress()
    {
        return view('dashboard.pages.ar-express');
    }

    // صفحة البريد المصري
    public function showEgyptPost()
    {
        return view('dashboard.pages.egypt-post');
    }

    // صفحة التقارير المالية
    public function showAnalysis()
    {
        $years = $this->getAnalysisYears();
        $defaultYear = (int) ($years->first() ?? now()->year);
        $analysisPayload = $this->resolveAnalysisPayload($defaultYear);

        return view('dashboard.pages.analysis', compact('years', 'analysisPayload'));
    }

    public function analysisData(Request $request)
    {
        $chartYear = (int) ($request->query('year', now()->year));

        return response()->json($this->resolveAnalysisPayload($chartYear));
    }

    /**
     * API: جلب الأشهر المتاحة لسنة معينة
     */
    public function getAvailableMonthsApi(Request $request)
    {
        $year = (int) $request->query('year', now()->year);
        $months = $this->getAvailableMonths($year);

        return response()->json([
            'months' => $months,
            'year' => $year,
        ]);
    }

    /**
     * API: جلب بيانات التقرير للعرض
     */
    public function getReportDataApi(Request $request)
    {
        $year = (int) $request->query('year', now()->year);
        $month = $request->query('month', 'all');

        if ($month !== 'all') {
            $month = (int) $month;
            if ($month < 1 || $month > 12) {
                return response()->json(['error' => 'شهر غير صحيح'], 400);
            }
        }

        $reportData = $this->getReportData($year, $month);

        // إضافة عنوان التقرير
        $monthNames = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
        ];

        $reportData['title'] = $month === 'all'
            ? "تقرير مالي لسنة {$year}"
            : "تقرير مالي لشهر {$monthNames[$month]} {$year}";

        return response()->json($reportData);
    }

    private function resolveAnalysisPayload(int $chartYear): array
    {
        if ($chartYear <= 0) {
            $chartYear = (int) now()->year;
        }

        $orders = Order::query()
            ->delivered()
            ->purchaseType()
            ->select(['id', 'items', 'total_price', 'express_price', 'manual_shipping_cost', 'created_at'])
            ->orderBy('created_at')
            ->get();

        $returnAmount = (float) Order::query()
            ->delivered()
            ->returnType()
            ->sum('total_price');

        $productCostMap = $this->buildProductCostMap($orders);
        $ordersWithMetrics = $orders->map(function (Order $order) use ($productCostMap) {
            $productProfit = $this->calculateOrderProductProfit($order, $productCostMap);

            return [
                'id' => $order->id,
                'date' => optional($order->created_at)->toDateString(),
                'total_price' => (float) $order->total_price,
                'express_price' => (float) $order->express_price,
                'manual_shipping_cost' => (float) $order->manual_shipping_cost,
                'product_profit' => $productProfit,
                'gross_total' => (float) $order->total_price + (float) $order->manual_shipping_cost,
            ];
        })->values();

        $totalShippingPaid = (float) $ordersWithMetrics->sum('manual_shipping_cost');
        $totalBillsAmount = (float) Bill::query()->sum('total_price');
        $grossProfit = (float) $ordersWithMetrics->sum('gross_total');
        $netProfit = (float) $ordersWithMetrics->sum('product_profit');

        return [
            'summary' => [
                'total_shipping_paid' => round($totalShippingPaid, 2),
                'total_bills' => round($totalBillsAmount, 2),
                'total_purchase_cost' => round($totalBillsAmount, 2), // backward compatibility
                'gross_profit' => round($grossProfit, 2),
                'net_profit' => round($netProfit, 2),
                'returns_total' => round($returnAmount, 2),
            ],
            'chart_year' => $chartYear,
            'weekly' => $this->buildWeeklySeries($ordersWithMetrics),
            'yearly' => $this->buildYearlySeries($ordersWithMetrics, $chartYear),
            'orders' => $ordersWithMetrics,
            'years' => $this->getAnalysisYears(),
        ];
    }

    // صفحة إعدادات المتجر
    public function showStoreSettings()
    {
        return view('dashboard.pages.store-settings');
    }

    // صفحة فواتير الشراء
    public function showBills()
    {
        return view('dashboard.pages.bills');
    }

    // صفحة المخزون
    public function showInventory()
    {
        return view('dashboard.pages.Inventory');
    }

    // صفحة المشرفون والتجار
    public function showTraderManager()
    {
        return view('dashboard.pages.trader_manager');
    }

    // البحث عن مستخدمين لتعيينهم كمشرف/تاجر
    public function searchUsers(Request $request)
    {
        $actor = Auth::user();
        if (!$actor || $actor->user_type !== 'ceo') {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $queryText  = trim((string) $request->query('q', ''));
        $targetRole = (string) $request->query('target_role', '');
        $includeSameRole = filter_var((string) $request->query('include_same_role', '0'), FILTER_VALIDATE_BOOLEAN);

        $query = User::query()->where('user_type', '!=', 'ceo');

        if (in_array($targetRole, ['manager', 'trader'])) {
            if ($includeSameRole) {
                $query->where('user_type', $targetRole);
            } else {
                $query->where('user_type', '!=', $targetRole);
            }
        }

        if ($queryText !== '') {
            $query->where(function ($inner) use ($queryText) {
                if (ctype_digit($queryText)) {
                    $inner->orWhere('id', (int) $queryText);
                }

                $inner->orWhere('first_name', 'like', "%{$queryText}%")
                    ->orWhere('last_name', 'like', "%{$queryText}%")
                    ->orWhereRaw("CONCAT(COALESCE(first_name,''),' ',COALESCE(last_name,'')) LIKE ?", ["%{$queryText}%"])
                    ->orWhere('email', 'like', "%{$queryText}%")
                    ->orWhere('phone', 'like', "%{$queryText}%");
            });
        }

        $usersQuery = $query
            ->orderByDesc('id');

        if (!$includeSameRole || $queryText !== '') {
            $usersQuery->limit(20);
        }

        $users = $usersQuery->get(['id', 'first_name', 'last_name', 'email', 'phone', 'user_type']);

        return response()->json($users->map(function ($user) {
            return [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'full_name'  => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'email'      => $user->email,
                'phone'      => $user->phone,
                'user_type'  => $user->user_type,
            ];
        })->values());
    }

    // تحديث صلاحية مجموعة مستخدمين
    public function updateUsersRole(Request $request)
    {
        $actor = Auth::user();
        if (!$actor || $actor->user_type !== 'ceo') {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $data = $request->validate([
            'target_role' => 'required|in:manager,trader',
            'user_ids'    => 'required|array|min:1',
            'user_ids.*'  => 'required|integer|exists:users,id',
        ]);

        $userIds = collect($data['user_ids'])->unique()->values()->all();

        $updated = User::whereIn('id', $userIds)
            ->where('user_type', '!=', 'ceo')
            ->update(['user_type' => $data['target_role']]);

        return response()->json([
            'message'       => $updated ? "تم تحديث صلاحية {$updated} مستخدم" : 'لم يتم تحديث أي مستخدم',
            'updated_count' => $updated,
            'target_role'   => $data['target_role'],
        ]);
    }

    // تخفيض صلاحية مستخدم إلى customer
    public function downgradeUserRole(Request $request)
    {
        $actor = Auth::user();
        if (!$actor || $actor->user_type !== 'ceo') {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $target = User::find($data['user_id']);
        if (!$target || $target->user_type === 'ceo') {
            return response()->json(['message' => 'لا يمكن تغيير صلاحية هذا المستخدم'], 403);
        }

        $target->update(['user_type' => 'customer']);

        return response()->json([
            'message' => 'تم تحويل المستخدم إلى عميل (customer) بنجاح',
            'user_id' => $target->id,
        ]);
    }

    private function getAnalysisYears()
    {
        $orderYears = Order::query()
            ->selectRaw('YEAR(created_at) as year')
            ->whereNotNull('created_at')
            ->pluck('year');

        $billYears = Bill::query()
            ->selectRaw('YEAR(date) as year')
            ->whereNotNull('date')
            ->pluck('year');

        return $orderYears
            ->merge($billYears)
            ->push((int) now()->year)
            ->filter(fn ($year) => !empty($year))
            ->map(fn ($year) => (int) $year)
            ->unique()
            ->sortDesc()
            ->values();
    }

    private function buildProductCostMap($orders): array
    {
        $productIds = [];

        foreach ($orders as $order) {
            $items = is_array($order->items) ? $order->items : [];
            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                if ($productId > 0) {
                    $productIds[] = $productId;
                }
            }
        }

        $productIds = array_values(array_unique($productIds));
        if (empty($productIds)) {
            return [];
        }

        $products = Products::query()
            ->with(['inventoryItem:id,purchase_price', 'inventoryItems:id,purchase_price'])
            ->whereIn('id', $productIds)
            ->get(['id', 'inventory_item_id']);

        $costMap = [];
        foreach ($products as $product) {
            $purchasePrice = 0.0;

            if ($product->inventoryItem) {
                $purchasePrice = (float) $product->inventoryItem->purchase_price;
            } elseif ($product->inventoryItems->isNotEmpty()) {
                $purchasePrice = (float) $product->inventoryItems->first()->purchase_price;
            }

            $costMap[(int) $product->id] = $purchasePrice;
        }

        return $costMap;
    }

    private function calculateOrderProductProfit(Order $order, array $productCostMap): float
    {
        $items = is_array($order->items) ? $order->items : [];
        $profit = 0.0;

        foreach ($items as $item) {
            $qty = max(1, (int) ($item['quantity'] ?? $item['qty'] ?? 1));
            $sellingPrice = (float) ($item['price'] ?? 0);
            $sellingTotal = isset($item['total'])
                ? (float) $item['total']
                : ($sellingPrice * $qty);

            $costTotal = 0.0;
            $deduction = $item['inventory_deduction'] ?? null;

            if (is_array($deduction) && !empty($deduction)) {
                foreach ($deduction as $chunk) {
                    $chunkQty = (float) ($chunk['quantity'] ?? 0);
                    $chunkPurchase = (float) ($chunk['unit_purchase_price'] ?? 0);
                    if ($chunkQty > 0 && $chunkPurchase > 0) {
                        $costTotal += $chunkQty * $chunkPurchase;
                    }
                }
            }

            if ($costTotal <= 0) {
                $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                $purchasePrice = $productCostMap[$productId] ?? 0.0;
                $costTotal = $purchasePrice * $qty;
            }

            $profit += ($sellingTotal - $costTotal);
        }

        return round($profit, 2);
    }

    private function buildWeeklySeries($orders)
    {
        $start = Carbon::now()->startOfDay()->subDays(6);
        $end = Carbon::now()->endOfDay();

        $weekdayLabels = [
            1 => 'الاثنين',
            2 => 'الثلاثاء',
            3 => 'الأربعاء',
            4 => 'الخميس',
            5 => 'الجمعة',
            6 => 'السبت',
            7 => 'الأحد',
        ];

        $bucket = [];
        $labels = [];

        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $key = $day->toDateString();
            $labels[] = $weekdayLabels[$day->dayOfWeekIso] ?? $key;
            $bucket[$key] = [
                'revenue' => 0.0,
                'profit' => 0.0,
                'orders' => 0,
            ];
        }

        foreach ($orders as $order) {
            if (empty($order['date']) || !isset($bucket[$order['date']])) {
                continue;
            }

            // الإيرادات = total_price + manual_shipping_cost
            $revenue = (float) ($order['total_price'] ?? 0) + (float) ($order['manual_shipping_cost'] ?? 0);
            $bucket[$order['date']]['revenue'] += $revenue;
            $bucket[$order['date']]['profit'] += (float) ($order['product_profit'] ?? 0);
            $bucket[$order['date']]['orders'] += 1;
        }

        return [
            'labels' => $labels,
            'datasets' => [
                'revenue' => array_values(array_map(fn ($row) => round($row['revenue'], 2), $bucket)),
                'profit' => array_values(array_map(fn ($row) => round($row['profit'], 2), $bucket)),
                'orders' => array_values(array_map(fn ($row) => $row['orders'], $bucket)),
            ],
        ];
    }

    private function buildYearlySeries($orders, int $year)
    {
        $monthLabels = [
            1 => 'يناير',
            2 => 'فبراير',
            3 => 'مارس',
            4 => 'أبريل',
            5 => 'مايو',
            6 => 'يونيو',
            7 => 'يوليو',
            8 => 'أغسطس',
            9 => 'سبتمبر',
            10 => 'أكتوبر',
            11 => 'نوفمبر',
            12 => 'ديسمبر',
        ];

        $bucket = [];
        for ($month = 1; $month <= 12; $month++) {
            $bucket[$month] = [
                'revenue' => 0.0,
                'profit' => 0.0,
                'orders' => 0,
            ];
        }

        foreach ($orders as $order) {
            if (empty($order['date'])) {
                continue;
            }

            $date = Carbon::parse($order['date']);
            if ((int) $date->year !== $year) {
                continue;
            }

            $month = (int) $date->month;
            // الإيرادات = total_price + manual_shipping_cost
            $revenue = (float) ($order['total_price'] ?? 0) + (float) ($order['manual_shipping_cost'] ?? 0);
            $bucket[$month]['revenue'] += $revenue;
            $bucket[$month]['profit'] += (float) ($order['product_profit'] ?? 0);
            $bucket[$month]['orders'] += 1;
        }

        return [
            'labels' => array_values($monthLabels),
            'datasets' => [
                'revenue' => array_values(array_map(fn ($row) => round($row['revenue'], 2), $bucket)),
                'profit' => array_values(array_map(fn ($row) => round($row['profit'], 2), $bucket)),
                'orders' => array_values(array_map(fn ($row) => $row['orders'], $bucket)),
            ],
        ];
    }

    /**
     * جلب الأشهر المتاحة في البيانات لسنة محددة
     */
    private function getAvailableMonths(int $year): array
    {
        $orderMonths = Order::query()
            ->selectRaw('DISTINCT MONTH(created_at) as month')
            ->whereYear('created_at', $year)
            ->pluck('month')
            ->filter()
            ->toArray();

        $billMonths = Bill::query()
            ->selectRaw('DISTINCT MONTH(date) as month')
            ->whereYear('date', $year)
            ->pluck('month')
            ->filter()
            ->toArray();

        $months = array_unique(array_merge($orderMonths, $billMonths));
        sort($months);
        return $months;
    }

    /**
     * جلب بيانات التقرير حسب الفترة المحددة
     */
    private function getReportData(int $year, $month = null): array
    {
        // جلب الأوردرات المفلترة حسب السنة والشهر
        $ordersQuery = Order::query()
            ->with(['user', 'shippingCompany'])
            ->whereYear('created_at', $year);

        if ($month && $month !== 'all') {
            $ordersQuery->whereMonth('created_at', $month);
        }

        $allOrders = $ordersQuery->get();
        $deliveredOrders = $allOrders->where('status', 'delivered');

        // جلب الفواتير المفلترة
        $billsQuery = Bill::query()
            ->with(['supplier', 'items'])
            ->whereYear('date', $year);

        if ($month && $month !== 'all') {
            $billsQuery->whereMonth('date', $month);
        }

        $bills = $billsQuery->get();

        return [
            'shipping_companies' => $this->buildShippingCompaniesReport($allOrders, $deliveredOrders),
            'orders' => $this->buildOrdersReport($allOrders, $deliveredOrders),
            'bills' => $this->buildBillsReport($bills),
            'statistics' => $this->buildReportStatistics($deliveredOrders, $bills, $allOrders),
            'year' => $year,
            'month' => $month,
        ];
    }

    /**
     * بناء جدول شركات الشحن للتقرير
     */
    private function buildShippingCompaniesReport($allOrders, $deliveredOrders): array
    {
        $companies = ShippingCompany::with('governoratePrices')->get();
        $companiesData = [];

        foreach ($companies as $company) {
            $companyOrders = $allOrders->where('shipping_company_id', $company->id);
            $companyDelivered = $deliveredOrders->where('shipping_company_id', $company->id);

            // حساب totalShipping (مصروفات الشركة)
            if ($company->shipping_type === 'fixed') {
                $govPrices = [];
                foreach ($company->governoratePrices as $govPrice) {
                    $govPrices[$govPrice->governorate_name] = (float) $govPrice->price;
                }

                $totalShipping = $companyOrders->sum(function($order) use ($govPrices) {
                    return $govPrices[$order->governorate] ?? (float) $order->express_price;
                });
            } else {
                $totalShipping = $companyOrders->sum('manual_shipping_cost');
            }

            // حساب netProfit (أرباح الشركة)
            $totalPaid = $companyOrders->sum('express_price');
            $netProfit = $totalPaid - $totalShipping;

            $companiesData[] = [
                'name' => $company->name,
                'shipping_type' => $company->shipping_type, // إضافة نوع الشحن
                'total_orders' => $companyOrders->count(),
                'delivered_orders' => $companyDelivered->count(),
                'total_shipping' => round($totalShipping, 2),
                'net_profit' => round($netProfit, 2),
            ];
        }

        return $companiesData;
    }

    /**
     * بناء جدول الطلبات للتقرير
     */
    private function buildOrdersReport($allOrders, $deliveredOrders): array
    {
        $purchaseOrders = $allOrders->filter(fn($order) => $order->order_type !== 'return');
        $deliveredPurchaseOrders = $deliveredOrders->filter(fn($order) => $order->order_type !== 'return');

        $totalOrders = $purchaseOrders->count();
        $delivered = $deliveredPurchaseOrders->count();

        $cancelled = $purchaseOrders->whereIn('status', [
            'failed-delivery',
            'cancelled',
            'rejected'
        ])->count();

        $returned = $allOrders->where('order_type', 'return')
            ->where('status', 'delivered')
            ->count();

        $totalAmount = $deliveredPurchaseOrders->sum('total_price');

        return [
            'total_orders' => $totalOrders,
            'delivered' => $delivered,
            'cancelled' => $cancelled,
            'returned' => $returned,
            'total_amount' => round($totalAmount, 2),
        ];
    }

    /**
     * بناء جدول الفواتير للتقرير
     */
    private function buildBillsReport($bills): array
    {
        $billsData = [];

        foreach ($bills as $bill) {
            $billsData[] = [
                'invoice_number' => $bill->invoice_number,
                'products_count' => $bill->items->count(),
                'supplier_name' => optional($bill->supplier)->name ?? 'غير محدد',
                'total_price' => round((float) $bill->total_price, 2),
            ];
        }

        return $billsData;
    }

    /**
     * بناء الإحصائيات الكتابية للتقرير
     */
    private function buildReportStatistics($deliveredOrders, $bills, $allOrders): array
    {
        // 1. مصروفات (عدد الفواتير)
        $expenses = $bills->count();

        // 2. أرباح المنتجات (مجموع total_price من الأوردرات المستلمة)
        $productRevenue = $deliveredOrders->sum('total_price');

        // 3. حساب أرباح شركات التوصيل
        $shippingCompaniesData = $this->buildShippingCompaniesReport($allOrders, $deliveredOrders);
        $shippingProfit = collect($shippingCompaniesData)->sum('net_profit');

        // 4. حساب صافي الربح من المنتجات
        $productCostMap = $this->buildProductCostMap($deliveredOrders);
        $productNetProfit = 0;

        foreach ($deliveredOrders as $order) {
            $productNetProfit += $this->calculateOrderProductProfit($order, $productCostMap);
        }

        // 5. صافي الربح الكلي
        $netProfit = $productNetProfit + $shippingProfit;

        return [
            'expenses' => $expenses,
            'product_revenue' => round($productRevenue, 2),
            'shipping_profit' => round($shippingProfit, 2),
            'product_net_profit' => round($productNetProfit, 2),
            'net_profit' => round($netProfit, 2),
        ];
    }
}
