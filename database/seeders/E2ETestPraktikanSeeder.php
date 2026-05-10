<?php

namespace Database\Seeders;

use App\Models\Praktikan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2ETestPraktikanSeeder extends Seeder
{
    // Kredensial tetap untuk E2E testing — jangan ubah tanpa update global-setup.js
    const TEST_NIM = '12345678';
    const TEST_NAME = 'testuser';
    const TEST_EMAIL = '12345678_testuser@student.unand.ac.id';

    public function run(): void
    {
        // Skip jika sudah ada (idempotent)
        if (User::where('email', self::TEST_EMAIL)->exists()) {
            return;
        }

        $user = User::create([
            'name' => self::TEST_NAME,
            'email' => self::TEST_EMAIL,
            'password' => Hash::make(self::TEST_NIM),
        ]);

        $user->assignRole('praktikan');

        Praktikan::create([
            'nim' => self::TEST_NIM,
            'nama' => self::TEST_NAME,
            'user_id' => $user->id,
        ]);
    }
}
