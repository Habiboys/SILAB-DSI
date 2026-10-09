<?php

namespace Tests\Feature;

use App\Models\FaceEnrollment;
use App\Models\User;
use App\Jobs\ExpireFaceEnrollment;
use App\Http\Controllers\FaceEnrollmentController;
use App\Services\FaceVerificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Tests\TestCase;

class FaceEnrollmentAccessTest extends TestCase
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
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->timestamps();
        });
        Schema::create('face_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('kepengurusan_lab_id');
            $table->string('status');
            $table->longText('embeddings')->nullable();
            $table->string('preview_path')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->string('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('kepengurusan_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('kepengurusan_lab_id');
            $table->boolean('is_active');
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
        });
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->uuid('model_uuid');
            $table->string('model_type');
        });
        Storage::fake('local');
        $this->withoutMiddleware();
    }

    public function test_user_can_revoke_active_and_pending_face_data(): void
    {
        $user = User::create(['name' => 'Tester', 'email' => 'tester@example.test', 'password' => 'password']);
        $lab = (string) Str::uuid();
        DB::table('kepengurusan_lab')->insert(['id' => $lab, 'laboratorium_id' => 'lab', 'tahun_kepengurusan_id' => 'year', 'is_active' => true]);
        DB::table('kepengurusan_user')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'kepengurusan_lab_id' => $lab, 'is_active' => true]);
        $active = FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'approved', 'embeddings' => [array_fill(0, 512, 0.1)],
        ]);
        $pending = FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'pending', 'embeddings' => [array_fill(0, 512, 0.2)],
            'preview_path' => 'face-enrollments/review.jpg', 'expires_at' => now()->addDays(7),
        ]);
        Storage::disk('local')->put('face-enrollments/review.jpg', 'private-photo');
        $archive = FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => (string) Str::uuid(),
            'status' => 'approved', 'embeddings' => [array_fill(0, 512, 0.3)],
        ]);
        $before = $archive->fresh()->getRawOriginal();

        $this->actingAs($user)->from('/profile')->delete(route('piket.wajah.revoke'))->assertRedirect('/profile');

        $this->assertSame('revoked', $active->fresh()->status);
        $this->assertNull($active->fresh()->embeddings);
        $this->assertSame('revoked', $pending->fresh()->status);
        $this->assertNull($pending->fresh()->embeddings);
        Storage::disk('local')->assertMissing('face-enrollments/review.jpg');
        $this->assertSame($before, $archive->fresh()->getRawOriginal());
    }

    public function test_expired_pending_request_erases_vector_and_preview(): void
    {
        $user = User::create(['name' => 'Tester', 'email' => 'tester@example.test', 'password' => 'password']);
        $pending = FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => (string) Str::uuid(),
            'status' => 'pending', 'embeddings' => [array_fill(0, 512, 0.2)],
            'preview_path' => 'face-enrollments/expired.jpg', 'expires_at' => now()->subSecond(),
        ]);
        Storage::disk('local')->put('face-enrollments/expired.jpg', 'private-photo');

        (new ExpireFaceEnrollment($pending->id))->handle();

        $this->assertSame('expired', $pending->fresh()->status);
        $this->assertNull($pending->fresh()->embeddings);
        Storage::disk('local')->assertMissing('face-enrollments/expired.jpg');
    }

    public function test_enrollment_saves_encrypted_vectors_and_private_review_photo(): void
    {
        $user = User::create(['name' => 'Tester', 'email' => 'tester@example.test', 'password' => 'password']);
        $lab = (string) Str::uuid();
        DB::table('kepengurusan_lab')->insert(['id' => $lab, 'laboratorium_id' => 'lab', 'tahun_kepengurusan_id' => 'year', 'is_active' => true]);
        DB::table('kepengurusan_user')->insert([
            'id' => (string) Str::uuid(), 'user_id' => $user->id,
            'kepengurusan_lab_id' => $lab, 'is_active' => true,
        ]);
        $challengeId = (string) Str::uuid();
        $vectors = array_fill(0, 5, array_fill(0, 512, 0.1));
        $face = \Mockery::mock(FaceVerificationService::class);
        $face->shouldReceive('analyze')->once()->andReturn(['embeddings' => $vectors, 'image' => 'jpeg-test']);
        app()->instance(FaceVerificationService::class, $face);

        $this->actingAs($user)->withSession(['active_kepengurusan_lab_id' => $lab])
            ->postJson(route('piket.wajah.enroll'), [
                'challenge_id' => $challengeId,
                'frames' => array_fill(0, 12, 'data:image/jpeg;base64,' . base64_encode('jpeg-test')),
            ])->assertOk()->assertJson(['success' => true]);

        $enrollment = FaceEnrollment::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('pending', $enrollment->status);
        $this->assertSame($vectors, $enrollment->embeddings);
        $this->assertNotSame(json_encode($vectors), DB::table('face_enrollments')->where('id', $enrollment->id)->value('embeddings'));
        Storage::disk('local')->assertExists($enrollment->preview_path);
    }

    public function test_approval_replaces_old_vector_while_rejection_preserves_active_vector(): void
    {
        $owner = User::create(['name' => 'Owner', 'email' => 'owner@example.test', 'password' => 'password']);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password']);
        $lab = (string) Str::uuid();
        DB::table('roles')->insert(['id' => 1, 'name' => 'superadmin', 'guard_name' => 'web']);
        DB::table('model_has_roles')->insert([
            'role_id' => 1, 'model_uuid' => $admin->id, 'model_type' => User::class,
        ]);
        $old = FaceEnrollment::create([
            'user_id' => $owner->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'approved', 'embeddings' => [array_fill(0, 512, 0.1)],
            'reviewed_at' => now()->subDay(),
        ]);
        $new = FaceEnrollment::create([
            'user_id' => $owner->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'pending', 'embeddings' => [array_fill(0, 512, 0.2)],
            'preview_path' => 'face-enrollments/new.jpg', 'expires_at' => now()->addDays(7),
        ]);
        Storage::disk('local')->put('face-enrollments/new.jpg', 'private-photo');

        $request = Request::create('/piket/wajah/' . $new->id . '/decide', 'POST', ['decision' => 'approve']);
        $request->setUserResolver(fn () => $admin);
        app(FaceEnrollmentController::class)->decide($request, $new);

        $this->assertSame('replaced', $old->fresh()->status);
        $this->assertNull($old->fresh()->embeddings);
        $this->assertSame('approved', $new->fresh()->status);
        $this->assertNotNull($new->fresh()->embeddings);
        Storage::disk('local')->assertMissing('face-enrollments/new.jpg');

        $rejected = FaceEnrollment::create([
            'user_id' => $owner->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'pending', 'embeddings' => [array_fill(0, 512, 0.3)],
            'preview_path' => 'face-enrollments/rejected.jpg', 'expires_at' => now()->addDays(7),
        ]);
        Storage::disk('local')->put('face-enrollments/rejected.jpg', 'private-photo');
        $rejectRequest = Request::create('/piket/wajah/' . $rejected->id . '/decide', 'POST', ['decision' => 'reject']);
        $rejectRequest->setUserResolver(fn () => $admin);
        app(FaceEnrollmentController::class)->decide($rejectRequest, $rejected);

        $this->assertSame('approved', $new->fresh()->status);
        $this->assertSame('rejected', $rejected->fresh()->status);
        $this->assertNull($rejected->fresh()->embeddings);
        Storage::disk('local')->assertMissing('face-enrollments/rejected.jpg');
    }
}
