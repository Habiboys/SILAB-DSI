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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('nim')->nullable();
            $table->string('nip')->nullable();
            $table->enum('jenis_kelamin', ['laki-laki', 'perempuan'])->nullable();;
            $table->string('foto_profile')->nullable();
            $table->string('alamat')->nullable();;
            $table->string('no_hp')->nullable();;
            $table->string('tempat_lahir')->nullable();;
            $table->date('tanggal_lahir')->nullable();;
            $table->string('nomor_anggota')->nullable();
            $table->unsignedBigInteger('role_id')->nullable();
            // $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null')->nullable();;
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
