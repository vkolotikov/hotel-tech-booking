<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingMirror extends Model
{
    protected $table = 'booking_mirror';

    protected $fillable = [
        'reservation_id', 'booking_reference', 'booking_type', 'booking_state',
        'apartment_id', 'apartment_name', 'channel_id', 'channel_name',
        'guest_name', 'guest_email', 'guest_phone', 'guest_language',
        'adults', 'children', 'arrival_date', 'departure_date',
        'check_in_time', 'check_out_time',
        'price_total', 'price_paid', 'prepayment_amount', 'prepayment_paid',
        'deposit_amount', 'deposit_paid',
        'notice', 'assistant_notice', 'guest_app_url',
        'payment_method', 'payment_status', 'internal_status', 'invoice_state',
        'source_created_at', 'source_updated_at', 'synced_at', 'raw_json',
    ];

    protected function casts(): array
    {
        return [
            'arrival_date'      => 'date',
            'departure_date'    => 'date',
            'price_total'       => 'decimal:2',
            'price_paid'        => 'decimal:2',
            'prepayment_amount' => 'decimal:2',
            'deposit_amount'    => 'decimal:2',
            'prepayment_paid'   => 'boolean',
            'deposit_paid'      => 'boolean',
            'raw_json'          => 'array',
            'source_created_at' => 'datetime',
            'source_updated_at' => 'datetime',
            'synced_at'         => 'datetime',
        ];
    }

    public function priceElements(): HasMany
    {
        return $this->hasMany(BookingPriceElement::class, 'reservation_id', 'reservation_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(BookingNote::class, 'reservation_id', 'reservation_id');
    }
}
