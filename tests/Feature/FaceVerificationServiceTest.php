<?php

namespace Tests\Feature;

use App\Models\FaceChallenge;
use App\Models\FaceEnrollment;
use App\Models\User;
use App\Services\FaceVerificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FaceVerificationServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'services.face.url' => 'http://face.test',
            'services.face.token' => 'test-token',
            'services.face.threshold' => 0.70,
        ]);
        DB::purge('sqlite');
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->timestamps();
        });
        Schema::create('face_challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('purpose');
            $table->json('actions');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('face_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('kepengurusan_lab_id');
            $table->string('status');
            $table->longText('embeddings')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    private function frames(): array
    {
        return array_fill(0, 12, 'data:image/jpeg;base64,' . base64_encode('jpeg-test'));
    }

    private function user(): User
    {
        return User::create(['name' => 'Tester', 'email' => Str::uuid() . '@test.local', 'password' => 'password']);
    }

    public function test_enrollment_challenge_is_consumed_once_and_returns_private_evidence(): void
    {
        $user = $this->user();
        $service = app(FaceVerificationService::class);
        $challenge = $service->issueChallenge($user, 'enroll');
        $vectors = array_fill(0, 5, array_fill(0, 512, 0.1));
        Http::fake(['face.test/v1/enroll' => Http::response([
            'success' => true, 'embeddings' => $vectors, 'evidence_index' => 3,
        ])]);

        $result = $service->analyze($user, 'enroll', $challenge->id, $this->frames());

        $this->assertSame($vectors, $result['embeddings']);
        $this->assertSame('jpeg-test', $result['image']);
        $this->assertNotNull($challenge->fresh()->consumed_at);
        Http::assertSentCount(1);
        $this->expectException(ValidationException::class);
        $service->analyze($user, 'enroll', $challenge->id, $this->frames());
    }

    public function test_expired_challenge_does_not_contact_sidecar(): void
    {
        $user = $this->user();
        $challenge = FaceChallenge::create([
            'user_id' => $user->id, 'purpose' => 'enroll',
            'actions' => ['blink', 'left'], 'expires_at' => now()->subSecond(),
        ]);
        Http::fake();
        try {
            app(FaceVerificationService::class)->analyze($user, 'enroll', $challenge->id, $this->frames());
            $this->fail('Tantangan kedaluwarsa diterima.');
        } catch (ValidationException $e) {
            $this->assertNull($challenge->fresh()->consumed_at);
            Http::assertNothingSent();
        }
    }

    public function test_approved_face_from_another_lab_cannot_verify_attendance(): void
    {
        $user = $this->user();
        $labA = (string) Str::uuid();
        $labB = (string) Str::uuid();
        FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => $labA,
            'status' => 'approved', 'embeddings' => [array_fill(0, 512, 0.1)],
            'reviewed_at' => now(),
        ]);
        $service = app(FaceVerificationService::class);
        $challenge = $service->issueChallenge($user, 'checkin');
        Http::fake();

        try {
            $service->analyze($user, 'checkin', $challenge->id, $this->frames(), $labB);
            $this->fail('Vektor dari lab lain diterima.');
        } catch (ValidationException $e) {
            Http::assertNothingSent();
        }
    }

    public function test_sidecar_mismatch_consumes_challenge_without_saving_evidence(): void
    {
        $user = $this->user();
        $lab = (string) Str::uuid();
        FaceEnrollment::create([
            'user_id' => $user->id, 'kepengurusan_lab_id' => $lab,
            'status' => 'approved', 'embeddings' => [array_fill(0, 512, 0.1)],
            'reviewed_at' => now(),
        ]);
        $service = app(FaceVerificationService::class);
        $challenge = $service->issueChallenge($user, 'checkout');
        Http::fake(['face.test/v1/verify' => Http::response([
            'success' => false, 'reason' => 'face_mismatch', 'similarity' => 0.2,
        ], 422)]);

        try {
            $service->analyze($user, 'checkout', $challenge->id, $this->frames(), $lab);
            $this->fail('Wajah berbeda diterima.');
        } catch (ValidationException $e) {
            $this->assertNotNull($challenge->fresh()->consumed_at);
            $this->assertArrayHasKey('face', $e->errors());
            Http::assertSentCount(1);
        }
    }
}
