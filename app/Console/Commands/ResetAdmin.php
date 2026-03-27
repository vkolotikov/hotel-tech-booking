<?php

namespace App\Console\Commands;

use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdmin extends Command
{
    protected $signature = 'admin:reset';
    protected $description = 'Reset admin user with credentials from env vars';

    public function handle(): int
    {
        // Clear rate limiting
        AuditLog::where('event_type', 'admin.login_attempt')->delete();
        $this->info('Cleared login rate limits.');

        // Delete all admin users
        AdminUser::truncate();
        $this->info('Cleared admin users.');

        // Create fresh admin
        $email = config('services.admin.bootstrap_email', 'info@hotel-tech.ai');
        $password = config('services.admin.bootstrap_password', 'First-Design-Studio');

        $hash = Hash::make($password);

        // Insert directly via DB to bypass any casts
        \Illuminate\Support\Facades\DB::table('admin_users')->insert([
            'email'         => $email,
            'password_hash' => $hash,
            'display_name'  => config('services.admin.bootstrap_name', 'Super Admin'),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Verify it works
        $user = AdminUser::where('email', $email)->first();
        $check = Hash::check($password, $user->password_hash);

        $this->info("Created admin: {$email}");
        $this->info("Password verify: " . ($check ? 'OK' : 'FAILED'));

        return 0;
    }
}
