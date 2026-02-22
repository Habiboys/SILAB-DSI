<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Buat peran
        // Buat peran (Safe/Idempotent)
        Role::firstOrCreate(['name' => 'superadmin']);
        Role::firstOrCreate(['name' => 'kadep']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'asisten']);
        Role::firstOrCreate(['name' => 'dosen']);
        // Tambahan role lain jika perlu (misal: kalab, praktikan)
        Role::firstOrCreate(['name' => 'kalab']); 
        Role::firstOrCreate(['name' => 'praktikan']);
    }
}
