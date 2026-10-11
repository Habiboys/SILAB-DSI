<?php

namespace Tests\Feature;

use App\Models\{Laboratorium, MataKuliah, TahunKepengurusan, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MasterDataCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $this->actingAs($user);
    }

    public function test_laboratory_logo_replacement_removes_the_old_file_from_its_disk(): void
    {
        Storage::fake('public');
        $this->post(route('laboratorium.store'), ['nama' => 'Audit lab', 'logo' => UploadedFile::fake()->image('first.png')])->assertRedirect();
        $lab = Laboratorium::where('nama', 'Audit lab')->firstOrFail();
        $old = $lab->logo;
        Storage::disk('public')->assertExists($old);
        $this->assertFileDoesNotExist(public_path('storage/'.$old));
        $this->post(route('laboratorium.update', $lab), ['nama' => 'Audit updated', 'logo' => UploadedFile::fake()->image('second.png')])->assertRedirect();
        $lab->refresh();
        $this->assertSame('Audit updated', $lab->nama);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($lab->logo);
        $this->get(route('laboratorium.index'))->assertOk();
        $this->post(route('laboratorium.toggle', $lab))->assertRedirect();
        $this->assertFalse($lab->fresh()->is_active);
    }

    public function test_year_rejects_an_end_date_before_its_start(): void
    {
        $this->postJson(route('tahun-kepengurusan.store'), ['tahun' => '2026/2027', 'mulai' => '2026-12-31', 'selesai' => '2026-01-01', 'isactive' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('selesai');
        $this->assertDatabaseCount('tahun_kepengurusan', 0);
        $valid = ['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true];
        $this->post(route('tahun-kepengurusan.store'), $valid)->assertRedirect();
        $year = TahunKepengurusan::firstOrFail();
        $this->putJson(route('tahun-kepengurusan.update', $year), [...$valid, 'selesai' => '2025-01-01'])
            ->assertUnprocessable()->assertJsonValidationErrors('selesai');
        $this->assertSame('2027-12-31', $year->fresh()->selesai->toDateString());
        $this->put(route('tahun-kepengurusan.update', $year), [...$valid, 'tahun' => 'Audit updated'])->assertRedirect();
        $this->assertSame('Audit updated', $year->fresh()->tahun);
        $this->delete(route('tahun-kepengurusan.destroy', $year))->assertRedirect();
        $this->assertDatabaseCount('tahun_kepengurusan', 0);
    }

    public function test_course_code_is_normalized_before_duplicate_validation(): void
    {
        $data = ['kode_mata_kuliah' => 'AUDIT101', 'nama' => 'Audit course', 'sks' => 1, 'semester' => 1];
        $this->post(route('data-master.mata-kuliah.store'), $data)->assertRedirect();
        $this->postJson(route('data-master.mata-kuliah.store'), [...$data, 'kode_mata_kuliah' => ' audit101 '])
            ->assertUnprocessable()->assertJsonValidationErrors('kode_mata_kuliah');
        $this->assertDatabaseCount('mata_kuliah', 1);
        $course = MataKuliah::firstOrFail();
        $this->put(route('data-master.mata-kuliah.update', $course), [...$data, 'nama' => 'Updated course', 'status' => 'nonaktif'])->assertRedirect();
        $this->assertSame('Updated course', $course->fresh()->nama);
        $this->assertSame('nonaktif', $course->fresh()->status);
        $this->delete(route('data-master.mata-kuliah.destroy', $course))->assertRedirect();
        $this->assertDatabaseCount('mata_kuliah', 0);
    }
}
