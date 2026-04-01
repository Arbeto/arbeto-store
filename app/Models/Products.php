<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Products extends Model
{
    protected $fillable = [
        'added_by',
        'inventory_item_id',
        'type',
        'name',
        'type_product',
        'description',
        'quantity',
        'price_pay',
        'price_sell',
        'discount',
        'category_id',
        'img',
        'primary_image_index',
        'suggested_product',
        'suggested_search',
    ];

    protected $casts = [
        'img'               => 'array',
        'suggested_product' => 'array',
        'suggested_search'  => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(Catetgory_prodect::class, 'category_id');
    }

    public function offersPages()
    {
        return $this->belongsToMany(OffersPage::class, 'offers_page_product', 'product_id', 'offers_page_id')->withPivot('discount');
    }

    public function reviews()
    {
        return $this->hasMany(Customer_reviews::class, 'product_id');
    }

    public function optionGroups()
    {
        return $this->hasMany(ProductOptionGroup::class, 'product_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function inventoryItems()
    {
        return $this->belongsToMany(InventoryItem::class, 'product_inventory_items', 'product_id', 'inventory_item_id')
            ->withTimestamps();
    }

    public function specs()
    {
        return $this->hasMany(ProductSpec::class, 'product_id');
    }

    /**
     * Get the primary image of the product
     */
    public function getPrimaryImage()
    {
        $images = $this->img ?? [];
        if (empty($images)) {
            return null;
        }

        $primaryIndex = $this->primary_image_index ?? 0;
        if (isset($images[$primaryIndex])) {
            return $images[$primaryIndex];
        }

        return $images[0] ?? null;
    }

    /**
     * Get the remaining inventory quantity for this product
     */
    public function getInventoryQuantity()
    {
        if ($this->inventoryItem) {
            return $this->inventoryItem->quantity ?? 0;
        }

        // Fallback to product quantity if no inventory item is linked
        return $this->quantity ?? 0;
    }
}
