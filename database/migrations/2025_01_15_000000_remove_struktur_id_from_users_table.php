<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) return;
        if (Schema::hasColumn('users', 'struktur_id')) {
            foreach (Schema::getForeignKeys('users') as $foreignKey) {
                if (in_array('struktur_id', $foreignKey['columns'], true)) {
                    Schema::table('users', fn (Blueprint $table) => $table->dropForeign($foreignKey['name']));
                }
            }
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('struktur_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('struktur_id')->nullable();
            $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('set null');
        });
    }
};
