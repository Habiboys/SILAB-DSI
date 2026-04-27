<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('laporan_keuangan');
    }

    public function down(): void
    {
        Schema::create('laporan_keuangan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('bulan');
            $table->uuid('kepengurusan_lab_id');
            $table->integer('pemasukan');
            $table->integer('pengeluaran');
            $table->integer('saldo_akhir');
            $table->timestamps();

            $table->foreign('kepengurusan_lab_id')
                ->references('id')
                ->on('kepengurusan_lab')
                ->onDelete('cascade');
        });
    }
};
