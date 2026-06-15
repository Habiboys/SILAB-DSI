<?php

namespace Database\Seeders;

use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Illuminate\Database\Seeder;
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
        $permissions = collect([
            'matakuliah.create',
            'matakuliah.update',
            'matakuliah.delete',
        ])->map(function ($name) {
            return Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['id' => Str::uuid()->toString()]
            );
        });

        $superAdmin = Role::where('name', 'superadmin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo($permissions);
        }

        $kadep = Role::where('name', 'kadep')->first();
        if ($kadep) {
            $kadep->givePermissionTo($permissions);
        }
    }
}
