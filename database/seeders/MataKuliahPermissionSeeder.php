<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Illuminate\Support\Str;

class MataKuliahPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Create the permission
        $permission = Permission::firstOrCreate(
            ['name' => 'matakuliah.create', 'guard_name' => 'web'],
            ['id' => Str::uuid()->toString()]
        );

        // 2. Assign to superadmin role
        $superAdmin = Role::where('name', 'superadmin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo($permission);
        }
    }
}
