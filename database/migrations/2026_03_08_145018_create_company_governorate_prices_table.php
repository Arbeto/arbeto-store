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
        Schema::create('company_governorate_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_company_id')->constrained('shipping_companies')->onDelete('cascade');
            $table->string('governorate_name');
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();
            $table->unique(['shipping_company_id', 'governorate_name'], 'co_gov_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_governorate_prices');
    }
};
