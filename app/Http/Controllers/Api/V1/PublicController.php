<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /** Health check. */
    public function health(): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'app'     => 'forrest-booking',
            'laravel' => app()->version(),
        ]);
    }

    /** Unit & extras catalog. */
    public function config(): JsonResponse
    {
        return response()->json([
            'units'    => array_values(config('content.units', [])),
            'extras'   => config('content.extras', []),
            'policies' => config('content.policies', []),
        ]);
    }

    /** Check availability. */
    public function availability(Request $request, AvailabilityService $service): JsonResponse
    {
        $request->validate([
            'checkIn'  => 'required|date',
            'checkOut' => 'required|date|after:checkIn',
            'adults'   => 'integer|min:1|max:10',
            'children' => 'integer|min:0|max:6',
        ]);

        $results = $service->check(
            $request->input('checkIn'),
            $request->input('checkOut'),
            (int) $request->input('adults', 2),
            (int) $request->input('children', 0),
        );

        return response()->json(['units' => $results]);
    }

    /** Get rates for a specific unit. */
    public function unitRates(Request $request, string $unitId, AvailabilityService $service): JsonResponse
    {
        $request->validate([
            'checkIn'  => 'required|date',
            'checkOut' => 'required|date|after:checkIn',
            'adults'   => 'integer|min:1|max:10',
        ]);

        $rates = $service->unitRates(
            $unitId,
            $request->input('checkIn'),
            $request->input('checkOut'),
            (int) $request->input('adults', 2),
        );

        return response()->json($rates);
    }

    /** Create a price quote with hold token. */
    public function quote(Request $request, BookingService $service): JsonResponse
    {
        $validated = $request->validate([
            'unit_id'   => 'required|string',
            'check_in'  => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'adults'    => 'integer|min:1|max:10',
            'children'  => 'integer|min:0|max:6',
            'extras'    => 'array',
            'extras.*.id'       => 'required|string',
            'extras.*.quantity' => 'integer|min:1',
        ]);

        $quote = $service->quote($validated);
        return response()->json($quote, 201);
    }

    /** Confirm a booking. */
    public function confirm(Request $request, BookingService $service): JsonResponse
    {
        $validated = $request->validate([
            'hold_token'         => 'required|string',
            'guest.first_name'   => 'required|string|max:100',
            'guest.last_name'    => 'required|string|max:100',
            'guest.email'        => 'required|email|max:180',
            'guest.phone'        => 'nullable|string|max:40',
            'payment_method'     => 'nullable|string|max:40',
            'notes'              => 'nullable|string|max:1000',
        ]);

        $idempotencyKey = $request->header('Idempotency-Key');
        $requestId      = $request->header('X-Request-Id', (string) \Illuminate\Support\Str::uuid());

        $result = $service->confirm($validated, $idempotencyKey, $requestId, $request->ip());

        $status = ($result['replayed'] ?? false) ? 200 : 201;
        return response()->json($result, $status);
    }

    /** Smoobu webhook handler. */
    public function webhook(Request $request): JsonResponse
    {
        $secret = config('services.smoobu.webhook_secret', '');
        if ($secret && $request->header('X-Webhook-Secret') !== $secret) {
            return response()->json(['error' => 'Invalid webhook secret'], 403);
        }

        $payload = $request->all();
        \App\Models\AuditLog::log('webhook.smoobu', $payload, $request->ip());

        // Process webhook (sync reservation if applicable)
        $action        = $payload['action'] ?? '';
        $reservationId = (string) ($payload['data']['id'] ?? '');

        if ($reservationId && in_array($action, ['updateReservation', 'newReservation', 'cancelReservation'])) {
            // Could dispatch a job here; for now just log
        }

        return response()->json(['received' => true]);
    }
}
