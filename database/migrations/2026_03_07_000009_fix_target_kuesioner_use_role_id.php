<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if role_id was added as wrong type (bigint) from previous failed run
        $cols = collect(DB::select("SHOW COLUMNS FROM target_kuesioner"))->pluck('Field')->toArray();
        $hasBadRoleId = in_array('role_id', $cols) &&
            DB::select("SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME='target_kuesioner' AND COLUMN_NAME='role_id' AND TABLE_SCHEMA=DATABASE()")[0]->DATA_TYPE === 'bigint';

        if ($hasBadRoleId) {
            Schema::table('target_kuesioner', function (Blueprint $table) {
                $table->dropColumn('role_id');
            });
            $cols = array_diff($cols, ['role_id']);
        }

        // Step 1: Add role_id column as char(36) to match roles.id UUID
        if (!in_array('role_id', $cols)) {
            Schema::table('target_kuesioner', function (Blueprint $table) {
                $table->char('role_id', 36)->nullable()->after('kuesioner_id');
            });
        }

        // Step 2: Migrate data — map nilai_target (role name) to role_id
        if (in_array('tipe_target', $cols) || in_array('nilai_target', $cols)) {
            DB::statement("
                UPDATE target_kuesioner tk
                JOIN roles r ON r.name = tk.nilai_target
                SET tk.role_id = r.id
                WHERE tk.tipe_target = 'role'
            ");

            // Delete rows that couldn't be mapped
            DB::statement("DELETE FROM target_kuesioner WHERE role_id IS NULL OR role_id = ''");

            // Step 3: Drop old columns
            Schema::table('target_kuesioner', function (Blueprint $table) {
                $table->dropColumn(['tipe_target', 'nilai_target']);
            });
        }

        // Step 4: Make role_id NOT NULL and add FK
        Schema::table('target_kuesioner', function (Blueprint $table) {
            $table->char('role_id', 36)->nullable(false)->change();

            $constraints = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='target_kuesioner' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()"))->pluck('CONSTRAINT_NAME')->toArray();
            if (!in_array('target_kuesioner_role_id_foreign', $constraints)) {
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('target_kuesioner', function (Blueprint $table) {
            try { $table->dropForeign(['role_id']); } catch (\Exception $e) {}
            $table->string('nilai_target')->nullable()->after('kuesioner_id');
            $table->enum('tipe_target', ['role', 'user', 'lab'])->default('role')->after('kuesioner_id');
        });

        // Restore data
        DB::statement("
            UPDATE target_kuesioner tk
            JOIN roles r ON r.id = tk.role_id
            SET tk.nilai_target = r.name, tk.tipe_target = 'role'
        ");

        Schema::table('target_kuesioner', function (Blueprint $table) {
            $table->dropColumn('role_id');
        });
    }
};
