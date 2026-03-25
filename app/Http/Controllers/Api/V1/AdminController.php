<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\BookingMirror;
use App\Models\BookingNote;
use App\Models\BookingSubmission;
use App\Services\SmoobuClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // ─── Auth ──────────────────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Bootstrap admin if not exists
        $this->bootstrapAdmin();

        // Rate limiting: 8 per IP per 15 min
        $attempts = AuditLog::where('event_type', 'admin.login_attempt')
            ->where('request_ip', $request->ip())
            ->where('created_at', '>=', now()->subMinutes(15))
            ->count();

        if ($attempts >= 8) {
            return response()->json(['error' => 'Too many login attempts'], 429);
        }

        AuditLog::log('admin.login_attempt', ['email' => $request->email], $request->ip());

        $user = AdminUser::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user->update(['last_login_at' => now()]);

        // Store in session
        session(['admin_user_id' => $user->id, 'admin_user' => $user->toArray()]);

        AuditLog::log('admin.login_success', ['user_id' => $user->id], $request->ip());

        return response()->json([
            'user' => [
                'id'           => $user->id,
                'email'        => $user->email,
                'display_name' => $user->display_name,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        session()->flush();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        $userId = session('admin_user_id') ?? $request->attributes->get('saas_user_id');

        if (!$userId) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        // If SaaS auth, return SaaS user info
        if ($request->attributes->get('saas_authenticated')) {
            return response()->json([
                'user' => [
                    'id'    => $request->attributes->get('saas_user_id'),
                    'email' => $request->attributes->get('saas_user_email'),
                    'display_name' => $request->attributes->get('saas_user_email'),
                ],
            ]);
        }

        $user = AdminUser::find($userId);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json([
            'user' => [
                'id'           => $user->id,
                'email'        => $user->email,
                'display_name' => $user->display_name,
            ],
        ]);
    }

    // ─── Dashboard ─────────────────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $period = $request->input('period', 'month');
        $unitId = $request->input('unitId');

        $since = match ($period) {
            'week'  => now()->subWeek(),
            'year'  => now()->subYear(),
            default => now()->subMonth(),
        };

        $query = BookingMirror::where('synced_at', '>=', $since);
        if ($unitId) $query->where('apartment_id', $unitId);

        $bookings = $query->get();

        return response()->json([
            'total_bookings'   => $bookings->count(),
            'total_revenue'    => $bookings->sum('price_total'),
            'avg_stay'         => $bookings->avg(fn ($b) => $b->arrival_date && $b->departure_date ? $b->arrival_date->diffInDays($b->departure_date) : 0),
            'confirmed'        => $bookings->where('booking_state', 'confirmed')->count(),
            'cancelled'        => $bookings->where('booking_state', 'cancelled')->count(),
            'pending_payment'  => $bookings->where('payment_status', 'pending')->count(),
            'by_unit'          => $bookings->groupBy('apartment_name')->map->count(),
            'by_channel'       => $bookings->groupBy('channel_name')->map->count(),
        ]);
    }

    // ─── Submissions ───────────────────────────────────────────────────────

    public function submissions(Request $request): JsonResponse
    {
        $query = BookingSubmission::orderByDesc('created_at');

        if ($q = $request->input('q')) {
            $query->where(function ($qb) use ($q) {
                $qb->where('guest_name', 'ilike', "%{$q}%")
                    ->orWhere('guest_email', 'ilike', "%{$q}%")
                    ->orWhere('booking_reference', 'ilike', "%{$q}%");
            });
        }

        if ($outcome = $request->input('outcome')) {
            $query->where('outcome', $outcome);
        }

        return response()->json($query->paginate(25));
    }

    // ─── Bookings (Mirror) ─────────────────────────────────────────────────

    public function bookings(Request $request): JsonResponse
    {
        $query = BookingMirror::with('notes')
            ->orderByDesc('arrival_date');

        if ($unitId = $request->input('unitId')) {
            $query->where('apartment_id', $unitId);
        }

        if ($status = $request->input('status')) {
            $query->where('internal_status', $status);
        }

        return response()->json($query->paginate(25));
    }

    public function bookingDetail(string $reservationId): JsonResponse
    {
        $booking = BookingMirror::where('reservation_id', $reservationId)
            ->with(['priceElements', 'notes.admin'])
            ->firstOrFail();

        return response()->json($booking);
    }

    public function refreshBooking(string $reservationId, SmoobuClient $smoobu): JsonResponse
    {
        $data = $smoobu->getReservation($reservationId);

        $booking = BookingMirror::updateOrCreate(
            ['reservation_id' => $reservationId],
            [
                'booking_reference' => $data['reference-id'] ?? null,
                'booking_type'      => $data['type'] ?? null,
                'apartment_id'      => (string) ($data['apartment']['id'] ?? ''),
                'apartment_name'    => $data['apartment']['name'] ?? '',
                'channel_id'        => (string) ($data['channel']['id'] ?? ''),
                'channel_name'      => $data['channel']['name'] ?? '',
                'guest_name'        => $data['guest-name'] ?? '',
                'guest_email'       => $data['email'] ?? '',
                'guest_phone'       => $data['phone'] ?? '',
                'adults'            => $data['adults'] ?? 0,
                'children'          => $data['children'] ?? 0,
                'arrival_date'      => $data['arrival'] ?? null,
                'departure_date'    => $data['departure'] ?? null,
                'price_total'       => $data['price'] ?? 0,
                'price_paid'        => $data['price-paid'] ?? 0,
                'synced_at'         => now(),
                'raw_json'          => $data,
            ]
        );

        return response()->json($booking);
    }

    public function addNote(Request $request, string $reservationId): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:2000']);

        $note = BookingNote::create([
            'reservation_id' => $reservationId,
            'admin_user_id'  => session('admin_user_id'),
            'body'           => $request->input('body'),
        ]);

        return response()->json($note, 201);
    }

    public function updateOps(Request $request, string $reservationId): JsonResponse
    {
        $booking = BookingMirror::where('reservation_id', $reservationId)->firstOrFail();

        $validated = $request->validate([
            'internal_status' => 'sometimes|string|max:40',
            'invoice_state'   => 'sometimes|string|max:40',
        ]);

        $booking->update($validated);
        return response()->json($booking);
    }

    // ─── Calendar ──────────────────────────────────────────────────────────

    public function calendar(Request $request): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $start = "{$month}-01";
        $end   = date('Y-m-t', strtotime($start));

        $bookings = BookingMirror::where(function ($q) use ($start, $end) {
            $q->whereBetween('arrival_date', [$start, $end])
                ->orWhereBetween('departure_date', [$start, $end])
                ->orWhere(function ($q2) use ($start, $end) {
                    $q2->where('arrival_date', '<=', $start)
                        ->where('departure_date', '>=', $end);
                });
        })
        ->select('reservation_id', 'apartment_id', 'apartment_name', 'guest_name',
                 'arrival_date', 'departure_date', 'booking_state', 'internal_status', 'price_total')
        ->get();

        return response()->json([
            'month'    => $month,
            'bookings' => $bookings,
            'units'    => array_values(config('content.units', [])),
        ]);
    }

    // ─── Payments ──────────────────────────────────────────────────────────

    public function payments(Request $request): JsonResponse
    {
        $query = BookingMirror::whereNotNull('price_total')
            ->orderByDesc('arrival_date');

        if ($state = $request->input('paymentState')) {
            $query->where('payment_status', $state);
        }

        $bookings = $query->paginate(25);

        return response()->json($bookings);
    }

    // ─── Sync ──────────────────────────────────────────────────────────────

    public function syncReservations(Request $request, SmoobuClient $smoobu): JsonResponse
    {
        $data = $smoobu->listReservations([
            'from'       => $request->input('from', now()->subMonths(3)->format('Y-m-d')),
            'to'         => $request->input('to', now()->addMonths(3)->format('Y-m-d')),
            'pageSize'   => 100,
        ]);

        $synced = 0;
        foreach ($data['bookings'] ?? [] as $booking) {
            BookingMirror::updateOrCreate(
                ['reservation_id' => (string) $booking['id']],
                [
                    'booking_reference' => $booking['reference-id'] ?? null,
                    'booking_type'      => $booking['type'] ?? null,
                    'guest_name'        => $booking['guest-name'] ?? '',
                    'guest_email'       => $booking['email'] ?? '',
                    'arrival_date'      => $booking['arrival'] ?? null,
                    'departure_date'    => $booking['departure'] ?? null,
                    'apartment_id'      => (string) ($booking['apartment']['id'] ?? ''),
                    'apartment_name'    => $booking['apartment']['name'] ?? '',
                    'price_total'       => $booking['price'] ?? 0,
                    'synced_at'         => now(),
                    'raw_json'          => $booking,
                ]
            );
            $synced++;
        }

        AuditLog::log('admin.sync', ['synced' => $synced], $request->ip());

        return response()->json(['synced' => $synced]);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private function bootstrapAdmin(): void
    {
        $email = config('services.admin.bootstrap_email');
        if (!$email) return;

        if (AdminUser::where('email', $email)->exists()) return;

        AdminUser::create([
            'email'         => $email,
            'password_hash' => Hash::make(config('services.admin.bootstrap_password', 'admin')),
            'display_name'  => config('services.admin.bootstrap_name', 'Admin'),
        ]);
    }
}
