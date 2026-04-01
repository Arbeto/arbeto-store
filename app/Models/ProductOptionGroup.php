<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductOptionGroup extends Model
{
    protected $fillable = ['product_id', 'title'];

    public function product()
    {
        return $this->belongsTo(Products::class, 'product_id');
    }

    public function options()
    {
        return $this->hasMany(ProductOption::class, 'option_group_id');
    }
}
