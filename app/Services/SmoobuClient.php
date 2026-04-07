<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmoobuClient
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;
    private bool $isMock;

    public function __construct()
    {
        $this->isMock  = config('services.smoobu.provider', 'mock') === 'mock';
        $this->baseUrl = rtrim(config('services.smoobu.base_url', 'https://login.smoobu.com/api/'), '/');
        $this->apiKey  = config('services.smoobu.api_key', '');
        $this->timeout = (int) config('services.smoobu.timeout', 8);
    }

    /**
     * Get per-day rates + availability for a date range.
     *
     * Smoobu's GET /api/rates returns a nested structure:
     *   { "data": { "<apartmentId>": { "YYYY-MM-DD": { "price": 240,
     *                                                  "min_length_of_stay": 2,
     *                                                  "available": 1 }, ... } } }
     *
     * Note: the date range is INCLUSIVE on both ends in Smoobu's rates endpoint,
     * but a stay is checkIn..checkOut-1 (you don't pay for departure night), so
     * we query checkIn..(checkOut - 1 day).
     */
    public function getRates(string $checkIn, string $checkOut, array $unitIds = []): array
    {
        if ($this->isMock) {
            return $this->mockRates($checkIn, $checkOut, $unitIds);
        }

        // Smoobu's "end_date" on /api/rates is inclusive — last *night* of the stay.
        $lastNight = date('Y-m-d', strtotime($checkOut . ' -1 day'));

        $params = [
            'start_date' => $checkIn,
            'end_date'   => $lastNight,
        ];
        if (!empty($unitIds)) {
            // Smoobu expects apartments[]=...&apartments[]=...
            $params['apartments'] = array_values($unitIds);
        }

        return $this->get('/rates', $params);
    }

    /**
     * List all apartments configured on the Smoobu account.
     * Used to validate / sync the unit IDs in config/content.php.
     */
    public function listApartments(): array
    {
        if ($this->isMock) {
            return ['apartments' => []];
        }

        return $this->get('/apartments');
    }

    /** Create a reservation on Smoobu. */
    public function createReservation(array $data): array
    {
        if ($this->isMock) {
            return $this->mockCreateReservation($data);
        }

        return $this->post('/reservations', $data);
    }

    /** Get a single reservation. */
    public function getReservation(string $reservationId): array
    {
        if ($this->isMock) {
            return $this->mockReservation($reservationId);
        }

        return $this->get("/reservations/{$reservationId}");
    }

    /** List reservations. */
    public function listReservations(array $params = []): array
    {
        if ($this->isMock) {
            return $this->mockListReservations($params);
        }

        return $this->get('/reservations', $params);
    }

    /** Get price elements for a reservation. */
    public function getPriceElements(string $reservationId): array
    {
        if ($this->isMock) {
            return [];
        }

        return $this->get("/reservations/{$reservationId}/price-elements");
    }

    // ─── HTTP Helpers ──────────────────────────────────────────────────────

    private function get(string $path, array $params = []): array
    {
        $response = Http::withHeaders(['Api-Key' => $this->apiKey])
            ->timeout($this->timeout)
            ->get("{$this->baseUrl}{$path}", $params);

        if (!$response->successful()) {
            Log::error("Smoobu GET {$path} failed", ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException("Smoobu API error: {$response->status()}");
        }

        return $response->json() ?? [];
    }

    private function post(string $path, array $data): array
    {
        $response = Http::withHeaders(['Api-Key' => $this->apiKey])
            ->timeout($this->timeout)
            ->post("{$this->baseUrl}{$path}", $data);

        if (!$response->successful()) {
            Log::error("Smoobu POST {$path} failed", ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException("Smoobu API error: {$response->status()}");
        }

        return $response->json() ?? [];
    }

    // ─── Mock Responses ────────────────────────────────────────────────────

    private function mockRates(string $checkIn, string $checkOut, array $unitIds): array
    {
        $units  = config('content.units', []);
        $result = [];

        foreach ($units as $id => $unit) {
            if (!empty($unitIds) && !in_array($id, $unitIds)) continue;

            $nights   = max(1, (int) (strtotime($checkOut) - strtotime($checkIn)) / 86400);
            $baseRate = rand(85, 180);

            $result[$id] = [
                'apartment_id' => $id,
                'available'    => true,
                'min_stay'     => 2,
                'price'        => $baseRate * $nights,
                'price_per_night' => $baseRate,
                'currency'     => 'EUR',
            ];
        }

        return ['data' => $result];
    }

    private function mockCreateReservation(array $data): array
    {
        return [
            'id'                => rand(100000, 999999),
            'reference-id'      => 'FG-' . strtoupper(substr(md5(uniqid()), 0, 8)),
            'apartment'         => ['id' => $data['arrivalApartment'] ?? '', 'name' => ''],
            'arrival'           => $data['arrival'] ?? '',
            'departure'         => $data['departure'] ?? '',
            'channel'           => ['id' => config('services.smoobu.channel_id', ''), 'name' => 'Website'],
            'guest-name'        => ($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''),
            'email'             => $data['email'] ?? '',
            'phone'             => $data['phone'] ?? '',
            'adults'            => $data['adults'] ?? 2,
            'children'          => $data['children'] ?? 0,
            'price'             => $data['price'] ?? 0,
            'price-paid'        => 0,
        ];
    }

    private function mockReservation(string $id): array
    {
        return [
            'id'            => $id,
            'reference-id'  => 'FG-MOCK' . substr($id, -4),
            'type'          => 'reservation',
            'status'        => 1,
            'apartment'     => ['id' => '2120861', 'name' => 'ForRest DeLuxe House'],
            'channel'       => ['id' => '', 'name' => 'Website'],
            'guest-name'    => 'Test Guest',
            'email'         => 'test@example.com',
            'phone'         => '+371 20000000',
            'adults'        => 2,
            'children'      => 0,
            'arrival'       => now()->addDays(7)->format('Y-m-d'),
            'departure'     => now()->addDays(9)->format('Y-m-d'),
            'price'         => 350.00,
            'price-paid'    => 0,
        ];
    }

    private function mockListReservations(array $params): array
    {
        return ['bookings' => [], 'page_count' => 0, 'page' => 1];
    }
}
