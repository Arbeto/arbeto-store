<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'brand_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('brand_name')->nullable();
            });
        }

        if (!Schema::hasColumn('users', 'brand_phone')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('brand_phone')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'brand_phone')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('brand_phone');
            });
        }

        if (Schema::hasColumn('users', 'brand_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('brand_name');
            });
        }
    }
};
