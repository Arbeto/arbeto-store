<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSettings extends Model
{
    protected $fillable = [
        'logo',
        'favicon',
        'support_email',
        'support_phone',
        'facebook_url',
        'instagram_url',
        'twitter_url',
        'whatsapp_url',
        'youtube_url',
        'tiktok_url',
    ];

    /**
     * Always returns the single settings row (id = 1), creating it if missing.
     */
    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }
}
