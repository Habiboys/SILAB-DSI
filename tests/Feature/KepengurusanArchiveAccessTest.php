<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureKepengurusanWritable;
use App\Models\KepengurusanLab;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class KepengurusanArchiveAccessTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        Schema::create('kepengurusan_lab', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('laboratorium_id');
            $table->uuid('tahun_kepengurusan_id');
            $table->boolean('is_active');
            $table->timestamps();
        });
        foreach (['proker', 'nominal_kas', 'periode_piket', 'surat_masuk', 'surat_keluar', 'praktikum', 'face_enrollments', 'pemasukan_keuangan', 'pengeluaran_keuangan'] as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('kepengurusan_lab_id');
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }
        Schema::create('kegiatan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('proker_id');
            $table->timestamps();
        });
    }

    private function request(string $method, string $action, KepengurusanLab $period): Request
    {
        $request = Request::create('/test', $method, ['kepengurusan_lab_id' => $period->id]);
        $handler = 'App\\Http\\Controllers\\ProkerController@'.$action;
        $route = new Route([$method], '/test', ['uses' => $handler, 'controller' => $handler]);
        $route->bind($request);
        $request->setRouteResolver(fn () => $route);
        $user = new class extends User {
            public function getCurrentLab() { return ['all_access' => true]; }
        };
        $request->setUserResolver(fn () => $user);
        return $request;
    }

    public function test_archive_mutations_and_direct_edit_are_denied(): void
    {
        $period = KepengurusanLab::create(['laboratorium_id' => 'lab', 'tahun_kepengurusan_id' => 'old', 'is_active' => false]);
        foreach ([['POST', 'store'], ['PUT', 'update'], ['DELETE', 'destroy'], ['GET', 'edit']] as [$method, $action]) {
            try {
                (new EnsureKepengurusanWritable())->handle($this->request($method, $action, $period), fn () => response('saved'));
                $this->fail('Archive mutation was allowed.');
            } catch (HttpException $error) {
                $this->assertSame(403, $error->getStatusCode());
            }
        }
    }

    public function test_active_mutation_and_archive_reads_are_allowed(): void
    {
        $period = KepengurusanLab::create(['laboratorium_id' => 'lab', 'tahun_kepengurusan_id' => 'new', 'is_active' => true]);
        $middleware = new EnsureKepengurusanWritable();
        $this->assertSame('saved', $middleware->handle($this->request('POST', 'store', $period), fn () => response('saved'))->getContent());
        $period->update(['is_active' => false]);
        foreach (['show', 'index', 'export', 'download'] as $action) {
            $this->assertSame('history', $middleware->handle($this->request('GET', $action, $period), fn () => response('history'))->getContent());
        }
    }

    private function period(bool $active, string $lab = 'lab'): KepengurusanLab
    {
        return KepengurusanLab::create(['laboratorium_id' => $lab, 'tahun_kepengurusan_id' => $active ? 'new' : 'old', 'is_active' => $active]);
    }

    public function test_registered_http_route_resolves_owner_before_mutating(): void
    {
        $this->withoutMiddleware([
            \Illuminate\Auth\Middleware\Authorize::class,
            \App\Http\Middleware\CheckLabAccess::class,
            \App\Http\Middleware\PreserveNavigationContext::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\EnsureMandatoryKuesionerCompleted::class,
            \App\Http\Middleware\EnsurePraktikanProfileComplete::class,
        ]);
        $active = $this->period(true);
        $archive = $this->period(false);
        $user = $this->request('POST', 'store', $active)->user();
        $user->id = 'http-user';
        $this->actingAs($user);
        $current = \App\Models\Proker::forceCreate(['kepengurusan_lab_id' => $active->id, 'description' => 'before']);
        $old = \App\Models\Proker::forceCreate(['kepengurusan_lab_id' => $archive->id, 'description' => 'history']);
        $controller = \Mockery::mock(\App\Http\Controllers\ProkerController::class)->makePartial();
        $controller->shouldReceive('update')->once()->andReturnUsing(function (Request $request, \App\Models\Proker $proker) {
            $proker->forceFill(['description' => 'saved'])->save();
            return response()->json(['saved' => true]);
        });
        app()->instance(\App\Http\Controllers\ProkerController::class, $controller);

        $this->putJson(route('proker.update', $old), ['kepengurusan_lab_id' => $active->id])->assertForbidden();
        $this->putJson(route('proker.update', $current), ['kepengurusan_lab_id' => $active->id])->assertOk();
        $this->assertSame('history', $old->fresh()->description);
        $this->assertSame('saved', $current->fresh()->description);
    }

    private function action(Request $request, string $controller, string $method, array $parameters = []): Request
    {
        $handler = 'App\\Http\\Controllers\\'.$controller.'@'.$method;
        $request->route()->setAction(['uses' => $handler, 'controller' => $handler]);
        foreach ($parameters as $key => $value) $request->route()->setParameter($key, $value);
        return $request;
    }

    private function denied(Request $request): void
    {
        try {
            (new EnsureKepengurusanWritable())->handle($request, fn () => response('saved'));
            $this->fail('Mutation was allowed.');
        } catch (HttpException $error) {
            $this->assertSame(403, $error->getStatusCode());
        }
    }

    public function test_original_archive_resource_cannot_be_hidden_by_active_body_context(): void
    {
        $active = $this->period(true);
        $archive = $this->period(false);
        foreach ([
            ['ProkerController', 'proker', 'proker'],
            ['RiwayatKeuanganController', 'nominalKas', 'nominal_kas'],
            ['PeriodePiketController', 'periodePiket', 'periode_piket'],
            ['SuratMasukController', 'id', 'surat_masuk'],
            ['SuratKeluarController', 'id', 'surat_keluar'],
            ['PraktikumController', 'praktikum', 'praktikum'],
            ['FaceEnrollmentController', 'enrollment', 'face_enrollments'],
            ['RiwayatKeuanganController', 'riwayatKeuangan', 'pemasukan_keuangan'],
        ] as [$controller, $key, $table]) {
            DB::table($table)->insert(['id' => 'old-resource', 'kepengurusan_lab_id' => $archive->id]);
            $request = $this->action($this->request('PUT', 'update', $active), $controller, 'update', [$key => 'old-resource']);
            $before = DB::table($table)->get()->toJson();
            $this->denied($request);
            $this->assertSame($before, DB::table($table)->get()->toJson());
        }
    }

    public function test_nested_activity_and_new_parent_cannot_cross_periods(): void
    {
        $active = $this->period(true);
        $archive = $this->period(false);
        DB::table('proker')->insert([
            ['id' => 'old-parent', 'kepengurusan_lab_id' => $archive->id],
            ['id' => 'new-parent', 'kepengurusan_lab_id' => $active->id],
        ]);
        DB::table('kegiatan')->insert(['id' => 'activity', 'proker_id' => 'old-parent']);
        $request = $this->action($this->request('PUT', 'update', $active), 'KegiatanController', 'update', ['kegiatan' => 'activity']);
        $request->merge(['proker_id' => 'new-parent']);
        $this->denied($request);
        $this->assertSame('old-parent', DB::table('kegiatan')->value('proker_id'));
    }

    public function test_nested_bulk_body_cannot_include_archive_resources(): void
    {
        $active = $this->period(true);
        $archive = $this->period(false);
        DB::table('proker')->insert(['id' => 'old-parent', 'kepengurusan_lab_id' => $archive->id]);
        $request = $this->request('POST', 'store', $active);
        $request->merge(['rows' => [['proker_id' => 'old-parent']]]);
        $this->denied($request);
    }

    public function test_forged_lab_and_year_are_rejected(): void
    {
        $active = $this->period(true);
        foreach ([['lab_id' => 'other'], ['tahun_id' => 'old'], ['laboratorium_id' => 'other']] as $input) {
            $request = $this->request('POST', 'store', $active);
            $request->merge($input);
            $this->denied($request);
        }
    }

    public function test_status_is_reloaded_after_form_was_opened(): void
    {
        $active = $this->period(true);
        $request = $this->request('POST', 'store', $active);
        DB::table('kepengurusan_lab')->where('id', $active->id)->update(['is_active' => false]);
        $this->denied($request);
    }

    public function test_role_rules_still_run_after_archive_guard(): void
    {
        $request = $this->request('POST', 'store', $this->period(true));
        $this->expectException(HttpException::class);
        (new EnsureKepengurusanWritable())->handle($request, fn () => abort(403, 'Permission denied'));
    }

    public function test_transfer_only_writes_active_target_of_same_lab(): void
    {
        $active = $this->period(true);
        $archive = $this->period(false);
        $request = $this->action($this->request('POST', 'store', $archive), 'AnggotaController', 'transferFromPrevious');
        $request->merge(['active_kepengurusan_id' => $active->id]);
        $before = $archive->fresh()->toJson();
        $this->assertSame('transferred', (new EnsureKepengurusanWritable())->handle($request, fn () => response('transferred'))->getContent());
        $this->assertSame($before, $archive->fresh()->toJson());
        $request->merge(['active_kepengurusan_id' => $this->period(true, 'other')->id]);
        $this->denied($request);
        $request->merge(['active_kepengurusan_id' => $this->period(false)->id]);
        $this->denied($request);
    }

    public function test_global_lab_modules_are_not_blocked_by_archive_selection(): void
    {
        $archive = $this->period(false);
        foreach (['DetailInventarisController', 'MataKuliahController', 'StrukturController', 'ProfileController', 'KuesionerController'] as $controller) {
            $request = $this->action($this->request('PUT', 'update', $archive), $controller, 'update');
            $this->assertSame('saved', (new EnsureKepengurusanWritable())->handle($request, fn () => response('saved'))->getContent());
        }
    }

    public function test_nested_resource_must_match_parent_even_in_same_active_period(): void
    {
        $active = $this->period(true);
        $first = \App\Models\Proker::forceCreate(['kepengurusan_lab_id' => $active->id]);
        $second = \App\Models\Proker::forceCreate(['kepengurusan_lab_id' => $active->id]);
        $child = \App\Models\Kegiatan::forceCreate(['proker_id' => $second->id]);
        $request = $this->action($this->request('PUT', 'update', $active), 'KegiatanController', 'update', ['proker' => $first, 'kegiatan' => $child]);
        $this->denied($request);
    }

    public function test_lab_member_cannot_write_another_laboratory(): void
    {
        $request = $this->request('POST', 'store', $this->period(true, 'other'));
        $user = new class extends User {
            public function getCurrentLab() { $lab = new \App\Models\Laboratorium(); $lab->id = 'lab'; return ['laboratorium' => $lab]; }
        };
        $request->setUserResolver(fn () => $user);
        $this->denied($request);
    }

    public function test_activation_preserves_member_status_and_archive_blocks_account_deletion(): void
    {
        Schema::create('laboratorium', function (Blueprint $table) { $table->string('id')->primary(); });
        Schema::create('users', function (Blueprint $table) { $table->string('id')->primary(); });
        Schema::create('kepengurusan_user', function (Blueprint $table) {
            $table->string('id')->primary(); $table->string('user_id'); $table->string('kepengurusan_lab_id'); $table->boolean('is_active');
        });
        DB::table('laboratorium')->insert(['id' => 'lab']);
        DB::table('users')->insert(['id' => 'member']);
        $active = $this->period(true);
        $next = $this->period(false);
        DB::table('kepengurusan_user')->insert([
            ['id' => 'old', 'user_id' => 'member', 'kepengurusan_lab_id' => $active->id, 'is_active' => true],
            ['id' => 'next', 'user_id' => 'member', 'kepengurusan_lab_id' => $next->id, 'is_active' => false],
        ]);
        $before = DB::table('kepengurusan_user')->orderBy('id')->get()->toJson();
        app(\App\Http\Controllers\KepengurusanLabController::class)->toggleActive($next);
        $this->assertFalse($active->fresh()->is_active);
        $this->assertTrue($next->fresh()->is_active);
        $this->assertSame($before, DB::table('kepengurusan_user')->orderBy('id')->get()->toJson());
        $member = User::findOrFail('member');
        $this->assertSame(0, $member->kepengurusanAktif()->count());
        try {
            $member->delete();
            $this->fail('Deleting an account would cascade archive history.');
        } catch (HttpException $error) {
            $this->assertSame(403, $error->getStatusCode());
        }
        $this->assertDatabaseHas('users', ['id' => 'member']);
        $this->assertSame($before, DB::table('kepengurusan_user')->orderBy('id')->get()->toJson());
    }

    public function test_account_without_period_history_can_still_be_deleted(): void
    {
        Schema::create('users', fn (Blueprint $table) => $table->string('id')->primary());
        foreach (['kepengurusan_user', 'aslab_praktikum', 'kegiatan_peserta', 'proker_pj', 'ganti_jadwal_piket', 'sertifikat', 'praktikan'] as $name) {
            Schema::create($name, function (Blueprint $table) { $table->string('id')->primary(); $table->string('user_id'); });
        }
        Schema::table('face_enrollments', fn (Blueprint $table) => $table->string('user_id')->nullable());
        foreach (['pemasukan_keuangan', 'pengeluaran_keuangan'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->string('user_id')->nullable());
        }
        Schema::table('surat_keluar', fn (Blueprint $table) => $table->string('dibuat_oleh')->nullable());
        foreach (['tagihan_kas', 'denda_piket'] as $name) {
            Schema::create($name, function (Blueprint $table) { $table->string('id')->primary(); $table->string('user_id'); $table->string('kepengurusan_lab_id'); });
        }
        Schema::create('disposisi_surat', function (Blueprint $table) { $table->string('id')->primary(); $table->string('dari_user_id'); $table->string('kepada_user_id'); });
        Schema::create('absensi_aslab', function (Blueprint $table) { $table->string('id')->primary(); $table->string('aslab_praktikum_id'); });
        Schema::create('nilai_rubrik', fn (Blueprint $table) => $table->string('dinilai_oleh'));
        Schema::create('nilai_tambahan', fn (Blueprint $table) => $table->string('diberikan_oleh'));
        foreach (['model_has_roles' => 'role_id', 'model_has_permissions' => 'permission_id'] as $name => $field) {
            Schema::create($name, function (Blueprint $table) use ($field) { $table->unsignedBigInteger($field); $table->string('model_uuid'); $table->string('model_type'); });
        }
        DB::table('users')->insert(['id' => 'unused-account']);
        $this->assertTrue(User::findOrFail('unused-account')->delete());
        $this->assertDatabaseMissing('users', ['id' => 'unused-account']);
    }
}
