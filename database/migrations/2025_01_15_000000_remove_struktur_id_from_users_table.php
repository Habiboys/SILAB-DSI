<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['struktur_id']);
            $table->dropColumn('struktur_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('struktur_id')->nullable();
            $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('set null');
        });
    }
};
