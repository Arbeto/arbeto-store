<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyGovernoratePrice extends Model
{
    protected $fillable = ['shipping_company_id', 'governorate_name', 'price'];

    public function company()
    {
        return $this->belongsTo(ShippingCompany::class, 'shipping_company_id');
    }
}
