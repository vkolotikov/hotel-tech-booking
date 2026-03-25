<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    protected $fillable = ['idempotency_key', 'request_hash', 'response_json', 'status_code', 'expires_at'];

    protected function casts(): array
    {
        return [
            'response_json' => 'array',
            'expires_at'    => 'datetime',
        ];
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture();
    }
}
