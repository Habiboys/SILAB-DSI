<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check current columns to handle idempotent runs
        $cols = collect(DB::select("SHOW COLUMNS FROM struktur_permissions"))->pluck('Field')->toArray();
        $hasOldBigintStrukturId = in_array('struktur_id', $cols) &&
            DB::select("SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME='struktur_permissions' AND COLUMN_NAME='struktur_id' AND TABLE_SCHEMA=DATABASE()")[0]->DATA_TYPE === 'bigint';

        // Drop wrongly-typed bigint columns if they exist from a previous failed run
        if ($hasOldBigintStrukturId) {
            Schema::table('struktur_permissions', function (Blueprint $table) {
                $table->dropColumn(['struktur_id', 'permission_id']);
            });
        }

        // Step 1: Add new FK columns as char(36) matching struktur.id and permissions.id
        if (!in_array('struktur_id', $cols) || $hasOldBigintStrukturId) {
            Schema::table('struktur_permissions', function (Blueprint $table) {
                $table->char('struktur_id', 36)->nullable()->after('id');
                $table->char('permission_id', 36)->nullable()->after('struktur_id');
            });
        }

        // Step 2: Migrate existing data — resolve jabatan → struktur_id, permission → permission_id
        if (in_array('jabatan', $cols)) {
            $rows = DB::table('struktur_permissions')->get();
            foreach ($rows as $row) {
                $strukturId = DB::table('struktur')
                    ->where('struktur', $row->jabatan)
                    ->value('id');

                $permissionId = DB::table('permissions')
                    ->where('name', $row->permission)
                    ->value('id');

                if ($strukturId && $permissionId) {
                    DB::table('struktur_permissions')
                        ->where('id', $row->id)
                        ->update([
                            'struktur_id'   => $strukturId,
                            'permission_id' => $permissionId,
                        ]);
                } else {
                    // Remove rows that cannot be mapped
                    DB::table('struktur_permissions')->where('id', $row->id)->delete();
                }
            }

            // Step 3: Drop old varchar columns + their unique index
            Schema::table('struktur_permissions', function (Blueprint $table) {
                try { $table->dropUnique(['jabatan', 'permission']); } catch (\Exception $e) {}
                try { $table->dropIndex('struktur_permissions_jabatan_index'); } catch (\Exception $e) {}
                $table->dropColumn(['jabatan', 'permission', 'description']);
            });
        }

        // Step 4: Make columns NOT NULL, add FKs and unique constraint
        Schema::table('struktur_permissions', function (Blueprint $table) {
            $table->char('struktur_id', 36)->nullable(false)->change();
            $table->char('permission_id', 36)->nullable(false)->change();

            // Add FKs only if not already present
            $constraints = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='struktur_permissions' AND CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA=DATABASE()"))->pluck('CONSTRAINT_NAME')->toArray();
            if (!in_array('struktur_permissions_struktur_id_foreign', $constraints)) {
                $table->foreign('struktur_id')->references('id')->on('struktur')->onDelete('cascade');
            }
            if (!in_array('struktur_permissions_permission_id_foreign', $constraints)) {
                $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            }

            // Add unique constraint only if not already present
            $indexes = collect(DB::select("SHOW INDEX FROM struktur_permissions WHERE Key_name='struktur_permissions_struktur_id_permission_id_unique'"));
            if ($indexes->isEmpty()) {
                $table->unique(['struktur_id', 'permission_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('struktur_permissions', function (Blueprint $table) {
            try { $table->dropUnique(['struktur_id', 'permission_id']); } catch (\Exception $e) {}
            try { $table->dropForeign(['struktur_id']); } catch (\Exception $e) {}
            try { $table->dropForeign(['permission_id']); } catch (\Exception $e) {}
            $table->dropColumn(['struktur_id', 'permission_id']);

            $table->string('jabatan')->after('id');
            $table->string('permission')->after('jabatan');
            $table->text('description')->nullable()->after('permission');

            $table->unique(['jabatan', 'permission']);
            $table->index('jabatan');
        });
    }
};
