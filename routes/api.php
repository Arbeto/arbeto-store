<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\ShippingApiController;
use App\Http\Controllers\Api\DiscountCodeController;
use App\Http\Controllers\Api\StoreSettingsController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\InventoryController;

// Route::post('/send-otp', [AuthController::class, 'sendOtp']);
// Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
// Route::post('/auth-phone', [AuthController::class, 'authByPhone']);

// // للموبايل - حذف المستخدم الحالي
// Route::delete('/delete-user', [AuthController::class, 'deleteOwnAccount']);

// // للأدمن - حذف مستخدم محدد بالـ id
// Route::delete('/delete-user/{id}', [AuthController::class, 'deleteUser'])->name('user.delete');

// Route::middleware('auth:api')->group(function () {
//     Route::get('/me', [AuthController::class, 'me']);
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::post('/refresh', [AuthController::class, 'refresh']);
// });

// المنتجات
Route::prefix('products')->group(function () {
    Route::get('search', [ContentApiController::class, 'searchProducts']);
    Route::get('', [ContentApiController::class, 'indexProducts']);
    Route::post('', [ContentApiController::class, 'storeProducts']);
    Route::post('{id}/options-availability', [\App\Http\Controllers\WebShopController::class, 'checkOptionsAvailability']);
    Route::post('{id}', [ContentApiController::class, 'updateProducts']);
    Route::delete('{id}', [ContentApiController::class, 'destroyProducts']);
});

// فئات المنتجات
Route::prefix('categories')->group(function () {
    Route::get('', [ContentApiController::class, 'indexCategories']);
    Route::post('', [ContentApiController::class, 'storeCategories']);
    Route::post('{id}', [ContentApiController::class, 'updateCategories']);
    Route::delete('{id}', [ContentApiController::class, 'destroyCategories']);
});

// الاقسام والعروض (السلايدر)
Route::prefix('sliders')->group(function () {
    Route::get('', [ContentApiController::class, 'indexSliders']);
    Route::post('', [ContentApiController::class, 'storeSliders']);
    Route::post('/reorder', [ContentApiController::class, 'reorderSliders']);
    Route::post('{id}', [ContentApiController::class, 'updateSliders']);
    Route::delete('{id}', [ContentApiController::class, 'destroySliders']);
});

// الاقسام والعروض (انشاء صفحة عروض)
Route::prefix('offers')->group(function () {
    Route::get('', [ContentApiController::class, 'indexOffers']);
    Route::post('', [ContentApiController::class, 'storeOffers']);
    Route::post('{id}', [ContentApiController::class, 'updateOffers']);
    Route::delete('{id}', [ContentApiController::class, 'destroyOffers']);
});

// رابط موحد للبث المباشر والصور
Route::get('/home-data', [ContentApiController::class, 'getHomeData']);

// شركات الشحن
Route::prefix('shipping-companies')->group(function () {
    Route::get('', [ShippingApiController::class, 'index']);
    Route::post('', [ShippingApiController::class, 'store']);
    Route::get('{id}/orders', [ShippingApiController::class, 'getCompanyOrders']);
    Route::post('{id}/orders/{orderId}', [ShippingApiController::class, 'updateCompanyOrder']);
    Route::get('{id}/gov-prices', [ShippingApiController::class, 'getCompanyGovPrices']);
    Route::post('{id}/gov-prices/bulk', [ShippingApiController::class, 'bulkUpdateCompanyGovPrices']);
    Route::post('{id}', [ShippingApiController::class, 'update']);
    Route::delete('{id}', [ShippingApiController::class, 'destroy']);
});

// أسعار شحن المحافظات
Route::prefix('governorate-prices')->group(function () {
    Route::get('shipping-cost', [ShippingApiController::class, 'getShippingCostForGov']);
    Route::get('', [ShippingApiController::class, 'indexGovPrices']);
    Route::post('/bulk-update', [ShippingApiController::class, 'bulkUpdateGovPrices']);
    Route::post('', [ShippingApiController::class, 'storeGovPrice']);
    Route::post('{id}', [ShippingApiController::class, 'updateGovPrice']);
    Route::delete('{id}', [ShippingApiController::class, 'destroyGovPrice']);
});

// الطلبات
Route::prefix('orders')->group(function () {
    Route::get('', [ContentApiController::class, 'indexOrders']);
    Route::post('', [ContentApiController::class, 'storeOrders']);
    Route::post('{id}', [ContentApiController::class, 'updateOrders']);
    Route::delete('{id}', [ContentApiController::class, 'destroyOrders']);

    // Return order management
    Route::post('{id}/update-shipping-cost', [\App\Http\Controllers\OrderWebController::class, 'updateShippingCost']);
    Route::post('{id}/refund', [\App\Http\Controllers\OrderWebController::class, 'uploadRefundReceipt']);
});

// السلة
Route::prefix('carts')->group(function () {
    Route::get('', [ContentApiController::class, 'indexCarts']);
    Route::post('', [ContentApiController::class, 'storeCarts']);
    Route::delete('{id}', [ContentApiController::class, 'destroyCarts']);
});

// المفضلة
Route::prefix('favorites')->group(function () {
    Route::get('', [ContentApiController::class, 'indexFavorites']);
    Route::post('', [ContentApiController::class, 'storeFavorites']);
    Route::delete('{id}', [ContentApiController::class, 'destroyFavorites']);
});

// التقييمات
Route::prefix('reviews')->group(function () {
    Route::get('', [ContentApiController::class, 'indexReviews']);
    Route::post('', [ContentApiController::class, 'storeReviews']);
});

// تفاصيل العميل
Route::get('/customers', [ContentApiController::class, 'indexUsers']);
Route::get('/staff-members', [ContentApiController::class, 'indexStaffMembers']);
Route::get('/customer-details/{id}', [ContentApiController::class, 'showUserDetils']);
Route::post('/customer-details/{id}/change-password', [ContentApiController::class, 'updatePassword']);
Route::post('/customer-details/{id}/update-wallet', [ContentApiController::class, 'updateWallet']);

Route::get('/notifications', [ContentApiController::class, 'notification']);

// أكواد الخصم
Route::prefix('discount-codes')->group(function () {
    Route::get('validate', [DiscountCodeController::class, 'validateCode']);
    Route::get('', [DiscountCodeController::class, 'index']);
    Route::post('', [DiscountCodeController::class, 'store']);
    Route::post('{id}', [DiscountCodeController::class, 'update']);
    Route::delete('{id}', [DiscountCodeController::class, 'destroy']);
});

// إعدادات المتجر
// فواتير الشراء
Route::prefix('bills')->group(function () {
    Route::get('', [BillController::class, 'index']);
    Route::post('', [BillController::class, 'store']);
});

// الموردين
Route::prefix('suppliers')->group(function () {
    Route::get('', [SupplierController::class, 'index']);
    Route::get('search', [BillController::class, 'searchSuppliers']);
    Route::get('{id}/products', [SupplierController::class, 'products']);
    Route::patch('{id}/address', [SupplierController::class, 'updateAddress']);
});

// المخزون
Route::prefix('inventory')->group(function () {
    Route::get('selectable', [InventoryController::class, 'selectable']);
    Route::get('', [InventoryController::class, 'index']);
    Route::post('{id}/image', [InventoryController::class, 'updateImage']);
});

Route::prefix('store-settings')->group(function () {
    Route::get('', [StoreSettingsController::class, 'show']);
    Route::post('', [StoreSettingsController::class, 'update']);
    Route::post('logo', [StoreSettingsController::class, 'updateLogo']);
    Route::post('favicon', [StoreSettingsController::class, 'updateFavicon']);
});
