<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('type')->nullable();
            $table->string('name')->nullable();
            $table->string('type_product')->nullable();
            $table->text('description')->nullable();
            $table->integer('quantity')->nullable();
            $table->integer('price_pay')->nullable();
            $table->integer('price_sell')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('catetgory_prodects');
            $table->integer('discount')->nullable();
            $table->json('img')->nullable();
            $table->json('suggested_product')->nullable();
            $table->json('suggested_search')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
