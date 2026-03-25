<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingSubmission extends Model
{
    protected $fillable = [
        'request_id', 'idempotency_key', 'outcome', 'failure_code', 'failure_message',
        'booking_reference', 'reservation_id',
        'guest_name', 'guest_email', 'guest_phone',
        'unit_id', 'unit_name', 'check_in', 'check_out',
        'adults', 'children', 'gross_total',
        'payment_method', 'payment_status', 'payload_json',
    ];

    protected function casts(): array
    {
        return [
            'check_in'     => 'date',
            'check_out'    => 'date',
            'gross_total'  => 'decimal:2',
            'payload_json' => 'array',
        ];
    }
}
