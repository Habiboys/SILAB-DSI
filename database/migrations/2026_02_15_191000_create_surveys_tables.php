<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Kuesioner (Survey)
        Schema::create('kuesioner', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul'); // title
            $table->text('deskripsi')->nullable(); // description
            $table->enum('tipe', ['internal', 'eksternal']); // type
            $table->string('link_eksternal')->nullable(); // external_url
            $table->dateTime('tanggal_mulai')->nullable(); // start_date
            $table->dateTime('tanggal_selesai')->nullable(); // end_date
            $table->boolean('is_active')->default(true);
            $table->uuid('dibuat_oleh'); // created_by
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('dibuat_oleh')->references('id')->on('users')->onDelete('cascade');
        });

        // 2. Pertanyaan Kuesioner
        Schema::create('pertanyaan_kuesioner', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kuesioner_id');
            $table->text('pertanyaan'); // question_text
            $table->string('tipe_pertanyaan'); // question_type: text, textarea, radio, checkbox, scale
            $table->json('opsi')->nullable(); // options
            $table->boolean('wajib_diisi')->default(false); // is_required
            $table->integer('urutan'); // order
            $table->timestamps();

            $table->foreign('kuesioner_id')->references('id')->on('kuesioner')->onDelete('cascade');
        });

        // 3. Target Kuesioner (Assignments)
        Schema::create('target_kuesioner', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kuesioner_id');
            $table->enum('tipe_target', ['role', 'user', 'lab']); // target_type
            $table->string('nilai_target'); // target_value (Role Name, User ID, Lab ID)
            $table->timestamps();

            $table->foreign('kuesioner_id')->references('id')->on('kuesioner')->onDelete('cascade');
        });

        // 4. Respon Kuesioner
        Schema::create('respon_kuesioner', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kuesioner_id');
            $table->uuid('user_id');
            $table->dateTime('tanggal_submit')->useCurrent(); // submitted_at
            $table->timestamps();

            $table->foreign('kuesioner_id')->references('id')->on('kuesioner')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 5. Jawaban Kuesioner
        Schema::create('jawaban_kuesioner', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('respon_id');
            $table->uuid('pertanyaan_id');
            $table->text('jawaban')->nullable(); // answer_text (bisa juga JSON string)
            $table->timestamps();

            $table->foreign('respon_id')->references('id')->on('respon_kuesioner')->onDelete('cascade');
            $table->foreign('pertanyaan_id')->references('id')->on('pertanyaan_kuesioner')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jawaban_kuesioner');
        Schema::dropIfExists('respon_kuesioner');
        Schema::dropIfExists('target_kuesioner');
        Schema::dropIfExists('pertanyaan_kuesioner');
        Schema::dropIfExists('kuesioner');
    }
};
