<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('inventory')) {
            return;
        }

        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()
                  ->constrained('suppliers')->nullOnDelete();
            $table->string('item_name');
            $table->decimal('purchase_price', 12, 2)->default(0);
            $table->unsignedInteger('quantity')->default(0);
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
