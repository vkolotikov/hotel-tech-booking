<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use App\Models\BookingMirror;
use App\Models\BookingNote;
use App\Models\BookingPriceElement;
use App\Models\BookingSubmission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (BookingMirror::count() > 0) {
            $this->command->info('Demo data already exists — skipping.');
            return;
        }

        // Admin user
        AdminUser::firstOrCreate(
            ['email' => 'info@hotel-tech.ai'],
            ['password_hash' => Hash::make('First-Design-Studio'), 'display_name' => 'Super Admin']
        );
        AdminUser::firstOrCreate(
            ['email' => 'user@hotel-tech.ai'],
            ['password_hash' => Hash::make('First-Design-Studio'), 'display_name' => 'Regular User']
        );

        $units = config('content.units');
        $unitIds = array_keys($units);
        $guests = [
            ['Janis Berzins', 'janis@inbox.lv', '+371 26 111 222', 'lv'],
            ['Anna Müller', 'anna.m@gmail.com', '+49 170 1234567', 'de'],
            ['Erik Svensson', 'erik.s@outlook.com', '+46 70 9876543', 'sv'],
            ['Laura Ozola', 'laura.ozola@mail.lv', '+371 29 333 444', 'lv'],
            ['Markus Schmidt', 'markus.s@web.de', '+49 171 5556677', 'de'],
            ['Ilze Kalniņa', 'ilze.k@gmail.com', '+371 25 555 666', 'lv'],
            ['Thomas Berger', 'thomas.b@gmail.com', '+43 664 1112233', 'de'],
            ['Kristine Liepina', 'kristine.l@inbox.lv', '+371 22 777 888', 'lv'],
            ['Olga Petrova', 'olga.p@yandex.ru', '+7 916 1234567', 'ru'],
            ['Peter Nielsen', 'peter.n@mail.dk', '+45 20 112233', 'da'],
            ['Sophie Laurent', 'sophie.l@orange.fr', '+33 6 78901234', 'fr'],
            ['Andris Ozols', 'andris.o@gmail.com', '+371 28 999 000', 'lv'],
        ];

        $states = ['confirmed', 'confirmed', 'confirmed', 'cancelled', 'confirmed'];
        $channels = ['Website', 'Booking.com', 'Airbnb', 'Website', 'Direct'];

        // Create 12 mirror bookings
        for ($i = 0; $i < 12; $i++) {
            $guest   = $guests[$i];
            $unitKey = $unitIds[$i % count($unitIds)];
            $unit    = $units[$unitKey];
            $arrival = now()->addDays(rand(-10, 30))->format('Y-m-d');
            $nights  = rand(2, 5);
            $departure = date('Y-m-d', strtotime("{$arrival} +{$nights} days"));
            $price   = rand(180, 600);
            $state   = $states[$i % count($states)];
            $channel = $channels[$i % count($channels)];
            $resId   = (string) (800000 + $i);

            BookingMirror::create([
                'reservation_id'    => $resId,
                'booking_reference' => 'FG-' . strtoupper(substr(md5($resId), 0, 8)),
                'booking_type'      => 'reservation',
                'booking_state'     => $state,
                'apartment_id'      => $unitKey,
                'apartment_name'    => $unit['name'],
                'channel_id'        => (string) ($i + 100),
                'channel_name'      => $channel,
                'guest_name'        => $guest[0],
                'guest_email'       => $guest[1],
                'guest_phone'       => $guest[2],
                'guest_language'    => $guest[3],
                'adults'            => rand(1, $unit['max_guests']),
                'children'          => rand(0, 1),
                'arrival_date'      => $arrival,
                'departure_date'    => $departure,
                'price_total'       => $price,
                'price_paid'        => $state === 'confirmed' ? $price * 0.3 : 0,
                'payment_method'    => ['card', 'bank_transfer', 'cash'][$i % 3],
                'payment_status'    => $state === 'confirmed' ? 'partial' : 'none',
                'internal_status'   => $state === 'confirmed' ? 'confirmed' : 'cancelled',
                'synced_at'         => now(),
            ]);

            // Price elements
            BookingPriceElement::create([
                'reservation_id' => $resId,
                'element_type'   => 'accommodation',
                'name'           => $unit['name'] . " ({$nights} nights)",
                'amount'         => $price * 0.85,
                'quantity'       => 1,
                'tax'            => $price * 0.15,
                'currency_code'  => 'EUR',
                'sort_order'     => 0,
                'synced_at'      => now(),
            ]);

            if ($i % 3 === 0) {
                BookingPriceElement::create([
                    'reservation_id' => $resId,
                    'element_type'   => 'extra',
                    'name'           => 'Breakfast Basket',
                    'amount'         => 18.00,
                    'quantity'       => $nights,
                    'tax'            => 18.00 * $nights * 0.21,
                    'currency_code'  => 'EUR',
                    'sort_order'     => 1,
                    'synced_at'      => now(),
                ]);
            }

            // Some admin notes
            if ($i < 4) {
                BookingNote::create([
                    'reservation_id' => $resId,
                    'admin_user_id'  => 1,
                    'body'           => ['Early check-in requested', 'Repeat guest — upgrade if possible', 'Needs wheelchair access', 'Anniversary trip — arrange flowers'][$i],
                ]);
            }
        }

        // Booking submissions
        for ($i = 0; $i < 5; $i++) {
            $guest = $guests[$i];
            BookingSubmission::create([
                'outcome'           => $i < 4 ? 'success' : 'failure',
                'failure_code'      => $i >= 4 ? 'hold_expired' : null,
                'failure_message'   => $i >= 4 ? 'Hold token expired before confirmation' : null,
                'booking_reference' => $i < 4 ? 'FG-' . strtoupper(substr(md5("sub{$i}"), 0, 8)) : null,
                'reservation_id'    => $i < 4 ? (string) (800000 + $i) : null,
                'guest_name'        => $guest[0],
                'guest_email'       => $guest[1],
                'guest_phone'       => $guest[2],
                'unit_id'           => $unitIds[$i % count($unitIds)],
                'unit_name'         => $units[$unitIds[$i % count($unitIds)]]['name'],
                'check_in'          => now()->addDays(rand(1, 30))->format('Y-m-d'),
                'check_out'         => now()->addDays(rand(31, 40))->format('Y-m-d'),
                'adults'            => 2,
                'children'          => 0,
                'gross_total'       => rand(200, 500),
                'payment_method'    => 'card',
            ]);
        }

        $this->command->info('Seeded 1 admin user, 12 bookings, 5 submissions, 4 notes.');
    }
}
