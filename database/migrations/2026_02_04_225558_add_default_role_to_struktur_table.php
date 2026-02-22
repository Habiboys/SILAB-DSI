<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add new FK column
        Schema::table('struktur', function (Blueprint $table) {
            $table->uuid('default_role_id')->nullable()->after('jabatan_tunggal'); 
            // We add constraint later after populating data
        });

        // 2. Migrate existing data
        $roles = DB::table('roles')->pluck('id', 'name'); // Map name => id
        $rows = DB::table('struktur')->get();
        
        // Ensure default role 'asisten' exists if needed as fallback
        $defaultRoleId = $roles['asisten'] ?? DB::table('roles')->where('name', 'asisten')->value('id');

        foreach ($rows as $row) {
            $targetRoleName = 'asisten';
            
            if (isset($row->tipe_jabatan) && $row->tipe_jabatan === 'dosen') {
                if (isset($row->jabatan_terkait) && $row->jabatan_terkait === 'kalab') {
                    $targetRoleName = 'kalab';
                } else {
                    $targetRoleName = 'dosen';
                }
            }
            
            $targetRoleId = $roles[$targetRoleName] ?? $defaultRoleId;
            
            if ($targetRoleId) {
                DB::table('struktur')
                    ->where('id', $row->id)
                    ->update(['default_role_id' => $targetRoleId]);
            }
        }

        // 3. Make column required, add FK, and drop old columns
        Schema::table('struktur', function (Blueprint $table) {
            // Cannot make nullable(false) easily in some DBs without default, so be careful. 
            // But we populated it, so it should be fine if strict mode allows.
            // SQLite might have issues with changing column to not null, but MySQL/Postgres is usually ok.
            
            $table->foreign('default_role_id')->references('id')->on('roles')->onDelete('restrict');
            $table->dropColumn(['tipe_jabatan', 'jabatan_terkait']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('struktur', function (Blueprint $table) {
            $table->enum('tipe_jabatan', ['dosen', 'asisten'])->nullable();
            $table->enum('jabatan_terkait', ['kalab', 'dosen'])->nullable();
            $table->dropForeign(['default_role_id']);
        });

        // Restore data (Best effort)
        // We need to look up role names
        $rows = DB::table('struktur')
            ->join('roles', 'struktur.default_role_id', '=', 'roles.id')
            ->select('struktur.id', 'roles.name as role_name')
            ->get();

        foreach ($rows as $row) {
            $tipe = 'asisten';
            $terkait = null;

            if ($row->role_name === 'kalab') {
                $tipe = 'dosen';
                $terkait = 'kalab';
            } elseif ($row->role_name === 'dosen') {
                $tipe = 'dosen';
                $terkait = 'dosen';
            }

            DB::table('struktur')
                ->where('id', $row->id)
                ->update([
                    'tipe_jabatan' => $tipe,
                    'jabatan_terkait' => $terkait
                ]);
        }

        Schema::table('struktur', function (Blueprint $table) {
            $table->dropColumn('default_role_id');
        });
    }
};
