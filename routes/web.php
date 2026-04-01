<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderWebController;
use App\Http\Controllers\PageDashboardController;
use App\Http\Controllers\WebAuthController;
use App\Http\Controllers\WebShopController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

// ================== website (public) ================== \\
Route::get('/', [HomeController::class, 'indexWeb'])->name('index');
Route::get('/search', [HomeController::class, 'showSearch'])->name('search');
Route::post('/update-last-seen', function () {
    if (Auth::check()) {
        $user = Auth::user();
        if ($user instanceof User) {
            $user->update(['last_seen' => now()]);
        }
    }
    return response()->json(['ok' => true]);
});
Route::get('/product/{id}', [HomeController::class, 'showProduct'])->name('product.show');
Route::get('/category/{slug}', [HomeController::class, 'showCategory'])->name('category.show');
Route::get('/offer/{slug}', [HomeController::class, 'showOfferPage'])->name('offer.show');
Route::get('/my-favorite', [HomeController::class, 'showMyFavorite'])->name('my.favorite');
Route::get('/my-bags', [HomeController::class, 'showMyBags'])->name('my.bags');
Route::get('/about', [HomeController::class, 'showAbout'])->name('about');
Route::get('/my-address', [HomeController::class, 'showMyAddress'])->name('my.address');
Route::get('/my-orders', [OrderWebController::class, 'index'])->name('my.orders')->middleware('auth');
Route::get('/my-account', [AccountController::class, 'show'])->name('my.account')->middleware('auth');
Route::get('/create-your-gift-box', [HomeController::class, 'showCreateGiftBox'])->name('create.gift');


// ================== Web Shop (auth required) ================== \\
Route::middleware('auth')->group(function () {
    Route::post('/web/cart', [WebShopController::class, 'addToCart'])->name('web.cart.add');
    Route::patch('/web/cart/{id}', [WebShopController::class, 'updateCartQty'])->name('web.cart.update');
    Route::delete('/web/cart/{id}', [WebShopController::class, 'removeFromCart'])->name('web.cart.remove');
    Route::post('/web/favorites', [WebShopController::class, 'addToFavorites'])->name('web.favorites.add');
    Route::delete('/web/favorites/{id}', [WebShopController::class, 'removeFromFavorites'])->name('web.favorites.remove');
    Route::post('/web/favorites/{id}/move-to-cart', [WebShopController::class, 'moveToCart'])->name('web.favorites.move');
    Route::post('/web/orders', [WebShopController::class, 'placeOrder'])->name('web.orders.place');
    Route::post('/web/address', [WebShopController::class, 'updateAddress'])->name('web.address.update');
    Route::post('/web/orders/return', [OrderWebController::class, 'submitReturn'])->name('web.orders.return');
    Route::post('/web/orders/{id}/cancel', [OrderWebController::class, 'cancel'])->name('web.orders.cancel');
    Route::post('/web/orders/{id}/review', [OrderWebController::class, 'submitReview'])->name('web.orders.review');
    Route::post('/web/account/update', [AccountController::class, 'update'])->name('web.account.update');
    Route::post('/web/account/update-brand', [AccountController::class, 'updateBrandInfo'])->name('web.account.update-brand');
    Route::post('/web/account/change-password', [AccountController::class, 'changePassword'])->name('web.account.password');
});

// ================== Web Auth (AJAX) ================== \\
Route::post('/web-auth/login', [WebAuthController::class, 'login'])->name('web.auth.login');
Route::post('/web-auth/register', [WebAuthController::class, 'register'])->name('web.auth.register');
Route::post('/web-auth/logout', [WebAuthController::class, 'logout'])->name('web.auth.logout');
Route::post('/web-auth/update-last-seen', [WebAuthController::class, 'updateLastSeen'])->name('web.auth.update-last-seen');

// ================== Dashboard (auth required) ================== \\

    Route::prefix('dashboard-admin')->name('dashboard.')->middleware(['auth', 'dashboard.auth'])->group(function () {
        Route::get('/', [PageDashboardController::class, 'indexDashboard'])->name('index');
        // المنتجات
        Route::get('products', [PageDashboardController::class, 'showProducts'])->name('products');
        // الاقسام والعروض
        Route::get('categories-offers', [PageDashboardController::class, 'showcategoriesoffers'])->name('categories-offers');
        Route::get('edit-offer/{id}', [PageDashboardController::class, 'editOfferPage'])->name('edit-offer');
        // الطلبات
        Route::get('orders', [PageDashboardController::class, 'showorders'])->name('orders');
        // العملاء
        Route::get('customers', [PageDashboardController::class, 'showcustomers'])->name('customers');
        Route::get('customer-details', [PageDashboardController::class, 'showCustomerDetails'])->name('customer-details');
        // شركات الشحن
        Route::get('shipping-companies', [PageDashboardController::class, 'showShippingCompanies'])->name('shipping-companies');
        // arbeto express
        Route::get('ar-express', [PageDashboardController::class, 'showArExpress'])->name('ArExpress');
        // البريد المصري
        Route::get('egypt-post', [PageDashboardController::class, 'showEgyptPost'])->name('EgyptPost');
        // التقارير المالية
        Route::get('analysis', [PageDashboardController::class, 'showAnalysis'])->name('Analysis');
        Route::get('analysis/data', [PageDashboardController::class, 'analysisData'])->name('analysis.data');
        // التقارير المتقدمة
        Route::get('analysis/available-months', [PageDashboardController::class, 'getAvailableMonthsApi'])->name('analysis.available-months');
        Route::get('analysis/report-data', [PageDashboardController::class, 'getReportDataApi'])->name('analysis.report-data');
        // صفحة تفاصيل شركة الشحن
        Route::get('shipping-company/{id}', [PageDashboardController::class, 'showCompanyDetail'])->name('company-detail');
        // إعدادات المتجر
        Route::get('store-settings', [PageDashboardController::class, 'showStoreSettings'])->name('store-settings');
        // فواتير الشراء
        Route::get('bills', [PageDashboardController::class, 'showBills'])->name('bills');
        // المخزون
        Route::get('inventory', [PageDashboardController::class, 'showInventory'])->name('inventory');
        // المشرفون والتجار
        Route::get('trader-manager', [PageDashboardController::class, 'showTraderManager'])->name('trader-manager');
        Route::get('users/search', [PageDashboardController::class, 'searchUsers'])->name('users.search');
        Route::post('users/update-role', [PageDashboardController::class, 'updateUsersRole'])->name('users.update-role');
        Route::post('users/downgrade-role', [PageDashboardController::class, 'downgradeUserRole'])->name('users.downgrade-role');
    });

Route::get('/{slug}', [HomeController::class, 'showOfferPage'])->name('offer.show');

require __DIR__ . '/auth.php';
