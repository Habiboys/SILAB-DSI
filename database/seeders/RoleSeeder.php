<?php

namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // Create roles
        $superadmin = Role::create(['name' => 'superadmin']);
        $admin = Role::create(['name' => 'admin']);
        $dosen = Role::create(['name' => 'dosen']);
        $asisten = Role::create(['name' => 'asisten']);
        $kadep = Role::create(['name' => 'kadep']);

        // // Create permissions
        // $permissions = [
        //     'manage-users',
        //     'manage-roles',
        //     'manage-labs',
        //     'manage-piket',
        //     'view-piket',
        //     'manage-inventaris',
        //     'view-inventaris',
        //     'manage-praktikum',
        //     'view-praktikum',
        //     'approve-surat',
        //     'manage-surat',
        //     'view-surat'
        // ];

        // foreach ($permissions as $permission) {
        //     Permission::create(['name' => $permission]);
        // }

        // // Assign permissions to roles
        // $superadmin->givePermissionTo(Permission::all());
        
        // $admin->givePermissionTo([
        //     'manage-piket',
        //     'view-piket',
        //     'manage-inventaris',
        //     'view-inventaris',
        //     'manage-praktikum',
        //     'view-praktikum',
        //     'manage-surat',
        //     'view-surat'
        // ]);

        // $kadep->givePermissionTo([
        //     'view-piket',
        //     'view-inventaris',
        //     'view-praktikum',
        //     'approve-surat',
        //     'view-surat'
        // ]);

        // $dosen->givePermissionTo([
        //     'view-piket',
        //     'view-inventaris',
        //     'view-praktikum',
        //     'view-surat'
        // ]);

        // $asisten->givePermissionTo([
        //     'view-piket',
        //     'view-inventaris',
        //     'view-praktikum',
        //     'view-surat'
        // ]);


      
    }
}