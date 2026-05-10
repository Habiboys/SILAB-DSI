<?php

namespace Database\Seeders;

use App\Models\Praktikan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder khusus untuk E2E testing dengan Playwright.
 * Jalankan secara mandiri: php artisan db:seed --class=E2ESetupSeeder
 *
 * Membuat:
 *   - Roles & permissions (idempotent)
 *   - superadmin1@admin.com / password  (bypass semua middleware)
 *   - 12345678_testuser@student.unand.ac.id / 12345678  (role praktikan)
 */
class E2ESetupSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan roles sudah ada (firstOrCreate — aman dijalankan berulang)
        $this->call(RolesAndPermissionsSeeder::class);

        $this->createSuperadmin();
        $this->createTestPraktikan();
    }

    private function createSuperadmin(): void
    {
        if (User::where('email', 'superadmin1@admin.com')->exists()) {
            return;
        }

        $user = User::create([
            'name'     => 'Super Admin',
            'email'    => 'superadmin1@admin.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole('superadmin');
    }

    private function createTestPraktikan(): void
    {
        $user = User::firstOrCreate(
            ['email' => '12345678_testuser@student.unand.ac.id'],
            [
                'name'     => 'testuser',
                'password' => Hash::make('12345678'),
            ]
        );

        if (!$user->hasRole('praktikan')) {
            $user->assignRole('praktikan');
        }

        // Upsert Praktikan — pastikan no_hp terisi agar tidak redirect ke /profile
        Praktikan::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nim'   => '12345678',
                'nama'  => 'testuser',
                'no_hp' => '081234567890',
            ]
        );
    }
}
