<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Spatie\Permission\PermissionRegistrar;

class FixPiketViewPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('Fixing piket.view permission...');

        // Ensure permission exists
        $permission = Permission::firstOrCreate(['name' => 'piket.view', 'guard_name' => 'web']);
        $this->command->info('Permission piket.view ensured.');

        // Assign to Roles
        $rolesData = [
            'superadmin',
            'admin',
            'asisten',
            'kadep',
            'praktikan'
        ];

        foreach ($rolesData as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->givePermissionTo($permission);
                $this->command->info("Assigned piket.view to role: $roleName");
            } else {
                $this->command->warn("Role $roleName not found!");
            }
        }

        $this->command->info('FixPiketViewPermissionSeeder completed.');
    }
}
