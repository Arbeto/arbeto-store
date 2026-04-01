<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Orders extra columns ───────────────────────────────────────────────
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'delivery_status')) {
                $table->string('delivery_status')->nullable()->after('status');
            }
            if (!Schema::hasColumn('orders', 'shipping_company')) {
                $table->string('shipping_company')->nullable()->after('delivery_status');
            }
            if (!Schema::hasColumn('orders', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('shipping_company');
            }
            if (!Schema::hasColumn('orders', 'failure_reason')) {
                $table->text('failure_reason')->nullable()->after('rejection_reason');
            }
        });

        // ── Customer reviews — images array ───────────────────────────────────
        Schema::table('customer_reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_reviews', 'images')) {
                $table->json('images')->nullable()->after('review');
            }
            if (!Schema::hasColumn('customer_reviews', 'order_id')) {
                $table->unsignedBigInteger('order_id')->nullable()->after('product_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_status', 'shipping_company', 'rejection_reason', 'failure_reason']);
        });
        Schema::table('customer_reviews', function (Blueprint $table) {
            $table->dropColumn(['images', 'order_id']);
        });
    }
};
