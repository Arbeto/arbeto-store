<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Adress_coustomer extends Model
{
    protected $fillable = [
        'user_id',
        'street',
        'city',
        'governorate',
        'address_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
