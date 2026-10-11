<?php

namespace Tests\Feature;

use App\Models\{FaceEnrollment, KepengurusanLab, KepengurusanUser, Laboratorium, Struktur, TahunKepengurusan, User};
use App\Models\Permission\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NavbarContextRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_face_review_follows_the_selected_lab_and_period_for_superadmin(): void
    {
        $this->withoutVite();
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('superadmin', 'web'));
        $year = TahunKepengurusan::create(['tahun' => '2026/2027', 'mulai' => '2026-01-01', 'selesai' => '2027-12-31', 'isactive' => true]);
        foreach (['A', 'B'] as $name) {
            $lab = Laboratorium::create(['nama' => 'Review '.$name, 'is_active' => true]);
            $period = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => true]);
            $enrollments[] = FaceEnrollment::create(['user_id' => $user->id, 'kepengurusan_lab_id' => $period->id,
                'status' => 'pending', 'expires_at' => now()->addDay()]);
            $periods[] = $period;
        }
        foreach ($periods as $index => $period) {
            $this->actingAs($user)->get(route('piket.wajah.review', ['lab_id' => $period->laboratorium_id,
                'kepengurusan_lab_id' => $period->id]))->assertOk()->assertInertia(fn (Assert $page) => $page
                    ->has('enrollments', 1)->where('enrollments.0.id', $enrollments[$index]->id));
        }
    }

    public function test_lpj_preserves_an_explicit_archive_for_an_active_lab_member(): void
    {
        $this->withoutVite();
        foreach (['superadmin', 'kadep', 'admin'] as $name) Role::findOrCreate($name, 'web');
        $lab = Laboratorium::create(['nama' => 'LPJ context', 'is_active' => true]);
        foreach ([false, true] as $active) {
            $year = TahunKepengurusan::create(['tahun' => $active ? '2026/2027' : '2025/2026',
                'mulai' => $active ? '2026-01-01' : '2025-01-01', 'selesai' => '2027-12-31', 'isactive' => $active]);
            $periods[] = KepengurusanLab::create(['laboratorium_id' => $lab->id, 'tahun_kepengurusan_id' => $year->id, 'is_active' => $active]);
        }
        $user = User::factory()->create(['access_lab_id' => $lab->id]);
        $user->assignRole('admin');
        Role::findByName('admin')->givePermissionTo(\App\Models\Permission\Permission::findOrCreate('proker.view', 'web'));
        $structure = Struktur::create(['struktur' => 'LPJ audit']);
        KepengurusanUser::create(['user_id' => $user->id, 'kepengurusan_lab_id' => $periods[1]->id,
            'struktur_id' => $structure->id, 'is_active' => true]);
        $this->actingAs($user)->get(route('lpj-kepengurusan.preview-page', ['lab_id' => $lab->id,
            'kepengurusan_lab_id' => $periods[0]->id]))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('kepengurusanLab.id', $periods[0]->id));
    }
}
