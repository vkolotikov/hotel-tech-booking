<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['event_type', 'request_id', 'idempotency_key', 'request_ip', 'payload_json'];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'created_at'   => 'datetime',
        ];
    }

    public static function log(string $event, array $payload = [], ?string $ip = null, ?string $requestId = null): self
    {
        return self::create([
            'event_type'   => $event,
            'request_ip'   => $ip,
            'request_id'   => $requestId,
            'payload_json' => $payload ?: null,
        ]);
    }
}
