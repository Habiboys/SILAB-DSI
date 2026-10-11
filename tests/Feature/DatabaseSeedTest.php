<?php

namespace Tests\Feature;

use App\Models\{Laboratorium, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_seed_runs_twice_on_a_fresh_schema_without_duplicate_accounts_or_assets(): void
    {
        $lab = Laboratorium::create(['nama' => 'Seed audit', 'is_active' => true]);
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $admin = User::where('email', 'admin.'.$lab->id.'@admin.com')->firstOrFail();
        $this->assertSame($lab->id, $admin->access_lab_id);
        $this->assertTrue($admin->hasRole('admin'));
        $password = $admin->password;
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseCount('aset', 10);
        $this->assertSame($password, $admin->fresh()->password);
    }

    public function test_production_seed_creates_roles_without_sample_accounts_or_assets(): void
    {
        $this->app->instance('env', 'production');
        $this->artisan('db:seed', ['--class' => \Database\Seeders\DatabaseSeeder::class, '--force' => true])->assertExitCode(0);
        $this->assertDatabaseHas('roles', ['name' => 'superadmin']);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('aset', 0);
    }
}
