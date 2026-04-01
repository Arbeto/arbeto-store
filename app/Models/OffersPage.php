<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OffersPage extends Model
{
    protected $fillable = [
        'title',
        'description',
        'btn_text',
        'img',
        'slug',
        'location',
        'is_fixed',
    ];

    protected $casts = [
        'is_fixed' => 'boolean',
    ];

    public function products()
    {
        return $this->belongsToMany(Products::class, 'offers_page_product', 'offers_page_id', 'product_id')
            ->withPivot('discount', 'is_decoration');
    }
}
