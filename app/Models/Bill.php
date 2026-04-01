<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    protected $fillable = [
        'added_by',
        'invoice_number',
        'supplier_id',
        'date',
        'total_price',
    ];

    protected $casts = [
        'date'        => 'date',
        'total_price' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::created(function (self $bill) {
            $bill->invoice_number = 'INV-' . str_pad($bill->id, 5, '0', STR_PAD_LEFT);
            $bill->saveQuietly();
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(BillItem::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
