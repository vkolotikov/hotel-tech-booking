<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiCache extends Model
{
    protected $table = 'api_cache';
    protected $primaryKey = 'cache_key';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['cache_key', 'payload_json', 'expires_at'];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'expires_at'   => 'datetime',
        ];
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture();
    }

    public static function getValid(string $key): ?array
    {
        $row = self::find($key);
        return ($row && $row->isValid()) ? $row->payload_json : null;
    }

    public static function put(string $key, array $payload, int $ttlSeconds = 60): void
    {
        self::updateOrCreate(
            ['cache_key' => $key],
            ['payload_json' => $payload, 'expires_at' => now()->addSeconds($ttlSeconds)]
        );
    }
}
