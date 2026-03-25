<?php

namespace App\Services;

use App\Models\ApiCache;

class AvailabilityService
{
    public function __construct(private SmoobuClient $smoobu) {}

    /** Get available units for date range. */
    public function check(string $checkIn, string $checkOut, int $adults = 2, int $children = 0): array
    {
        $cacheKey = "avail:{$checkIn}:{$checkOut}:{$adults}:{$children}";
        $cached   = ApiCache::getValid($cacheKey);
        if ($cached) return $cached;

        $units   = config('content.units', []);
        $rates   = $this->smoobu->getRates($checkIn, $checkOut);
        $data    = $rates['data'] ?? $rates;
        $results = [];

        foreach ($units as $id => $unit) {
            $rate = $data[$id] ?? null;
            if (!$rate || !($rate['available'] ?? false)) continue;
            if ($adults + $children > $unit['max_guests']) continue;

            $results[] = [
                'unit_id'         => $id,
                'unit_name'       => $unit['name'],
                'slug'            => $unit['slug'],
                'max_guests'      => $unit['max_guests'],
                'bedrooms'        => $unit['bedrooms'],
                'thumbnail'       => $unit['thumbnail'],
                'available'       => true,
                'price_per_night' => $rate['price_per_night'] ?? 0,
                'total_price'     => $rate['price'] ?? 0,
                'currency'        => $rate['currency'] ?? 'EUR',
                'min_stay'        => $rate['min_stay'] ?? 2,
            ];
        }

        ApiCache::put($cacheKey, $results, 60);
        return $results;
    }

    /** Get rates for a single unit. */
    public function unitRates(string $unitId, string $checkIn, string $checkOut, int $adults = 2): array
    {
        $rates = $this->smoobu->getRates($checkIn, $checkOut, [$unitId]);
        $data  = $rates['data'] ?? $rates;

        return $data[$unitId] ?? [];
    }
}
