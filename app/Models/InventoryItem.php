<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    protected $table = 'inventory';

    protected $fillable = [
        'added_by',
        'supplier_id',
        'item_name',
        'purchase_price',
        'quantity',
        'image',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'quantity'       => 'integer',
    ];

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function primaryProducts(): HasMany
    {
        return $this->hasMany(Products::class, 'inventory_item_id');
    }

    public function boxedProducts(): BelongsToMany
    {
        return $this->belongsToMany(Products::class, 'product_inventory_items', 'inventory_item_id', 'product_id')
            ->withTimestamps();
    }
}
