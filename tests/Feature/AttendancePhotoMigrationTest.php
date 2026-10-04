<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class AttendancePhotoMigrationTest extends TestCase
{
    public function test_public_photo_is_only_removed_after_verified_copy(): void
    {
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        Schema::create('absensi', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('foto_checkin')->nullable();
            $table->string('foto_checkout')->nullable();
        });
        Storage::fake('public');
        Storage::fake('local');
        $path = 'absensi/lama.jpg';
        DB::table('absensi')->insert([
            'id' => (string) Str::uuid(), 'foto_checkin' => $path, 'foto_checkout' => null,
        ]);
        Storage::disk('public')->put($path, 'foto-lama');

        $this->artisan('piket:privatize-photos')->assertExitCode(0);
        Storage::disk('public')->assertExists($path);
        Storage::disk('local')->assertMissing($path);

        $this->artisan('piket:privatize-photos', ['--execute' => true])->assertExitCode(0);
        Storage::disk('public')->assertMissing($path);
        Storage::disk('local')->assertExists($path);
        $this->assertSame('foto-lama', Storage::disk('local')->get($path));
    }
}
