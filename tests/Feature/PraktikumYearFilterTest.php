<?php
namespace Tests\Feature;
use App\Models\{User, Laboratorium, TahunKepengurusan, KepengurusanLab, Praktikum, Praktikan, PraktikanPraktikum, Kelas};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class PraktikumYearFilterTest extends TestCase
{
    use RefreshDatabase;
    public function test_selected_year_only_returns_enrolled_practicums_for_that_year(): void
    {
        $this->withoutMiddleware(); $this->withoutVite();
        $user = User::factory()->create();
        $student = Praktikan::create(['user_id' => $user->id, 'nim' => '99112233', 'nama' => 'Audit']);
        $lab = Laboratorium::create(['nama' => 'Audit', 'is_active' => true]);
        $periods = [];
        foreach ([2025, 2026] as $year) {
            $y = TahunKepengurusan::create(['tahun' => (string)$year, 'mulai' => "$year-01-01", 'selesai' => "$year-12-31", 'isactive' => $year === 2026]);
            $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $y->id, 'is_active' => $year === 2026]);
            $p = Praktikum::create(['mata_kuliah' => "Praktikum $year", 'kepengurusan_lab_id' => $period->id]);
            $kelas = Kelas::create(['nama_kelas' => 'A', 'praktikum_id' => $p->id, 'status' => 'aktif']);
            PraktikanPraktikum::create(['praktikan_id' => $student->id, 'praktikum_id' => $p->id, 'kelas_id' => $kelas->id, 'status' => 'aktif']);
            $periods[$year] = $period;
        }
        foreach ($periods as $year => $period) {
            $this->actingAs($user)->get(route('praktikan.daftar-tugas', ['kepengurusan_lab_id' => $period->id]))
                ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Praktikan/DaftarTugas')
                    ->has('praktikans', 1)->where('praktikans.0.praktikum.mata_kuliah', "Praktikum $year")
                    ->where('practicumYear', (string)$year)->where('practicumArchive', $year === 2025));
        }
    }
}
