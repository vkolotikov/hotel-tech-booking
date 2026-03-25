<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingHold extends Model
{
    protected $fillable = ['hold_token', 'status', 'expires_at', 'payload_json'];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'expires_at'   => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('expires_at', '>', now());
    }
}
