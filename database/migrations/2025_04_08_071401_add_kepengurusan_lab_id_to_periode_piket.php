<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        Schema::table('periode_piket', function (Blueprint $table) {
            if (!Schema::hasColumn('periode_piket', 'kepengurusan_lab_id')) {
                $table->unsignedBigInteger('kepengurusan_lab_id')->nullable()->after('id');
                $table->foreign('kepengurusan_lab_id')
                    ->references('id')
                    ->on('kepengurusan_lab')
                    ->onDelete('cascade');
            }
        });
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function down()
    {
        Schema::table('periode_piket', function (Blueprint $table) {
            $table->dropForeign(['kepengurusan_lab_id']);
            $table->dropColumn('kepengurusan_lab_id');
        });
    }
};