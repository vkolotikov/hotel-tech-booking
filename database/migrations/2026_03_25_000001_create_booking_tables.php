<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Admin users
        Schema::create('admin_users', function (Blueprint $table) {
            $table->id();
            $table->string('email', 180)->unique();
            $table->string('password_hash', 255);
            $table->string('display_name', 120)->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        // Booking holds (temporary price locks)
        Schema::create('booking_holds', function (Blueprint $table) {
            $table->id();
            $table->string('hold_token', 64)->unique();
            $table->string('status', 20)->default('active'); // active, expired, consumed, cancelled
            $table->timestamp('expires_at');
            $table->jsonb('payload_json')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('expires_at');
        });

        // API cache
        Schema::create('api_cache', function (Blueprint $table) {
            $table->string('cache_key', 255)->primary();
            $table->jsonb('payload_json')->nullable();
            $table->timestamp('expires_at');

            $table->index('expires_at');
        });

        // Audit logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 60);
            $table->string('request_id', 64)->nullable();
            $table->string('idempotency_key', 128)->nullable();
            $table->string('request_ip', 45)->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('event_type');
            $table->index('request_ip');
            $table->index('created_at');
        });

        // Idempotency keys
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->id();
            $table->string('idempotency_key', 128)->unique();
            $table->string('request_hash', 64)->nullable();
            $table->jsonb('response_json')->nullable();
            $table->smallInteger('status_code')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        // Booking submissions (success/failure log)
        Schema::create('booking_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 64)->nullable();
            $table->string('idempotency_key', 128)->nullable();
            $table->string('outcome', 20); // success, failure
            $table->string('failure_code', 60)->nullable();
            $table->text('failure_message')->nullable();
            $table->string('booking_reference', 60)->nullable();
            $table->string('reservation_id', 60)->nullable();
            $table->string('guest_name', 180)->nullable();
            $table->string('guest_email', 180)->nullable();
            $table->string('guest_phone', 40)->nullable();
            $table->string('unit_id', 20)->nullable();
            $table->string('unit_name', 120)->nullable();
            $table->date('check_in')->nullable();
            $table->date('check_out')->nullable();
            $table->smallInteger('adults')->nullable();
            $table->smallInteger('children')->nullable();
            $table->decimal('gross_total', 12, 2)->nullable();
            $table->string('payment_method', 40)->nullable();
            $table->string('payment_status', 40)->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->timestamps();

            $table->index('outcome');
            $table->index('guest_email');
            $table->index('booking_reference');
            $table->index('created_at');
        });

        // Booking mirror (Smoobu reservation data)
        Schema::create('booking_mirror', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_id', 30)->unique();
            $table->string('booking_reference', 60)->nullable();
            $table->string('booking_type', 40)->nullable();
            $table->string('booking_state', 40)->nullable();
            $table->string('apartment_id', 20)->nullable();
            $table->string('apartment_name', 180)->nullable();
            $table->string('channel_id', 20)->nullable();
            $table->string('channel_name', 80)->nullable();
            $table->string('guest_name', 180)->nullable();
            $table->string('guest_email', 180)->nullable();
            $table->string('guest_phone', 40)->nullable();
            $table->string('guest_language', 10)->nullable();
            $table->smallInteger('adults')->nullable();
            $table->smallInteger('children')->nullable();
            $table->date('arrival_date')->nullable();
            $table->date('departure_date')->nullable();
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->decimal('price_total', 12, 2)->nullable();
            $table->decimal('price_paid', 12, 2)->nullable();
            $table->decimal('prepayment_amount', 12, 2)->nullable();
            $table->boolean('prepayment_paid')->default(false);
            $table->decimal('deposit_amount', 12, 2)->nullable();
            $table->boolean('deposit_paid')->default(false);
            $table->text('notice')->nullable();
            $table->text('assistant_notice')->nullable();
            $table->string('guest_app_url', 512)->nullable();
            $table->string('payment_method', 40)->nullable();
            $table->string('payment_status', 40)->nullable();
            $table->string('internal_status', 40)->default('new');
            $table->string('invoice_state', 40)->default('none');
            $table->timestamp('source_created_at')->nullable();
            $table->timestamp('source_updated_at')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->jsonb('raw_json')->nullable();
            $table->timestamps();

            $table->index('apartment_id');
            $table->index('arrival_date');
            $table->index('departure_date');
            $table->index('booking_state');
            $table->index('internal_status');
            $table->index('payment_status');
        });

        // Booking price elements (line items)
        Schema::create('booking_price_elements', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_id', 30);
            $table->string('remote_price_element_id', 30)->nullable();
            $table->string('element_type', 40)->nullable();
            $table->string('name', 180)->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('tax', 8, 2)->nullable();
            $table->string('currency_code', 3)->default('EUR');
            $table->smallInteger('sort_order')->default(0);
            $table->jsonb('raw_json')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index('reservation_id');
        });

        // Booking notes (admin notes)
        Schema::create('booking_notes', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_id', 30);
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->text('body');
            $table->timestamp('created_at')->useCurrent();

            $table->index('reservation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_notes');
        Schema::dropIfExists('booking_price_elements');
        Schema::dropIfExists('booking_mirror');
        Schema::dropIfExists('booking_submissions');
        Schema::dropIfExists('idempotency_keys');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('api_cache');
        Schema::dropIfExists('booking_holds');
        Schema::dropIfExists('admin_users');
    }
};
