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
        Schema::table('orders', function (Blueprint $table) {
            // إضافة عمود refund للطلبات المرتجعة
            $table->string('refund')->nullable()->after('failure_reason')
                  ->comment('حالة الاسترداد: null (قيد الانتظار), delivered (تم الاسترداد)');

            // إضافة عمود لحفظ صورة إيصال الاسترداد
            $table->string('refund_receipt')->nullable()->after('refund')
                  ->comment('صورة إيصال تحويل المبلغ المسترد');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['refund', 'refund_receipt']);
        });
    }
};