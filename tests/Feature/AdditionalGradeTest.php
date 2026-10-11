<?php

namespace Tests\Feature;

use App\Models\{Kelas, KepengurusanLab, Laboratorium, NilaiTambahan, PengumpulanTugas, Praktikan, PraktikanPraktikum, Praktikum, TahunKepengurusan, TugasPraktikum, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdditionalGradeTest extends TestCase
{
    use RefreshDatabase;

    private TugasPraktikum $task;
    private Praktikan $student;
    private PraktikanPraktikum $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $lab = Laboratorium::create(['nama' => 'Audit grading', 'is_active' => true]);
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
        $praktikum = Praktikum::create(['mata_kuliah' => 'Audit', 'kepengurusan_lab_id' => $period->id]);
        $kelas = Kelas::create(['nama_kelas' => 'Audit A', 'praktikum_id' => $praktikum->id, 'status' => 'aktif']);
        $this->task = TugasPraktikum::create(['kelas_id' => $kelas->id, 'judul_tugas' => 'Audit task', 'deadline' => now()->addDay(), 'status' => 'aktif']);
        $user = User::factory()->create();
        $this->student = Praktikan::create(['user_id' => $user->id, 'nim' => '12345678', 'nama' => 'Audit student', 'no_hp' => '081234567890']);
        $this->enrollment = PraktikanPraktikum::create(['praktikan_id' => $this->student->id, 'praktikum_id' => $praktikum->id, 'kelas_id' => $kelas->id, 'status' => 'aktif']);
        $admin = User::factory()->create(['access_lab_id' => $lab->id]);
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $this->actingAs($admin);
    }

    private function submit(): PengumpulanTugas
    {
        return PengumpulanTugas::create(['tugas_praktikum_id' => $this->task->id, 'praktikan_praktikum_id' => $this->enrollment->id,
            'status' => 'dikumpulkan', 'submitted_at' => now(), 'nilai' => 60]);
    }

    private function loginStudent(): void
    {
        $user = $this->student->user;
        $user->assignRole(Role::findOrCreate('praktikan', 'web'));
        $this->actingAs($user);
    }

    public function test_student_without_staff_lab_access_can_upload_and_cancel_their_own_private_file(): void
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        $this->loginStudent();
        $file = \Illuminate\Http\UploadedFile::fake()->create('task.pdf', 1, 'application/pdf');
        $this->post(route('praktikum.tugas.pengumpulan.store', ['tugas' => $this->task->id]), ['files' => [$file]])->assertRedirect();
        $submission = PengumpulanTugas::sole();
        $path = json_decode($submission->file_pengumpulan, true)[0]['data'];
        \Illuminate\Support\Facades\Storage::disk('private')->assertExists($path);
        $this->assertSame($this->enrollment->id, $submission->praktikan_praktikum_id);
        $this->deleteJson(route('praktikum.pengumpulan.cancel', ['pengumpulan' => $submission->id]))->assertOk();
        $this->assertDatabaseCount('pengumpulan_tugas', 0);
        \Illuminate\Support\Facades\Storage::disk('private')->assertMissing($path);
    }

    public function test_student_cannot_submit_to_another_class_in_the_same_practicum(): void
    {
        $this->loginStudent();
        $other = Kelas::create(['nama_kelas' => 'Other', 'praktikum_id' => $this->task->kelas->praktikum_id, 'status' => 'aktif']);
        $this->task->update(['kelas_id' => $other->id]);
        $this->postJson(route('praktikum.tugas.pengumpulan.store', ['tugas' => $this->task->id]), ['links' => ['https://example.com/task']])->assertForbidden();
        $this->assertDatabaseCount('pengumpulan_tugas', 0);
    }

    public function test_student_cannot_cancel_another_students_submission(): void
    {
        $submission = $this->submit();
        $other = User::factory()->create();
        $other->assignRole(Role::findOrCreate('praktikan', 'web'));
        Praktikan::create(['user_id' => $other->id, 'nim' => '98765432', 'nama' => 'Other student', 'no_hp' => '081234567891']);
        $this->actingAs($other)->deleteJson(route('praktikum.pengumpulan.cancel', ['pengumpulan' => $submission->id]))->assertForbidden();
        $this->assertDatabaseHas('pengumpulan_tugas', ['id' => $submission->id]);
    }

    public function test_students_cannot_submit_to_an_archived_period(): void
    {
        $this->loginStudent();
        $this->task->kelas->praktikum->kepengurusanLab->update(['is_active' => false]);
        $this->postJson(route('praktikum.tugas.pengumpulan.store', ['tugas' => $this->task->id]), ['links' => ['https://example.com/task']])->assertForbidden();
        $this->assertDatabaseCount('pengumpulan_tugas', 0);
    }

    public function test_collection_index_redirects_to_the_existing_submission_page(): void
    {
        $this->withoutVite();
        $this->get(route('praktikum.tugas.pengumpulan.index', ['tugas' => $this->task->id]))
            ->assertRedirect(route('praktikum.tugas.submissions', ['tugas' => $this->task->id]));
        $this->get(route('praktikum.tugas.submissions', ['tugas' => $this->task->id]))
            ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('TugasPraktikum/TugasSubmissions')->has('nonSubmittedPraktikans', 1));
    }

    public function test_additional_grade_crud_persists_and_updates_the_submission_total(): void
    {
        $submission = $this->submit();
        $url = '/praktikum/tugas/'.$this->task->id.'/nilai-tambahan';
        $response = $this->postJson($url, ['praktikan_id' => $this->student->id, 'nilai' => 5, 'kategori' => 'bonus']);
        $response->assertOk()->assertJsonPath('success', true);
        $bonus = NilaiTambahan::findOrFail($response->json('data.id'));
        $this->assertSame($submission->id, $bonus->pengumpulan_tugas_id);
        $this->assertSame(65.0, (float) $submission->fresh()->total_nilai_with_bonus);
        $this->getJson('/praktikum/tugas/'.$this->task->id.'/praktikan/'.$this->student->id.'/nilai-tambahan')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $bonus->id);
        $this->putJson($url.'/'.$bonus->id, ['nilai' => 10, 'kategori' => 'bonus'])->assertOk()->assertJsonPath('success', true);
        $this->assertSame(70.0, (float) $submission->fresh()->total_nilai_with_bonus);
        $this->deleteJson($url.'/'.$bonus->id)->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseMissing('nilai_tambahan', ['id' => $bonus->id]);
        $this->assertSame(60.0, (float) $submission->fresh()->total_nilai_with_bonus);
    }

    public function test_bonus_before_submission_does_not_create_a_fake_submission_and_links_when_submitted(): void
    {
        $this->postJson('/praktikum/tugas/'.$this->task->id.'/nilai-tambahan', ['praktikan_id' => $this->student->id, 'nilai' => 5, 'kategori' => 'bonus'])
            ->assertOk()->assertJsonPath('success', true);
        $bonus = NilaiTambahan::sole();
        $this->assertNull($bonus->pengumpulan_tugas_id);
        $this->assertDatabaseCount('pengumpulan_tugas', 0);
        $this->getJson('/praktikum/tugas/'.$this->task->id.'/praktikan/'.$this->student->id.'/nilai-tambahan')
            ->assertOk()->assertJsonCount(1, 'data');
        $submission = $this->submit();
        $this->assertSame($submission->id, $bonus->fresh()->pengumpulan_tugas_id);
        $this->assertSame(65.0, (float) $submission->fresh()->total_nilai_with_bonus);
    }

    public function test_students_outside_the_class_cannot_receive_grades_for_the_task(): void
    {
        $outsider = Praktikan::create(['nim' => '99999999', 'nama' => 'Outside class']);
        $this->postJson('/praktikum/tugas/'.$this->task->id.'/nilai-tambahan', ['praktikan_id' => $outsider->id, 'nilai' => 5, 'kategori' => 'bonus'])
            ->assertUnprocessable()->assertJsonValidationErrors('praktikan_id');
        $this->assertDatabaseCount('nilai_tambahan', 0);
        $this->assertDatabaseCount('pengumpulan_tugas', 0);
    }

    private function rubricPayload(PengumpulanTugas $submission): array
    {
        $component = \App\Models\KomponenRubrik::create(['tugas_praktikum_id' => $this->task->id,
            'nama_komponen' => 'Audit rubric', 'bobot' => 100, 'nilai_maksimal' => 100, 'urutan' => 1]);
        return ['tugas_id' => $this->task->id, 'praktikan_id' => $this->student->id,
            'pengumpulan_tugas_id' => $submission->id, 'nilai_rubrik' => [['komponen_rubrik_id' => $component->id, 'nilai' => 75]]];
    }

    public function test_single_and_matrix_grading_use_submission_foreign_keys_and_persist_totals(): void
    {
        $submission = $this->submit();
        $payload = $this->rubricPayload($submission);
        $this->postJson('/praktikum/submission/rubrik-grade', $payload)->assertOk()->assertJsonPath('total_nilai', 75);
        $payload['nilai_rubrik'][0]['nilai'] = 80;
        $this->postJson('/praktikum/submission/rubrik-grade', $payload)->assertOk()->assertJsonPath('total_nilai', 80);
        $this->assertDatabaseCount('nilai_rubrik', 1);
        $this->assertSame(80.0, (float) $submission->fresh()->nilai);
        $payload['nilai_rubrik'][0]['nilai'] = 85;
        $this->postJson('/praktikum/submission/matrix-grade', ['tugas_id' => $this->task->id, 'matrix_data' => [$payload]])
            ->assertOk()->assertJsonPath('success', true);
        $this->assertSame(85.0, (float) $submission->fresh()->nilai);
        $this->assertDatabaseCount('nilai_rubrik', 1);
    }

    public function test_grading_rejects_a_component_from_another_task_without_mutation(): void
    {
        $submission = $this->submit();
        $payload = $this->rubricPayload($submission);
        $other = TugasPraktikum::create(['kelas_id' => $this->task->kelas_id, 'judul_tugas' => 'Other', 'deadline' => now()->addDay(), 'status' => 'aktif']);
        \App\Models\KomponenRubrik::whereKey($payload['nilai_rubrik'][0]['komponen_rubrik_id'])->update(['tugas_praktikum_id' => $other->id]);
        $this->postJson('/praktikum/submission/rubrik-grade', $payload)->assertForbidden();
        $this->assertDatabaseCount('nilai_rubrik', 0);
        $this->assertSame(60.0, (float) $submission->fresh()->nilai);
    }

    public function test_body_only_grading_requires_the_assistants_practicum_assignment(): void
    {
        $submission = $this->submit();
        $payload = $this->rubricPayload($submission);
        $labId = $this->task->kelas->praktikum->kepengurusanLab->laboratorium_id;
        $assistant = User::factory()->create(['access_lab_id' => $labId, 'must_change_password' => false]);
        $assistant->profile()->create(['nomor_induk' => 'AUDIT-ASLAB', 'jenis_kelamin' => 'laki-laki', 'no_hp' => '081234567890']);
        $assistant->assignRole(Role::findOrCreate('asisten', 'web'));
        $this->actingAs($assistant)->postJson('/praktikum/submission/rubrik-grade', $payload)->assertForbidden();
        $this->assertDatabaseCount('nilai_rubrik', 0);
        \App\Models\AslabPraktikum::create(['praktikum_id' => $this->task->kelas->praktikum_id, 'user_id' => $assistant->id]);
        $this->postJson('/praktikum/submission/rubrik-grade', $payload)->assertOk();
        $this->assertSame(75.0, (float) $submission->fresh()->nilai);
    }

    public function test_scores_above_the_rubric_maximum_are_rejected_before_any_write(): void
    {
        $submission = $this->submit();
        $payload = $this->rubricPayload($submission);
        $payload['nilai_rubrik'][0]['nilai'] = 101;
        $this->postJson('/praktikum/submission/rubrik-grade', $payload)->assertUnprocessable()->assertJsonValidationErrors('nilai_rubrik.0.nilai');
        $this->assertDatabaseCount('nilai_rubrik', 0);
        $this->assertSame(60.0, (float) $submission->fresh()->nilai);
    }

    public function test_private_submission_download_is_available_only_to_its_owner_or_authorized_staff(): void
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        $path = 'pengumpulan-tugas/1790000000_audit.pdf';
        \Illuminate\Support\Facades\Storage::disk('private')->put($path, '%PDF-1.4 audit');
        $submission = $this->submit();
        $submission->update(['file_pengumpulan' => json_encode([['type' => 'file', 'data' => $path]])]);
        $url = route('praktikum.pengumpulan.download.filename', ['filename' => basename($path)]);
        $owner = $this->student->user;
        $owner->assignRole(Role::findOrCreate('praktikan', 'web'));
        $this->actingAs($owner)->get($url)->assertOk()->assertDownload('audit.pdf');
        $other = User::factory()->create();
        $this->actingAs($other)->get($url)->assertForbidden();
        $this->actingAs($owner)->get(route('praktikum.pengumpulan.download.filename', ['filename' => 'audit.pdf']))->assertNotFound();
    }
}
