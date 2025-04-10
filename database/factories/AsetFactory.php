<?php

namespace Database\Factories;

use App\Models\Aset;
use App\Models\Laboratorium;
use Illuminate\Database\Eloquent\Factories\Factory;

class AsetFactory extends Factory
{
    protected $model = Aset::class;

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
            'deskripsi' => $this->faker->sentence(),
            'jumlah' => $this->faker->numberBetween(1, 30),
            'laboratorium_id' => Laboratorium::inRandomOrder()->first()->id,
        ];
    }
}