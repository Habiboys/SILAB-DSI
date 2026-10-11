<?php

namespace Tests\Feature;

use App\Models\{KepengurusanLab, Laboratorium, TahunKepengurusan, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportAndContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_endpoint_receives_an_http_request_and_reports_missing_lab(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $this->actingAs($user)->getJson(route('api.check-kepengurusan-status'))
            ->assertStatus(400)->assertJsonPath('error', 'Lab ID tidak ditemukan');
    }

    public function test_lpj_pdf_download_accepts_an_academic_year_with_a_slash(): void
    {
        $lab = Laboratorium::create(['nama' => 'Audit report', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        foreach (['superadmin', 'kadep'] as $name) Role::findOrCreate($name, 'web');
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        $this->actingAs($user)->getJson(route('api.check-kepengurusan-status', ['lab_id' => $lab->id, 'modul' => 'proker']))
            ->assertOk()->assertJsonPath('has_active_kepengurusan', true)->assertJsonPath('can_access_modul', true)->assertJsonPath('message', null);
        $response = $this->actingAs($user)->get(route('lpj-kepengurusan.export-pdf', ['kepengurusan_lab_id' => $period->id]));
        $response->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('20262027', $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_monthly_finance_summary_includes_both_calendar_years_of_the_selected_period(): void
    {
        $this->withoutVite();
        $lab = Laboratorium::create(['nama' => 'Audit finance', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        foreach (['2026-10-10', '2027-02-10'] as $date) {
            \App\Models\PemasukanKeuangan::create(['tanggal' => $date, 'nominal' => 10000, 'deskripsi' => 'Audit', 'user_id' => $user->id, 'kepengurusan_lab_id' => $period->id]);
        }
        \App\Models\PengeluaranKeuangan::create(['tanggal' => '2027-02-11', 'nominal' => 4000, 'deskripsi' => 'Audit', 'user_id' => $user->id, 'kepengurusan_lab_id' => $period->id]);
        $this->actingAs($user)->get(route('rekap-keuangan.index', ['kepengurusan_lab_id' => $period->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('RekapKeuangan')
                ->has('rekapKeuangan', 2)->where('keuanganSummary.totalPemasukan', 20000)
                ->where('keuanganSummary.totalPengeluaran', 4000)->where('keuanganSummary.saldoAkhir', 16000));
        $pdf = $this->get(route('riwayat-keuangan.export', ['lab_id' => $lab->id, 'tahun_id' => $year->id]));
        $pdf->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('20262027.pdf', $pdf->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF-', $pdf->getContent());
    }
}
