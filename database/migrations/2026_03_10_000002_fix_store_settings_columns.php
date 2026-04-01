<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            // Rename logo_path → logo if old name still exists
            if (Schema::hasColumn('store_settings', 'logo_path') && !Schema::hasColumn('store_settings', 'logo')) {
                $table->renameColumn('logo_path', 'logo');
            }

            // Rename favicon_path → favicon if old name still exists
            if (Schema::hasColumn('store_settings', 'favicon_path') && !Schema::hasColumn('store_settings', 'favicon')) {
                $table->renameColumn('favicon_path', 'favicon');
            }

            // Add missing social URL columns
            if (!Schema::hasColumn('store_settings', 'twitter_url')) {
                $table->string('twitter_url', 500)->nullable();
            }

            if (!Schema::hasColumn('store_settings', 'youtube_url')) {
                $table->string('youtube_url', 500)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            if (Schema::hasColumn('store_settings', 'logo') && !Schema::hasColumn('store_settings', 'logo_path')) {
                $table->renameColumn('logo', 'logo_path');
            }
            if (Schema::hasColumn('store_settings', 'favicon') && !Schema::hasColumn('store_settings', 'favicon_path')) {
                $table->renameColumn('favicon', 'favicon_path');
            }
            if (Schema::hasColumn('store_settings', 'twitter_url')) {
                $table->dropColumn('twitter_url');
            }
            if (Schema::hasColumn('store_settings', 'youtube_url')) {
                $table->dropColumn('youtube_url');
            }
        });
    }
};
