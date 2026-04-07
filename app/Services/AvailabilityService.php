<?php

namespace App\Services;

use App\Models\ApiCache;

class AvailabilityService
{
    public function __construct(private SmoobuClient $smoobu) {}

    /**
     * Return units that are bookable for the requested date range and party size.
     *
     * Smoobu's /api/rates returns per-day data per apartment. A unit is only
     * available if EVERY night in the range has `available = 1` AND a non-zero
     * price. The total price is the sum of nightly prices, and the effective
     * min-stay is the largest min_length_of_stay seen across the requested
     * window (so a unit that requires 3 nights starting on day 1 won't appear
     * for a 1-night search).
     */
    public function check(string $checkIn, string $checkOut, int $adults = 2, int $children = 0): array
    {
        $cacheKey = "avail:{$checkIn}:{$checkOut}:{$adults}:{$children}";
        $cached   = ApiCache::getValid($cacheKey);
        if ($cached) return $cached;

        $units  = config('content.units', []);
        $nights = max(1, (int) round((strtotime($checkOut) - strtotime($checkIn)) / 86400));
        $party  = $adults + $children;

        // Build list of date keys for the stay nights (checkIn..checkOut-1).
        $dateKeys = [];
        for ($i = 0; $i < $nights; $i++) {
            $dateKeys[] = date('Y-m-d', strtotime($checkIn . " +{$i} day"));
        }

        $rates = $this->smoobu->getRates($checkIn, $checkOut, array_keys($units));
        $data  = $rates['data'] ?? [];

        $results = [];
        foreach ($units as $id => $unit) {
            // Reject early on capacity.
            if ($party > ($unit['max_guests'] ?? 0)) continue;

            $perDay = $data[(string) $id] ?? $data[$id] ?? null;
            if (!is_array($perDay) || empty($perDay)) continue;

            $total      = 0.0;
            $minStay    = 1;
            $allOk      = true;
            $blockedDay = null;

            foreach ($dateKeys as $day) {
                $cell = $perDay[$day] ?? null;
                if (!is_array($cell)) { $allOk = false; $blockedDay = $day; break; }

                // Smoobu marks unavailable nights with `available = 0` (or absent).
                $isAvail = (int) ($cell['available'] ?? 0) === 1;
                $price   = (float) ($cell['price'] ?? 0);

                if (!$isAvail || $price <= 0) { $allOk = false; $blockedDay = $day; break; }

                $total  += $price;
                $stayN   = (int) ($cell['min_length_of_stay'] ?? 1);
                if ($stayN > $minStay) $minStay = $stayN;
            }

            if (!$allOk) continue;

            // If the booked window is shorter than this unit's min stay,
            // it's not actually bookable for these dates.
            if ($nights < $minStay) continue;

            $results[] = [
                'unit_id'         => (string) $id,
                'unit_name'       => $unit['name'],
                'slug'            => $unit['slug'],
                'max_guests'      => $unit['max_guests'],
                'bedrooms'        => $unit['bedrooms'],
                'thumbnail'       => $unit['thumbnail'],
                'available'       => true,
                'nights'          => $nights,
                'price_per_night' => round($total / $nights, 2),
                'total_price'     => round($total, 2),
                'currency'        => 'EUR',
                'min_stay'        => $minStay,
            ];
        }

        // Cheapest first — matches Smoobu's own search UX in the screenshot.
        usort($results, fn($a, $b) => $a['total_price'] <=> $b['total_price']);

        ApiCache::put($cacheKey, $results, 60);
        return $results;
    }

    /** Get rates for a single unit. */
    public function unitRates(string $unitId, string $checkIn, string $checkOut, int $adults = 2): array
    {
        $rates  = $this->smoobu->getRates($checkIn, $checkOut, [$unitId]);
        $data   = $rates['data'] ?? [];
        $perDay = $data[$unitId] ?? null;

        if (!is_array($perDay)) return [];

        $nights = max(1, (int) round((strtotime($checkOut) - strtotime($checkIn)) / 86400));
        $total  = 0.0;
        $minStay = 1;
        $blocked = false;

        for ($i = 0; $i < $nights; $i++) {
            $day  = date('Y-m-d', strtotime($checkIn . " +{$i} day"));
            $cell = $perDay[$day] ?? null;
            if (!is_array($cell) || (int) ($cell['available'] ?? 0) !== 1) { $blocked = true; break; }
            $total  += (float) ($cell['price'] ?? 0);
            $stayN   = (int) ($cell['min_length_of_stay'] ?? 1);
            if ($stayN > $minStay) $minStay = $stayN;
        }

        return [
            'apartment_id'    => $unitId,
            'available'       => !$blocked && $nights >= $minStay,
            'min_stay'        => $minStay,
            'nights'          => $nights,
            'price'           => round($total, 2),
            'price_per_night' => $nights > 0 ? round($total / $nights, 2) : 0,
            'currency'        => 'EUR',
        ];
    }
}
