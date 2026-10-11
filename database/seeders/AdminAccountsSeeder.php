<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Laboratorium;

class AdminAccountsSeeder extends Seeder
{
    public function run()
    {
        if (app()->environment('production')) {
            throw new \RuntimeException('Akun contoh tidak boleh dibuat pada lingkungan production.');
        }
        $superadmin = User::firstOrCreate(['email' => 'superadmin1@admin.com'], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'must_change_password' => true,
        ]);
        $superadmin->assignRole('superadmin');

        $kadep = User::firstOrCreate(['email' => 'kadep1@admin.com'], [
            'name' => 'Kepala Departemen',
            'password' => Hash::make('password'),
            'must_change_password' => true,
        ]);
        $kadep->assignRole('kadep');

        $laboratories = Laboratorium::all();
        foreach ($laboratories as $lab) {
            $admin = User::firstOrCreate(['email' => "admin.{$lab->id}@admin.com"], [
                'name' => "Admin {$lab->nama}",
                'password' => Hash::make('password'),
                'access_lab_id' => $lab->id,
                'must_change_password' => true,
            ]);
            $admin->assignRole('admin');
        }

    }
}
