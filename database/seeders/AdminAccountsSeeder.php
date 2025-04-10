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
    // Create superadmin (no lab assignment needed)
    $superadmin = User::create([
        'name' => 'Super Admin',
        'email' => 'superadmin1@admin.com',
        'password' => Hash::make('password'),
        // laboratory_id remains null
    ]);
    $superadmin->assignRole('superadmin');

    // Create kadep (no lab assignment needed)
    $kadep = User::create([
        'name' => 'Kepala Departemen',
        'email' => 'kadep1@admin.com',
        'password' => Hash::make('password'),
        // laboratory_id remains null
    ]);
    $kadep->assignRole('kadep');

    // Create admin for each lab
    $laboratories = Laboratorium::all();
    foreach ($laboratories as $lab) {
        $admin = User::create([
            'name' => "Admin {$lab->nama}",
            'email' => "admin.{$lab->id}@admin.com",
            'password' => Hash::make('password'),
            'laboratory_id' => $lab->id
        ]);
        $admin->assignRole('admin');
    }

    // // Create dosen and asisten with lab assignments
    // foreach ($laboratories as $lab) {
    //     // Create dosen
    //     $dosen = User::create([
    //         'name' => "Dosen {$lab->nama}",
    //         'email' => "dosen.{$lab->id}@example.com",
    //         'password' => Hash::make('password'),
    //         'laboratory_id' => $lab->id
    //     ]);
    //     $dosen->assignRole('dosen');

    //     // Create asisten
    //     $asisten = User::create([
    //         'name' => "Asisten {$lab->nama}",
    //         'email' => "asisten.{$lab->id}@example.com",
    //         'password' => Hash::make('password'),
    //         'laboratory_id' => $lab->id
    //     ]);
    //     $asisten->assignRole('asisten');
    // }
}
}