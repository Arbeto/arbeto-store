<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // نخلي Laravel يقرأ ملف routes/api.php
        Route::middleware('api')
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        // نشارك إعدادات المتجر مع كل الـ views
        View::composer('*', function ($view) {
            try {
                $view->with('storeSettings', \App\Models\StoreSettings::first() ?? new \App\Models\StoreSettings());
            } catch (\Exception $e) {
                $view->with('storeSettings', new \App\Models\StoreSettings());
            }
        });
    }
}
