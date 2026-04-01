<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    const ROLE_CEO      = 'ceo';
    const ROLE_MANAGER  = 'manager';
    const ROLE_TRADER   = 'trader';
    const ROLE_CUSTOMER = 'customer';

    protected $fillable = [
        'phone',
        'email',
        'first_name',
        'last_name',
        'password',
        'gender',
        'age',
        'address',
        'user_type',
        'last_seen',
        'wallet_balance',
        'brand_name',
        'brand_phone',
    ];

    protected $hidden = ['password'];

    public function isCeo(): bool      { return $this->user_type === self::ROLE_CEO; }
    public function isManager(): bool  { return $this->user_type === self::ROLE_MANAGER; }
    public function isTrader(): bool   { return $this->user_type === self::ROLE_TRADER; }
    public function isCustomer(): bool { return $this->user_type === self::ROLE_CUSTOMER; }
    public function isDashboardUser(): bool { return in_array($this->user_type, [self::ROLE_CEO, self::ROLE_MANAGER, self::ROLE_TRADER]); }

    public function products()
    {
        return $this->hasMany(Products::class, 'added_by');
    }

    public function brandName(): string
    {
        return $this->brand_name ?: ($this->first_name . ' ' . $this->last_name);
    }

    public function brandPhone(): ?string
    {
        return $this->brand_phone ?: $this->phone;
    }


    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorites::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Customer_reviews::class);
    }

    public function orderHistories()
    {
        return $this->hasMany(Order_history::class);
    }

    public function addresses()
    {
        return $this->hasMany(Adress_coustomer::class);
    }
}
