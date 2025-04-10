<?php

namespace Database\Seeders;

use App\Models\Aset;
use App\Models\Laboratorium;
use Illuminate\Database\Seeder;

class AsetSeeder extends Seeder
{
    public function run(): void
    {
        $labs = Laboratorium::all();

        foreach ($labs as $lab) {
            // Create 10-15 items for each lab
            Aset::factory()
                ->count(rand(10, 15))
                ->create([
                    'laboratorium_id' => $lab->id
                ]);
        }
    }
}