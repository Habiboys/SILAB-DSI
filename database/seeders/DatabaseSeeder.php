<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        if (app()->environment('production')) return;
        User::firstOrCreate(['email' => 'test@example.com'], [
            'name' => 'Test User', 'password' => bcrypt('password'), 'must_change_password' => true,
        ]);
        $this->call([
            AdminAccountsSeeder::class,
            AsetSeeder::class,
            PraktikanSeeder::class,
            KepengurusanUserSeeder::class,
            AslabPraktikumSeeder::class,
            ProkerKegiatanSeeder::class,
        ]);
    }
}
