<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Spatie\Permission\PermissionRegistrar;

class MissingPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'absensi.view_rekap',
            'absensi.view_riwayat',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $roleMap = [
            'superadmin' => ['absensi.view_rekap', 'absensi.view_riwayat'],
            'admin' => ['absensi.view_rekap', 'absensi.view_riwayat'],
            'kalab' => ['absensi.view_rekap', 'absensi.view_riwayat'],
            'kadep' => ['absensi.view_rekap'],
            'dosen' => ['absensi.view_rekap'],
        ];

        foreach ($roleMap as $roleName => $perms) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->givePermissionTo(array_values(array_unique($perms)));
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
