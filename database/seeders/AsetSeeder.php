<?php

namespace Database\Seeders;

use App\Models\DetailAset;
use Database\Factories\AsetFactory;
use App\Models\Laboratorium;
use Illuminate\Database\Seeder;

class AsetSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new \RuntimeException('Aset contoh tidak boleh dibuat pada lingkungan production.');
        }
        $labs = Laboratorium::all();

        foreach ($labs as $lab) {
            for ($index = 1; $index <= 10; $index++) {
                $code = 'SAMPLE-'.$lab->id.'-'.$index;
                if (DetailAset::where('kode_barang', $code)->exists()) continue;
                AsetFactory::new()->create(['laboratorium_id' => $lab->id, 'kode_barang' => $code]);
            }
        }
    }
}
