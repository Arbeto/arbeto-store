<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->text('address')->nullable();
                $table->timestamps();
            });
        }

        // Add supplier_id to bills if not present
        if (Schema::hasTable('bills') && !Schema::hasColumn('bills', 'supplier_id')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->foreignId('supplier_id')->nullable()->after('id')
                      ->constrained('suppliers')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bills') && Schema::hasColumn('bills', 'supplier_id')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->dropForeign(['supplier_id']);
                $table->dropColumn('supplier_id');
            });
        }
        Schema::dropIfExists('suppliers');
    }
};
