<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat peran
        Role::create(['name' => 'superadmin']);
        Role::create(['name' => 'kadep']);
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'asisten']);
        Role::create(['name' => 'dosen']);
    }
}
