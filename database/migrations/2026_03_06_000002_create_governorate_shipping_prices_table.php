<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('governorate_shipping_prices', function (Blueprint $table) {
            $table->id();
            $table->string('governorate_name');
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();
        });

        // Seed all 27 Egyptian governorates with default price 0
        $governorates = [
            'القاهرة',
            'الجيزة',
            'الإسكندرية',
            'الدقهلية',
            'البحر الأحمر',
            'البحيرة',
            'الفيوم',
            'الغربية',
            'الإسماعيلية',
            'المنوفية',
            'المنيا',
            'القليوبية',
            'الوادي الجديد',
            'السويس',
            'أسوان',
            'أسيوط',
            'بني سويف',
            'بورسعيد',
            'دمياط',
            'جنوب سيناء',
            'كفر الشيخ',
            'مطروح',
            'الأقصر',
            'قنا',
            'شمال سيناء',
            'الشرقية',
            'سوهاج',
        ];

        $now = now();
        foreach ($governorates as $gov) {
            DB::table('governorate_shipping_prices')->insert([
                'governorate_name' => $gov,
                'price'            => 0,
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('governorate_shipping_prices');
    }
};
