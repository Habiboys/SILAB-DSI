<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class FaceSchemaMigrationTest extends TestCase
{
    public function test_existing_periods_remain_opted_out_after_migration(): void
    {
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        foreach (['users', 'kepengurusan_lab', 'periode_piket', 'absensi'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->uuid('id')->primary();
            });
        }
        $periodId = (string) Str::uuid();
        DB::table('periode_piket')->insert(['id' => $periodId]);

        $migration = require database_path('migrations/2026_10_04_000001_add_face_verification_to_piket.php');
        $migration->up();

        $this->assertSame(0, DB::table('periode_piket')->where('id', $periodId)->value('face_recognition_enabled'));
        $this->assertTrue(Schema::hasTable('face_enrollments'));
        $this->assertTrue(Schema::hasTable('face_challenges'));
        $this->assertTrue(Schema::hasColumn('absensi', 'checkin_face_score'));
        $this->assertTrue(Schema::hasColumn('absensi', 'checkout_face_score'));
    }
}
