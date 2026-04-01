<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order_history extends Model
{
    protected $fillable = ['user_id', 'order_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
