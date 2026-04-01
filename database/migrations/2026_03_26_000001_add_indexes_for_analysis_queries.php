<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'order_type', 'created_at'], 'orders_status_type_created_idx');
            $table->index('created_at', 'orders_created_at_idx');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->index('date', 'bills_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_type_created_idx');
            $table->dropIndex('orders_created_at_idx');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('bills_date_idx');
        });
    }
};
