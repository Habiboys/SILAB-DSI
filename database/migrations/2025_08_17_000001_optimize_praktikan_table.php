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
        Schema::table('praktikan', function (Blueprint $table) {
            // Hapus kolom yang redundant
            $table->dropForeign(['lab_id']);
            $table->dropColumn('lab_id');
            
            // Hapus kolom email karena sudah ada di users
            $table->dropColumn('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikan', function (Blueprint $table) {
            // Restore kolom yang dihapus
            $table->uuid('lab_id')->after('user_id');
            $table->string('email')->nullable()->after('nama');
            
            // Restore foreign key
            $table->foreign('lab_id')->references('id')->on('laboratorium')->onDelete('cascade');
        });
    }
};
