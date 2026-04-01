<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_codes', function (Blueprint $table) {
            if (!Schema::hasColumn('discount_codes', 'discount_type')) {
                $table->string('discount_type')->default('percentage')->after('discount'); // 'percentage' | 'fixed'
            }

            if (!Schema::hasColumn('discount_codes', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->nullable()->after('discount_type'); // for fixed-amount codes
            }
        });
    }

    public function down(): void
    {
        Schema::table('discount_codes', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('discount_codes', 'discount_type')) {
                $columns[] = 'discount_type';
            }

            if (Schema::hasColumn('discount_codes', 'discount_amount')) {
                $columns[] = 'discount_amount';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
