<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DiscountCode extends Model
{
    protected $fillable = ['code', 'discount_percent', 'discount_type', 'discount_amount', 'expiry_type', 'expires_at'];

    protected $casts = [
        'expires_at'       => 'datetime',
        'discount_percent' => 'integer',
        'discount_amount'  => 'float',
    ];

    protected $appends = ['status', 'discount'];

    /** Alias: expose discount_percent as discount for API compatibility */
    public function getDiscountAttribute(): int
    {
        return $this->discount_percent ?? 0;
    }

    public function isExpired(): bool
    {
        if ($this->expiry_type === 'permanent' || $this->expires_at === null) {
            return false;
        }
        return Carbon::now()->greaterThan($this->expires_at);
    }

    public function getStatusAttribute(): string
    {
        return $this->isExpired() ? 'expired' : 'active';
    }
}
