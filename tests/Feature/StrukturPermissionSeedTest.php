<?php

namespace Tests\Feature;

use App\Models\Struktur;
use App\Models\Permission\Permission;
use App\Services\PermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StrukturPermissionSeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_proker_permission_seed_uses_existing_structure_foreign_keys_and_is_idempotent(): void
    {
        $struktur = Struktur::create(['struktur' => 'Kepala Lab', 'jabatan_tunggal' => true]);
        $this->seed(\Database\Seeders\ProkerPermissionSeeder::class);
        $this->seed(\Database\Seeders\ProkerPermissionSeeder::class);
        $permission = Permission::findByName('proker.approve', 'web');
        $this->assertDatabaseHas('struktur_permissions', ['struktur_id' => $struktur->id, 'permission_id' => $permission->id]);
        $this->assertSame(6, DB::table('struktur_permissions')->where('struktur_id', $struktur->id)->count());
        PermissionService::clearCache();
        $this->assertContains('proker.approve', PermissionService::getPermissionsForStrukturId($struktur->id));
    }

    public function test_structure_permission_seed_is_idempotent_and_does_not_create_unknown_positions(): void
    {
        $struktur = Struktur::create(['struktur' => 'Bendahara', 'jabatan_tunggal' => true]);
        $this->seed(\Database\Seeders\StrukturPermissionSeeder::class);
        $this->seed(\Database\Seeders\StrukturPermissionSeeder::class);
        $this->assertDatabaseCount('struktur', 1);
        $this->assertSame(4, DB::table('struktur_permissions')->where('struktur_id', $struktur->id)->count());
        PermissionService::clearCache();
        $this->assertContains('keuangan.create-transaksi', PermissionService::getPermissionsForStrukturId($struktur->id));
    }
}
