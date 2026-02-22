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
        // 1. Drop rubrik_penilaian (Redundant)
        Schema::dropIfExists('rubrik_penilaian');

        // 2. Modify nilai_tambahan
        // Skipped because it seems already migrated (columns missing in model:show)
        /*
        Schema::table('nilai_tambahan', function (Blueprint $table) {
            // Drop index first
            $table->dropIndex(['tugas_praktikum_id', 'praktikan_id']);

            // Drop old columns
            $table->dropForeign(['tugas_praktikum_id']);
            $table->dropColumn('tugas_praktikum_id');
            
            $table->dropForeign(['praktikan_id']);
            $table->dropColumn('praktikan_id');

            // Add new column
            $table->uuid('pengumpulan_tugas_id')->after('id');
            $table->foreign('pengumpulan_tugas_id')->references('id')->on('pengumpulan_tugas')->onDelete('cascade');
        });
        */

        // 3. Modify nilai_rubrik
        Schema::table('nilai_rubrik', function (Blueprint $table) {
            // 3a. Add index for komponen_rubrik_id safely
            $indexExists = count(DB::select("SHOW INDEX FROM nilai_rubrik WHERE Key_name = 'idx_komponen_rubrik_temp'")) > 0;
            if (!$indexExists) {
                $table->index('komponen_rubrik_id', 'idx_komponen_rubrik_temp');
            }

            // 3b. Drop unique index safely
            $uniqueExists = count(DB::select("SHOW INDEX FROM nilai_rubrik WHERE Key_name = 'unique_komponen_praktikan'")) > 0;
            if ($uniqueExists) {
                $table->dropUnique('unique_komponen_praktikan');
            }

            // 3c. Drop index on praktikan_id safely
            $indexPraktikanExists = count(DB::select("SHOW INDEX FROM nilai_rubrik WHERE Key_name = 'nilai_rubrik_praktikan_id_foreign'")) > 0;
            if ($indexPraktikanExists) {
                $table->dropIndex('nilai_rubrik_praktikan_id_foreign');
            }
            
            // 3d. Drop column safely
            if (Schema::hasColumn('nilai_rubrik', 'praktikan_id')) {
                $table->dropColumn('praktikan_id');
            }
        });

        // 3e. Make pengumpulan_tugas_id required (Separate Schema call to avoid issues)
        Schema::table('nilai_rubrik', function (Blueprint $table) {
             // Check FK existence
             $fkExists = DB::table('information_schema.TABLE_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
                ->where('TABLE_NAME', 'nilai_rubrik')
                ->where('CONSTRAINT_NAME', 'nilai_rubrik_pengumpulan_tugas_id_foreign')
                ->count() > 0;

             if ($fkExists) {
                 $table->dropForeign(['pengumpulan_tugas_id']);
             }
        });

        Schema::table('nilai_rubrik', function (Blueprint $table) {
            $table->uuid('pengumpulan_tugas_id')->nullable(false)->change();
            
            // Re-add FK if not exists
             $fkExists = DB::table('information_schema.TABLE_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
                ->where('TABLE_NAME', 'nilai_rubrik')
                ->where('CONSTRAINT_NAME', 'nilai_rubrik_pengumpulan_tugas_id_foreign')
                ->count() > 0;
                
            if (!$fkExists) {
                $table->foreign('pengumpulan_tugas_id')->references('id')->on('pengumpulan_tugas')->onDelete('cascade');
            }
        });

        // 4. Modify users (Rename laboratory_id -> access_lab_id)
        if (Schema::hasColumn('users', 'laboratory_id') && !Schema::hasColumn('users', 'access_lab_id')) {
            Schema::table('users', function (Blueprint $table) {
                // Drop FK check
                 $fkExists = DB::table('information_schema.TABLE_CONSTRAINTS')
                    ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
                    ->where('TABLE_NAME', 'users')
                    ->where('CONSTRAINT_NAME', 'users_laboratory_id_foreign')
                    ->count() > 0;
                    
                if ($fkExists) {
                    $table->dropForeign(['laboratory_id']);
                }
                
                $table->renameColumn('laboratory_id', 'access_lab_id');
            });

            Schema::table('users', function (Blueprint $table) {
                 $table->foreign('access_lab_id')->references('id')->on('laboratorium')->onDelete('set null');
            });
        } elseif (Schema::hasColumn('users', 'access_lab_id')) {
             // Ensure FK exists even if column was already renamed
             $fkExists = DB::table('information_schema.TABLE_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
                ->where('TABLE_NAME', 'users')
                ->where('CONSTRAINT_NAME', 'users_access_lab_id_foreign')
                ->count() > 0;
            
            if (!$fkExists) {
                 Schema::table('users', function (Blueprint $table) {
                    $table->foreign('access_lab_id')->references('id')->on('laboratorium')->onDelete('set null');
                });
            }
        }

        // 5. Modify jadwal_praktikum
        Schema::table('jadwal_praktikum', function (Blueprint $table) {
             if (Schema::hasColumn('jadwal_praktikum', 'praktikum_id')) {
                 // Check FK
                 $fkExists = DB::table('information_schema.TABLE_CONSTRAINTS')
                    ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
                    ->where('TABLE_NAME', 'jadwal_praktikum')
                    ->where('CONSTRAINT_NAME', 'jadwal_praktikum_praktikum_id_foreign')
                    ->count() > 0;

                 if ($fkExists) {
                     $table->dropForeign(['praktikum_id']);
                 }
                 $table->dropColumn('praktikum_id');
             }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 5. jadwal_praktikum
        Schema::table('jadwal_praktikum', function (Blueprint $table) {
            $table->uuid('praktikum_id')->nullable();
            $table->foreign('praktikum_id')->references('id')->on('praktikum')->onDelete('cascade');
        });

        // Revert 4. users
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['access_lab_id']);
            $table->renameColumn('access_lab_id', 'laboratory_id');
        });
         Schema::table('users', function (Blueprint $table) {
            $table->foreign('laboratory_id')->references('id')->on('laboratorium')->onDelete('set null');
        });

        // Revert 3. nilai_rubrik
        Schema::table('nilai_rubrik', function (Blueprint $table) {
            $table->uuid('praktikan_id')->nullable();
            $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
            $table->uuid('pengumpulan_tugas_id')->nullable()->change();
        });

        // Revert 2. nilai_tambahan
        Schema::table('nilai_tambahan', function (Blueprint $table) {
             $table->dropForeign(['pengumpulan_tugas_id']);
             $table->dropColumn('pengumpulan_tugas_id');
             
             $table->uuid('tugas_praktikum_id')->nullable();
             $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
             
             $table->uuid('praktikan_id')->nullable();
             $table->foreign('praktikan_id')->references('id')->on('praktikan')->onDelete('cascade');
        });

        // Revert 1. rubrik_penilaian
        Schema::create('rubrik_penilaian', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tugas_praktikum_id');
            $table->string('nama_rubrik');
            $table->text('deskripsi')->nullable();
            $table->decimal('bobot_total', 5, 2)->default(100.00); 
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('tugas_praktikum_id')->references('id')->on('tugas_praktikum')->onDelete('cascade');
        });
    }
};
