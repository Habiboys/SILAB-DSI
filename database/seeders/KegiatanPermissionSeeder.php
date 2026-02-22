<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Spatie\Permission\PermissionRegistrar;

class KegiatanPermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'kegiatan.view',
            'kegiatan.create',
            'kegiatan.edit',
            'kegiatan.delete',
            'kegiatan.approve',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign to Roles
        
        // Asisten
        $asisten = Role::firstOrCreate(['name' => 'asisten']);
        $asisten->givePermissionTo([
            'kegiatan.view',
            'kegiatan.create',
            'kegiatan.edit',
            'kegiatan.delete',
        ]);

        // Dosen & Kalab
        $approvers = ['dosen', 'kalab'];
        foreach ($approvers as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->givePermissionTo([
                'kegiatan.view',
                'kegiatan.approve',
            ]);
        }

        // Admin & Kadep & Superadmin & Kalab
        $admins = ['admin', 'kadep', 'superadmin'];
        foreach ($admins as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->givePermissionTo($permissions);
        }
    }
}
