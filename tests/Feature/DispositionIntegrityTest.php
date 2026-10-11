<?php

namespace Tests\Feature;

use App\Models\{DisposisiSurat, KepengurusanLab, KepengurusanUser, Laboratorium, Struktur, SuratMasuk, TahunKepengurusan, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DispositionIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private SuratMasuk $letter;
    private User $recipient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $lab = Laboratorium::create(['nama' => 'Disposition audit', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $this->recipient = User::factory()->create();
        $this->recipient->assignRole(Role::findOrCreate('superadmin', 'web'));
        $structure = Struktur::create(['struktur' => 'Audit recipient']);
        KepengurusanUser::create(['kepengurusan_lab_id' => $period->id, 'user_id' => $this->recipient->id, 'struktur_id' => $structure->id, 'is_active' => true]);
        $this->actingAs($this->recipient);
        $this->letter = SuratMasuk::create(['kepengurusan_lab_id' => $period->id, 'nomor_agenda' => 1, 'nomor_surat_asal' => 'AUDIT-1',
            'asal_surat' => 'Audit', 'perihal' => 'Audit disposition', 'tanggal_surat' => '2026-10-11', 'tanggal_terima' => '2026-10-11', 'diterima_oleh' => $this->recipient->id]);
    }

    private function disposition(): DisposisiSurat
    {
        return DisposisiSurat::create(['surat_masuk_id' => $this->letter->id, 'dari_user_id' => $this->recipient->id,
            'kepada_user_id' => $this->recipient->id, 'status' => 'belum_dibaca']);
    }

    public function test_viewing_active_and_archived_dispositions_does_not_write_status(): void
    {
        $item = $this->disposition();
        foreach ([true, false] as $active) {
            $this->letter->kepengurusanLab->update(['is_active' => $active]);
            $this->get(route('surat-menyurat.surat-masuk.disposisi', $this->letter->id))->assertOk();
            $this->assertSame('belum_dibaca', $item->fresh()->status);
            $this->assertNull($item->fresh()->dibaca_at);
        }
    }

    public function test_only_the_recipient_can_update_status_and_archives_reject_changes(): void
    {
        $item = $this->disposition();
        $url = route('surat-menyurat.disposisi.update-status', $item->id);
        $this->patch($url, ['status' => 'sudah_dibaca'])->assertRedirect();
        $this->assertNotNull($item->fresh()->dibaca_at);
        $other = User::factory()->create();
        $other->assignRole('superadmin');
        $this->actingAs($other)->patchJson($url, ['status' => 'selesai'])->assertForbidden();
        $this->assertSame('sudah_dibaca', $item->fresh()->status);
        $this->letter->kepengurusanLab->update(['is_active' => false]);
        $this->actingAs($this->recipient)->patchJson($url, ['status' => 'selesai'])->assertForbidden();
        $this->assertNull($item->fresh()->diselesaikan_at);
    }

    public function test_disposition_recipient_must_belong_to_the_letters_period(): void
    {
        $url = route('surat-menyurat.disposisi.store', $this->letter->id);
        $other = User::factory()->create();
        $this->postJson($url, ['kepada_user_id' => $other->id])->assertUnprocessable()->assertJsonValidationErrors('kepada_user_id');
        $this->assertDatabaseCount('disposisi_surat', 0);
        $this->post($url, ['kepada_user_id' => $this->recipient->id, 'catatan' => 'Review'])->assertRedirect();
        $this->assertDatabaseCount('disposisi_surat', 1);
    }
}
