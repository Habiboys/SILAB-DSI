<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AslabPraktikum;
use App\Models\Praktikum;
use App\Models\User;

class AslabPraktikumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first praktikum
        $praktikum = Praktikum::first();
        
        // Get users with asisten role
        $asistenUsers = User::role('asisten')->take(3)->get();
        
        if ($praktikum && $asistenUsers->count() > 0) {
            // Assign asisten as aslab
            foreach ($asistenUsers as $asisten) {
                AslabPraktikum::create([
                    'praktikum_id' => $praktikum->id,
                    'user_id' => $asisten->id,
                    'catatan' => 'Aslab praktikum'
                ]);
            }
        }
    }
}
