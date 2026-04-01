<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers_page_product', function (Blueprint $table) {
            $table->boolean('is_decoration')->default(false)->after('discount');
        });
    }

    public function down(): void
    {
        Schema::table('offers_page_product', function (Blueprint $table) {
            $table->dropColumn('is_decoration');
        });
    }
};
