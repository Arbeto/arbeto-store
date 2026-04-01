<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Catetgory_prodect extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'img',
    ];

    public function products()
    {
        return $this->hasMany(Products::class, 'category_id');
    }

    public static function generateSlug(string $name): string
    {
        $base = Str::slug($name, '-');
        if (!$base) {
            // fallback for Arabic-only names
            $base = preg_replace('/\s+/', '-', trim($name));
            $base = preg_replace('/[^\p{Arabic}\p{L}\p{N}\-]/u', '', $base);
            $base = trim($base, '-') ?: 'category';
        }
        $slug = $base;
        $i = 1;
        while (static::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}

