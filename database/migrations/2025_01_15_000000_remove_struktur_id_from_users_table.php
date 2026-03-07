<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = array_column(DB::select('SHOW COLUMNS FROM `users`'), 'Field');
        if (in_array('struktur_id', $columns)) {
            $fks = array_column(
                DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='users' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()"),
                'CONSTRAINT_NAME'
            );
            if (in_array('users_struktur_id_foreign', $fks)) {
                DB::statement('ALTER TABLE `users` DROP FOREIGN KEY `users_struktur_id_foreign`');
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
