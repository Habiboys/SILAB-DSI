<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds parent_id self-referencing FK to struktur table.
     * Records with parent_id = null are "parent" (koordinator) struktuts that can own proker.
     * Records with parent_id set are "child" (anggota) struktuts that cannot create proker.
     */
    public function up(): void
    {
        Schema::table('struktur', function (Blueprint $table) {
            $table->char('parent_id', 36)->nullable()->after('default_role_id');
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('struktur')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('struktur', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
