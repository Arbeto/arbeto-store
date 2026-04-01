<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('governorate')->nullable()->after('address');
            $table->string('city')->nullable()->after('governorate');
            $table->string('street')->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['governorate', 'city', 'street']);
        });
    }
};
