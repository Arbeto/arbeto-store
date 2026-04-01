<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'inventory_reserved_at')) {
                $table->timestamp('inventory_reserved_at')->nullable()->after('status');
            }

            if (!Schema::hasColumn('orders', 'inventory_restocked_at')) {
                $table->timestamp('inventory_restocked_at')->nullable()->after('inventory_reserved_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'inventory_restocked_at')) {
                $table->dropColumn('inventory_restocked_at');
            }

            if (Schema::hasColumn('orders', 'inventory_reserved_at')) {
                $table->dropColumn('inventory_reserved_at');
            }
        });
    }
};
