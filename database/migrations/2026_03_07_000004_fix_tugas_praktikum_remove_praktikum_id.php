<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tugas_praktikum', function (Blueprint $table) {
            if (Schema::hasColumn('tugas_praktikum', 'praktikum_id')) {
                try {
                    $table->dropForeign(['praktikum_id']);
                } catch (\Exception $e) {}
                $table->dropColumn('praktikum_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tugas_praktikum', function (Blueprint $table) {
            $table->uuid('praktikum_id')->nullable()->after('id');
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });
    }
};
