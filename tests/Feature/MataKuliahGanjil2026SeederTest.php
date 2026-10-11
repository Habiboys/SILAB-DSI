<?php

namespace Tests\Feature;

use App\Models\MataKuliah;
use Database\Seeders\MataKuliahGanjil2026Seeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MataKuliahGanjil2026SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_updates_existing_codes_without_duplicates_or_removing_other_courses(): void
    {
        $existing = MataKuliah::create(['kode_mata_kuliah' => 'DSI61104', 'nama' => 'Nama lama',
            'sks' => 2, 'semester' => 2, 'status' => 'nonaktif']);
        $other = MataKuliah::create(['kode_mata_kuliah' => 'OTHER001', 'nama' => 'Mata kuliah lain',
            'sks' => 2, 'semester' => 1, 'status' => 'nonaktif']);

        $this->seed(MataKuliahGanjil2026Seeder::class);
        $this->seed(MataKuliahGanjil2026Seeder::class);

        $this->assertDatabaseCount('mata_kuliah', 95);
        $this->assertDatabaseHas('mata_kuliah', ['id' => $existing->id, 'nama' => 'Algoritma dan Pemrograman Dasar',
            'sks' => 3, 'semester' => 1, 'status' => 'aktif']);
        $this->assertDatabaseHas('mata_kuliah', ['kode_mata_kuliah' => 'AND60101', 'semester' => 7]);
        $this->assertDatabaseHas('mata_kuliah', ['kode_mata_kuliah' => 'JSI61103', 'nama' => 'Dasar-dasar Pemrograman']);
        $this->assertDatabaseHas('mata_kuliah', ['id' => $other->id, 'status' => 'nonaktif']);
        $this->assertSame(94, MataKuliah::where('status', 'aktif')->count());
    }
}
