<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'inventory_item_id')) {
                $table->foreignId('inventory_item_id')
                    ->nullable()
                    ->after('added_by')
                    ->constrained('inventory')
                    ->nullOnDelete();
            }
        });

        if (!Schema::hasTable('product_inventory_items')) {
            Schema::create('product_inventory_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained('inventory')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['product_id', 'inventory_item_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('product_inventory_items')) {
            Schema::dropIfExists('product_inventory_items');
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'inventory_item_id')) {
                $table->dropConstrainedForeignId('inventory_item_id');
            }
        });
    }
};
