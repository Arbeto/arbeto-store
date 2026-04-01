<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSpec extends Model
{
    protected $fillable = ['product_id', 'title', 'value'];

    public function product()
    {
        return $this->belongsTo(Products::class, 'product_id');
    }
}
