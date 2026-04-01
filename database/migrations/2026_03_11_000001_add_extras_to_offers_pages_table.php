<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers_pages', function (Blueprint $table) {
            $table->text('description')->nullable()->after('title');
            $table->string('btn_text')->default('ابدأ الان')->after('description');
            $table->boolean('is_fixed')->default(false)->after('btn_text');
        });
    }

    public function down(): void
    {
        Schema::table('offers_pages', function (Blueprint $table) {
            $table->dropColumn(['description', 'btn_text', 'is_fixed']);
        });
    }
};
