<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingCompany extends Model
{
    protected $fillable = ['name', 'logo', 'shipping_type', 'fixed_price'];

    public function orders()
    {
        return $this->hasMany(Order::class, 'shipping_company_id');
    }

    public function governoratePrices()
    {
        return $this->hasMany(CompanyGovernoratePrice::class, 'shipping_company_id');
    }
}
