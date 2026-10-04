<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode_piket', function (Blueprint $table) {
            $table->boolean('face_recognition_enabled')->default(false);
        });

        Schema::create('face_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('kepengurusan_lab_id')->constrained('kepengurusan_lab')->cascadeOnDelete();
            $table->string('status', 20);
            $table->longText('embeddings')->nullable();
            $table->string('preview_path')->nullable();
            $table->string('model_version', 40)->default('facenet-512-v1');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['kepengurusan_lab_id', 'status']);
        });

        Schema::create('face_challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('purpose', 20);
            $table->json('actions');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'purpose', 'expires_at']);
        });

        Schema::table('absensi', function (Blueprint $table) {
            $table->uuid('checkin_face_enrollment_id')->nullable();
            $table->decimal('checkin_face_score', 5, 4)->nullable();
            $table->uuid('checkout_face_enrollment_id')->nullable();
            $table->decimal('checkout_face_score', 5, 4)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            $table->dropColumn(['checkin_face_enrollment_id', 'checkin_face_score', 'checkout_face_enrollment_id', 'checkout_face_score']);
        });
        Schema::dropIfExists('face_challenges');
        Schema::dropIfExists('face_enrollments');
        Schema::table('periode_piket', function (Blueprint $table) {
            $table->dropColumn('face_recognition_enabled');
        });
    }
};
