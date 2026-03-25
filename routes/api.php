<?php

use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\AdminController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ─── Public Endpoints ──────────────────────────────────────────────────
    Route::get('health',         [PublicController::class, 'health']);
    Route::get('config',         [PublicController::class, 'config']);
    Route::get('availability',   [PublicController::class, 'availability']);
    Route::get('unit/{unitId}/rates', [PublicController::class, 'unitRates']);
    Route::post('booking/quote',     [PublicController::class, 'quote']);
    Route::post('booking/confirm',   [PublicController::class, 'confirm']);
    Route::post('webhooks/smoobu',   [PublicController::class, 'webhook']);

    // ─── Admin Endpoints ───────────────────────────────────────────────────
    Route::prefix('admin')->group(function () {
        // Auth (unprotected)
        Route::post('auth/login',  [AdminController::class, 'login']);
        Route::post('auth/logout', [AdminController::class, 'logout']);

        // Protected admin routes
        Route::middleware('admin.auth')->group(function () {
            Route::get('auth/me',       [AdminController::class, 'me']);
            Route::get('dashboard',     [AdminController::class, 'dashboard']);
            Route::get('submissions',   [AdminController::class, 'submissions']);
            Route::get('bookings',      [AdminController::class, 'bookings']);
            Route::get('bookings/{reservationId}',           [AdminController::class, 'bookingDetail']);
            Route::post('bookings/{reservationId}/refresh',  [AdminController::class, 'refreshBooking']);
            Route::post('bookings/{reservationId}/notes',    [AdminController::class, 'addNote']);
            Route::patch('bookings/{reservationId}/ops',     [AdminController::class, 'updateOps']);
            Route::get('calendar',      [AdminController::class, 'calendar']);
            Route::get('payments',      [AdminController::class, 'payments']);
            Route::post('sync/reservations', [AdminController::class, 'syncReservations']);
        });
    });
});
