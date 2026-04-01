<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('user_type', 'admin')->update(['user_type' => 'ceo']);
        DB::table('users')->where('user_type', 'user')->update(['user_type' => 'customer']);
        DB::table('users')->whereNull('user_type')->update(['user_type' => 'customer']);
    }

    public function down(): void
    {
        // Intentionally left blank.
        // Legacy role values cannot be restored safely once normalized.
    }
};
