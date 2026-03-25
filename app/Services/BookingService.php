<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\BookingHold;
use App\Models\BookingSubmission;
use App\Models\IdempotencyKey;
use Illuminate\Support\Str;

class BookingService
{
    public function __construct(private SmoobuClient $smoobu) {}

    /** Create a price quote with hold token. */
    public function quote(array $data): array
    {
        $unitId   = $data['unit_id'];
        $checkIn  = $data['check_in'];
        $checkOut = $data['check_out'];
        $adults   = $data['adults'] ?? 2;
        $children = $data['children'] ?? 0;
        $extras   = $data['extras'] ?? [];

        $unit  = config("content.units.{$unitId}");
        if (!$unit) {
            throw new \InvalidArgumentException('Unknown unit');
        }

        // Get rates from Smoobu
        $avail = app(AvailabilityService::class);
        $rates = $avail->unitRates($unitId, $checkIn, $checkOut, $adults);

        if (empty($rates) || !($rates['available'] ?? false)) {
            throw new \RuntimeException('Unit not available for selected dates');
        }

        $nights       = max(1, (int) ((strtotime($checkOut) - strtotime($checkIn)) / 86400));
        $roomTotal    = $rates['price'] ?? ($rates['price_per_night'] ?? 0) * $nights;
        $extrasTotal  = $this->calcExtras($extras, $adults);
        $grossTotal   = $roomTotal + $extrasTotal;

        // Create a hold
        $holdToken = Str::random(48);
        BookingHold::create([
            'hold_token'   => $holdToken,
            'status'       => 'active',
            'expires_at'   => now()->addMinutes(10),
            'payload_json' => [
                'unit_id'        => $unitId,
                'unit_name'      => $unit['name'],
                'check_in'       => $checkIn,
                'check_out'      => $checkOut,
                'nights'         => $nights,
                'adults'         => $adults,
                'children'       => $children,
                'room_total'     => $roomTotal,
                'extras'         => $extras,
                'extras_total'   => $extrasTotal,
                'gross_total'    => $grossTotal,
                'currency'       => 'EUR',
                'price_per_night'=> $rates['price_per_night'] ?? round($roomTotal / $nights, 2),
            ],
        ]);

        return [
            'hold_token'      => $holdToken,
            'expires_at'      => now()->addMinutes(10)->toIso8601String(),
            'unit_id'         => $unitId,
            'unit_name'       => $unit['name'],
            'check_in'        => $checkIn,
            'check_out'       => $checkOut,
            'nights'          => $nights,
            'adults'          => $adults,
            'children'        => $children,
            'room_total'      => $roomTotal,
            'extras_total'    => $extrasTotal,
            'gross_total'     => $grossTotal,
            'currency'        => 'EUR',
            'price_per_night' => $rates['price_per_night'] ?? round($roomTotal / $nights, 2),
        ];
    }

    /** Confirm a booking from hold token. */
    public function confirm(array $data, ?string $idempotencyKey = null, ?string $requestId = null, ?string $ip = null): array
    {
        // Check idempotency
        if ($idempotencyKey) {
            $existing = IdempotencyKey::where('idempotency_key', $idempotencyKey)->first();
            if ($existing && $existing->isValid()) {
                return array_merge($existing->response_json, ['replayed' => true]);
            }
        }

        $holdToken = $data['hold_token'];
        $hold      = BookingHold::where('hold_token', $holdToken)->first();

        if (!$hold || !$hold->isActive()) {
            $this->logSubmission('failure', 'hold_expired', 'Hold expired or not found', $data, $requestId, $idempotencyKey);
            throw new \RuntimeException('Hold expired or not found');
        }

        $payload = $hold->payload_json;
        $guest   = $data['guest'] ?? [];

        // Create reservation in Smoobu
        try {
            $result = $this->smoobu->createReservation([
                'arrivalApartment' => $payload['unit_id'],
                'arrival'          => $payload['check_in'],
                'departure'        => $payload['check_out'],
                'firstName'        => $guest['first_name'] ?? '',
                'lastName'         => $guest['last_name'] ?? '',
                'email'            => $guest['email'] ?? '',
                'phone'            => $guest['phone'] ?? '',
                'adults'           => $payload['adults'],
                'children'         => $payload['children'],
                'price'            => $payload['gross_total'],
                'channelId'        => config('services.smoobu.channel_id', ''),
            ]);
        } catch (\Throwable $e) {
            $this->logSubmission('failure', 'smoobu_error', $e->getMessage(), $data, $requestId, $idempotencyKey);
            throw $e;
        }

        // Consume hold
        $hold->update(['status' => 'consumed']);

        $response = [
            'success'          => true,
            'booking_reference'=> $result['reference-id'] ?? null,
            'reservation_id'   => (string) ($result['id'] ?? ''),
            'unit_name'        => $payload['unit_name'],
            'check_in'         => $payload['check_in'],
            'check_out'        => $payload['check_out'],
            'gross_total'      => $payload['gross_total'],
            'currency'         => 'EUR',
        ];

        // Save idempotency
        if ($idempotencyKey) {
            IdempotencyKey::create([
                'idempotency_key' => $idempotencyKey,
                'request_hash'    => md5(json_encode($data)),
                'response_json'   => $response,
                'status_code'     => 201,
                'expires_at'      => now()->addHours(24),
            ]);
        }

        // Log success
        $this->logSubmission('success', null, null, array_merge($data, $response), $requestId, $idempotencyKey, $response);

        AuditLog::log('booking.confirmed', [
            'reservation_id'   => $response['reservation_id'],
            'booking_reference'=> $response['booking_reference'],
        ], $ip, $requestId);

        return $response;
    }

    private function calcExtras(array $extras, int $adults): float
    {
        $allExtras = collect(config('content.extras', []));
        $total     = 0.0;

        foreach ($extras as $item) {
            $extraId = $item['id'] ?? '';
            $qty     = $item['quantity'] ?? 1;
            $def     = $allExtras->firstWhere('id', $extraId);
            if (!$def) continue;

            $price = $def['price'];
            if ($def['type'] === 'per_guest') {
                $total += $price * $adults * $qty;
            } else {
                $total += $price * $qty;
            }
        }

        return $total;
    }

    private function logSubmission(string $outcome, ?string $failCode, ?string $failMsg, array $data, ?string $requestId, ?string $idempotencyKey, array $response = []): void
    {
        $payload = $data['hold_token'] ? ($data['hold'] ?? []) : [];
        $guest   = $data['guest'] ?? [];

        BookingSubmission::create([
            'request_id'        => $requestId,
            'idempotency_key'   => $idempotencyKey,
            'outcome'           => $outcome,
            'failure_code'      => $failCode,
            'failure_message'   => $failMsg,
            'booking_reference' => $response['booking_reference'] ?? null,
            'reservation_id'    => $response['reservation_id'] ?? null,
            'guest_name'        => trim(($guest['first_name'] ?? '') . ' ' . ($guest['last_name'] ?? '')),
            'guest_email'       => $guest['email'] ?? null,
            'guest_phone'       => $guest['phone'] ?? null,
            'unit_id'           => $payload['unit_id'] ?? $data['unit_id'] ?? null,
            'unit_name'         => $payload['unit_name'] ?? null,
            'check_in'          => $payload['check_in'] ?? null,
            'check_out'         => $payload['check_out'] ?? null,
            'adults'            => $payload['adults'] ?? null,
            'children'          => $payload['children'] ?? null,
            'gross_total'       => $payload['gross_total'] ?? $response['gross_total'] ?? null,
            'payment_method'    => $data['payment_method'] ?? null,
            'payload_json'      => $data,
        ]);
    }
}
