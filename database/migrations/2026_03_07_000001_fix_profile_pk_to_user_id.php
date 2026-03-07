<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile', function (Blueprint $table) {
            // Drop the existing primary key and id column
            $table->dropPrimary();
            $table->dropColumn('id');

            // Make user_id the primary key
            $table->primary('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('profile', function (Blueprint $table) {
            $table->dropPrimary('profile_user_id_primary');
            $table->uuid('id')->first();
        });

        DB::statement("UPDATE profile SET id = UUID()");

        Schema::table('profile', function (Blueprint $table) {
            $table->primary('id');
        });
    }
};
