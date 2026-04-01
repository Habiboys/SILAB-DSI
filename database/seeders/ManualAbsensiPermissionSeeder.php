<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

class ManualAbsensiPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'absensi.manual.create',
            'absensi.manual.update',
            'absensi.manual.delete',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $superadmin = Role::where('name', 'superadmin')->first();
        if ($superadmin) {
            $superadmin->givePermissionTo($permissions);
        }

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->givePermissionTo([
                'absensi.manual.create',
                'absensi.manual.update',
            ]);
        }

        $this->command->info('ManualAbsensiPermissionSeeder selesai.');
    }
}
