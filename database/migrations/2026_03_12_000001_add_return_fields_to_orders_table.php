<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'order_type')) {
                $table->string('order_type')->default('purchase')->after('id');
            }
            if (!Schema::hasColumn('orders', 'return_for_order_id')) {
                $table->unsignedBigInteger('return_for_order_id')->nullable()->after('order_type');
            }
            if (!Schema::hasColumn('orders', 'return_data')) {
                $table->json('return_data')->nullable()->after('return_for_order_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'return_for_order_id', 'return_data']);
        });
    }
};
