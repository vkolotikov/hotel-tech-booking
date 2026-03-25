<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingPriceElement extends Model
{
    protected $fillable = [
        'reservation_id', 'remote_price_element_id', 'element_type',
        'name', 'amount', 'quantity', 'tax', 'currency_code', 'sort_order',
        'raw_json', 'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'    => 'decimal:2',
            'tax'       => 'decimal:2',
            'raw_json'  => 'array',
            'synced_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(BookingMirror::class, 'reservation_id', 'reservation_id');
    }
}
