<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GovernorateShippingPrice extends Model
{
    protected $fillable = ['governorate_name', 'price'];
}
