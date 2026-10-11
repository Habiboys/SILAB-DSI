<?php

namespace Tests\Feature;

use App\Models\{KepengurusanLab, Laboratorium, Praktikan, Sertifikat, TahunKepengurusan, User};
use App\Models\Permission\{Permission, Role};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CertificateScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_generated_certificate_is_private_and_downloadable_by_its_owner(): void
    {
        Storage::fake('public');
        Storage::fake('private');
        $template = tempnam(sys_get_temp_dir(), 'audit_certificate_');
        try {
            $word = new \PhpOffice\PhpWord\PhpWord();
            $word->addSection()->addText('${name}');
            \PhpOffice\PhpWord\IOFactory::createWriter($word, 'Word2007')->save($template);
            $path = 'sertifikat/audit.docx';
            $this->assertSame($path, (new \App\Services\CertificateService())->generate($template, ['name' => 'Audit owner'], $path));
            Storage::disk('private')->assertExists($path);
            Storage::disk('public')->assertMissing($path);
            $zip = new \ZipArchive();
            $this->assertTrue($zip->open(Storage::disk('private')->path($path)));
            $this->assertStringContainsString('Audit owner', $zip->getFromName('word/document.xml'));
            $zip->close();
            $owner = User::factory()->create();
            $certificate = Sertifikat::create(['user_id' => $owner->id, 'nomor_sertifikat' => 'PRIVATE-AUDIT',
                'jenis_sertifikat' => 'praktikan', 'tanggal_terbit' => '2026-10-11', 'file_path' => $path]);
            $this->actingAs($owner)->get(route('sertifikat.download', $certificate))->assertOk()->assertDownload('audit.docx');
        } finally {
            if (is_file($template)) unlink($template);
        }
    }

    public function test_students_see_only_their_certificates_and_cannot_download_another_owners_file(): void
    {
        $this->withoutVite();
        Storage::fake('public');
        $role = Role::findOrCreate('praktikan', 'web');
        $role->givePermissionTo(Permission::findOrCreate('sertifikat.view', 'web'));
        $users = User::factory()->count(2)->create();
        foreach ($users as $index => $user) {
            $user->assignRole($role);
            Praktikan::create(['user_id' => $user->id, 'nim' => '1234567'.$index, 'nama' => $user->name, 'no_hp' => '081234567890']);
            Storage::disk('public')->put("certificates/{$index}.pdf", '%PDF-1.4 audit');
            Sertifikat::create(['user_id' => $user->id, 'nomor_sertifikat' => 'AUDIT-'.$index, 'jenis_sertifikat' => 'praktikan',
                'tanggal_terbit' => '2026-10-11', 'file_path' => "certificates/{$index}.pdf"]);
        }
        $this->actingAs($users[0])->get(route('sertifikat.all'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Sertifikat/Index')->has('sertifikats.data', 1)->where('sertifikats.data.0.user_id', $users[0]->id));
        $other = Sertifikat::where('user_id', $users[1]->id)->sole();
        $this->get(route('sertifikat.download', $other))->assertForbidden();
        $mine = Sertifikat::where('user_id', $users[0]->id)->sole();
        $this->get(route('sertifikat.download', $mine))->assertOk()->assertDownload('0.pdf');
    }

    public function test_staff_download_and_listing_are_scoped_to_their_lab(): void
    {
        $this->withoutVite();
        Storage::fake('public');
        $role = Role::findOrCreate('admin', 'web');
        $role->givePermissionTo(Permission::findOrCreate('sertifikat.view', 'web'));
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $labs = collect(['A', 'B'])->map(fn ($name) => Laboratorium::create(['nama' => 'Certificate '.$name, 'is_active' => true]));
        $owner = User::factory()->create();
        foreach ($labs as $index => $lab) {
            $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
            Storage::disk('public')->put("certificates/{$index}.pdf", '%PDF-1.4 audit');
            Sertifikat::create(['user_id' => $owner->id, 'kepengurusan_lab_id' => $period->id, 'nomor_sertifikat' => 'LAB-'.$index,
                'jenis_sertifikat' => 'kepengurusan', 'tanggal_terbit' => '2026-10-11', 'file_path' => "certificates/{$index}.pdf"]);
        }
        $staff = User::factory()->create(['access_lab_id' => $labs[0]->id]);
        $staff->assignRole($role);
        $this->actingAs($staff)->get(route('sertifikat.all'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sertifikats.data', 1)->where('sertifikats.data.0.nomor_sertifikat', 'LAB-0')->has('laboratories', 1));
        $this->get(route('sertifikat.download', Sertifikat::where('nomor_sertifikat', 'LAB-1')->sole()))->assertForbidden();
        $this->get(route('sertifikat.download', Sertifikat::where('nomor_sertifikat', 'LAB-0')->sole()))->assertOk();
        $certificate = Sertifikat::where('nomor_sertifikat', 'LAB-0')->sole();
        $structure = \App\Models\Struktur::create(['struktur' => 'Certificate audit']);
        $program = \App\Models\Proker::create(['struktur_id' => $structure->id,
            'kepengurusan_lab_id' => $certificate->kepengurusan_lab_id, 'nama_proker' => 'Certificate audit', 'deskripsi' => 'Audit']);
        $activity = \App\Models\Kegiatan::create(['proker_id' => $program->id, 'nama_kegiatan' => 'Certificate audit']);
        \App\Models\KegiatanPeserta::create(['kegiatan_id' => $activity->id, 'user_id' => $owner->id,
            'file_sertifikat' => $certificate->file_path]);
        $this->getJson(route('kegiatan.peserta.index', $activity))->assertOk()
            ->assertJsonPath('0.certificate_download_url', route('sertifikat.download', $certificate));
    }
}
