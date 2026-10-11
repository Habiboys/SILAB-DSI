<?php

namespace Tests\Feature;

use App\Models\{Absensi, DendaPiket, JadwalPiket, KepengurusanLab, KepengurusanUser, Laboratorium, PengaturanPiket, PeriodePiket, Struktur, TahunKepengurusan, User};
use App\Models\Permission\Role;
use App\Services\PiketAttendanceSummary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PiketFineCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_elapsed_scheduled_date_counts_once_and_sync_is_idempotent(): void
    {
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-01 10:00:00'));
        $lab = Laboratorium::create(['nama' => 'Fine dates', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $this->actingAs($user);
        $structure = Struktur::create(['struktur' => 'Fine audit']);
        $member = KepengurusanUser::create(['kepengurusan_lab_id' => $period->id, 'user_id' => $user->id, 'struktur_id' => $structure->id, 'is_active' => true]);
        $schedule = JadwalPiket::create(['kepengurusan_lab_id' => $period->id, 'kepengurusan_user_id' => $member->id, 'hari' => 'senin']);
        $thursday = JadwalPiket::create(['kepengurusan_lab_id' => $period->id, 'kepengurusan_user_id' => $member->id, 'hari' => 'kamis']);
        $piket = PeriodePiket::create(['kepengurusan_lab_id' => $period->id, 'nama' => 'October', 'tanggal_mulai' => '2026-10-01', 'tanggal_selesai' => '2026-10-31', 'isactive' => true, 'lama_piket' => 1]);
        PengaturanPiket::create(['kepengurusan_lab_id' => $period->id, 'ada_denda' => true, 'nominal_denda' => 5000]);
        $this->postJson(route('piket.denda-piket.sync', $piket->id))->assertOk();
        $this->assertSame(0.0, (float) DendaPiket::sole()->total_denda);
        $this->assertSame('lunas', DendaPiket::sole()->status);
        Absensi::create(['jadwal_piket_id' => $schedule->id, 'tanggal' => '2026-10-05', 'jam_masuk' => '08:00', 'jam_keluar' => '10:00', 'verification_status' => 'approved', 'kegiatan' => 'Audit attendance']);
        Absensi::create(['jadwal_piket_id' => $thursday->id, 'tanggal' => '2026-10-08', 'jam_masuk' => '08:00', 'jam_keluar' => '10:00', 'verification_status' => 'pending', 'kegiatan' => 'Pending verification']);
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-20 10:00:00'));
        $this->assertSame(['total_jadwal' => 6, 'hadir' => 1, 'tidak_hadir' => 5], PiketAttendanceSummary::forUser($piket, $user->id));
        foreach ([1, 2] as $run) $this->postJson(route('piket.denda-piket.sync', $piket->id))->assertOk();
        $this->assertDatabaseCount('denda_piket', 1);
        $this->assertSame(25000.0, (float) DendaPiket::sole()->total_denda);
        $schedule->delete();
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-11-01 10:00:00'));
        $this->assertSame(8, PiketAttendanceSummary::forUser($piket, $user->id)['total_jadwal']);
        $this->travelBack();
    }
}
