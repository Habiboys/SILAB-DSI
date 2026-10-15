<?php

namespace Tests\Feature;

use App\Models\{KepengurusanLab, Laboratorium, TahunKepengurusan, Praktikum, Kelas};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PraktikumEditingTest extends TestCase
{
    use RefreshDatabase;

    public function test_editing_praktikum_without_schedule_preserves_classes_and_their_schedule(): void
    {
        $this->withoutMiddleware();
        $lab = Laboratorium::create(['nama' => 'Audit praktikum', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $praktikum = Praktikum::create(['mata_kuliah' => 'Lama', 'kepengurusan_lab_id' => $period->id]);
        $kelas = Kelas::create(['praktikum_id' => $praktikum->id, 'nama_kelas' => 'A', 'status' => 'aktif', 'hari' => 'Senin', 'jam_mulai' => '08:00', 'jam_selesai' => '10:00', 'ruangan' => 'Lab A']);
        $this->from('/praktikum')->put(route('praktikum.update', $praktikum), [
            'mata_kuliah' => 'Baru', 'kepengurusan_lab_id' => $period->id,
        ])->assertSessionHasNoErrors()->assertSessionHas('message', 'Praktikum berhasil diperbarui');
        $this->assertSame('Baru', $praktikum->fresh()->mata_kuliah);
        $this->assertDatabaseCount('kelas', 1);
        $this->assertDatabaseHas('kelas', ['id' => $kelas->id, 'nama_kelas' => 'A', 'hari' => 'Senin', 'jam_mulai' => '08:00:00', 'jam_selesai' => '10:00:00', 'ruangan' => 'Lab A']);
    }
}
