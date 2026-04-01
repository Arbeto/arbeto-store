<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer_reviews extends Model
{
    protected $fillable = ['user_id', 'product_id', 'order_id', 'rating', 'review', 'images'];

    protected $casts = [
        'images' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Products::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
