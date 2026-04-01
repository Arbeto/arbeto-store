<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_company_id')) {
                $table->unsignedBigInteger('shipping_company_id')
                      ->nullable()
                      ->after('shipping_company');
                $table->foreign('shipping_company_id')
                      ->references('id')
                      ->on('shipping_companies')
                      ->nullOnDelete();
            }
            if (!Schema::hasColumn('orders', 'manual_shipping_cost')) {
                $table->decimal('manual_shipping_cost', 10, 2)
                      ->nullable()
                      ->after('shipping_company_id');
            }
            if (!Schema::hasColumn('orders', 'company_notes')) {
                $table->text('company_notes')->nullable()->after('manual_shipping_cost');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['shipping_company_id']);
            $table->dropColumn(['shipping_company_id', 'manual_shipping_cost', 'company_notes']);
        });
    }
};
