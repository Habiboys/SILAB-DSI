<?php

namespace Database\Factories;

use App\Models\DetailAset;
use App\Models\KategoriAset;
use App\Models\Laboratorium;
use Illuminate\Database\Eloquent\Factories\Factory;

class AsetFactory extends Factory
{
    protected $model = DetailAset::class;

    public function definition()
    {
        return [
            'nama' => $this->faker->randomElement([
                'Komputer',
                'Monitor',
                'Keyboard',
                'Mouse',
                'Printer',
                'Projector',
                'Router',
                'Switch',
                'Access Point',
                'UPS',
                'Kursi',
                'Meja',
                'Papan Tulis',
                'AC',
                'Kipas Angin'
            ]),
            'kode_barang' => 'SAMPLE-'.$this->faker->unique()->uuid(),
            'kategori_aset_id' => KategoriAset::firstOrCreate(['nama' => 'Peralatan Contoh'], ['deskripsi' => 'Data contoh'])->id,
            'keterangan' => $this->faker->sentence(),
            'keadaan' => 'baik', 'status' => 'tersedia', 'foto' => '',
            'laboratorium_id' => Laboratorium::inRandomOrder()->first()->id,
        ];
    }
}
