<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'added_by',
        'order_type',
        'return_for_order_id',
        'return_data',
        'items',
        'total_price',
        'express_price',
        'payment_method',
        'comments',
        'governorate',
        'city',
        'street',
        'payment_proof',
        'status',
        'inventory_reserved_at',
        'inventory_restocked_at',
        'shipping_company',
        'shipping_company_id',
        'manual_shipping_cost',
        'company_notes',
        'rejection_reason',
        'failure_reason',
        'refund',
        'refund_receipt',
    ];

    protected $casts = [
        'items'       => 'json',
        'return_data' => 'json',
        'inventory_reserved_at'  => 'datetime',
        'inventory_restocked_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING          = 'pending';
    const STATUS_OUT_FOR_DELIVERY = 'out-for-delivery';
    const STATUS_ON_THE_WAY       = 'on-the-way';
    const STATUS_DELIVERED        = 'delivered';
    const STATUS_CANCELLED        = 'cancelled';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviews()
    {
        return $this->hasMany(Customer_reviews::class, 'order_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function shippingCompany()
    {
        return $this->belongsTo(ShippingCompany::class, 'shipping_company_id');
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', self::STATUS_DELIVERED);
    }

    public function scopePurchaseType($query)
    {
        return $query->where(function ($inner) {
            $inner->whereNull('order_type')
                ->orWhere('order_type', 'purchase');
        });
    }

    public function scopeReturnType($query)
    {
        return $query->where('order_type', 'return');
    }
}
