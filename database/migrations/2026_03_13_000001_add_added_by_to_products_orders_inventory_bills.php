<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('added_by')->nullable()->after('id');
            $table->foreign('added_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('added_by')->nullable()->after('user_id');
            $table->foreign('added_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('inventory', function (Blueprint $table) {
            $table->unsignedBigInteger('added_by')->nullable()->after('id');
            $table->foreign('added_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->unsignedBigInteger('added_by')->nullable()->after('id');
            $table->foreign('added_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->dropColumn('added_by');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->dropColumn('added_by');
        });

        Schema::table('inventory', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->dropColumn('added_by');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->dropForeign(['added_by']);
            $table->dropColumn('added_by');
        });
    }
};
