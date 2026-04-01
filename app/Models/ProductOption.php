<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductOption extends Model
{
    protected $fillable = ['option_group_id', 'name', 'custom_price', 'quantity', 'images', 'primary_image_index'];

    protected $casts = [
        'images' => 'array',
    ];

    public function group()
    {
        return $this->belongsTo(ProductOptionGroup::class, 'option_group_id');
    }

    /**
     * Get the primary image of the option
     */
    public function getPrimaryImage()
    {
        $images = $this->images ?? [];
        if (empty($images)) {
            return null;
        }

        $primaryIndex = $this->primary_image_index ?? 0;
        if (isset($images[$primaryIndex])) {
            return $images[$primaryIndex];
        }

        return $images[0] ?? null;
    }
}
