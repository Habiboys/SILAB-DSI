<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\DB;

/**
 * Rename admin.* permissions → user-management.*
 *
 * Run:  php artisan db:seed --class=UserManagementPermissionSeeder
 */
class UserManagementPermissionSeeder extends Seeder
{
    /**
     * Old name → New name mapping
     */
    private array $rename = [
        'admin.view-users'         => 'user-management.view',
        'admin.create-users'       => 'user-management.create',
        'admin.update-users'       => 'user-management.update',
        'admin.delete-users'       => 'user-management.delete',
        'admin.manage-roles'       => 'user-management.manage-roles',
        'admin.manage-permissions' => 'user-management.manage-permissions',
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('');
        $this->command->info('=== UserManagement Permission Seeder ===');
        $this->command->info('Renaming admin.* → user-management.*');
        $this->command->info('');

        foreach ($this->rename as $oldName => $newName) {
            $this->renamePermission($oldName, $newName);
        }

        // Ensure superadmin still gets all permissions
        $superadmin = Role::where('name', 'superadmin')->first();
        if ($superadmin) {
            $superadmin->givePermissionTo(Permission::all());
            $this->command->info('✓ Superadmin: all permissions refreshed');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('');
        $this->command->info('Done! Summary:');
        foreach ($this->rename as $old => $new) {
            $exists = Permission::where('name', $new)->exists();
            $this->command->info("  " . ($exists ? '✓' : '✗') . " {$new}");
        }
        $this->command->info('');
    }

    private function renamePermission(string $oldName, string $newName): void
    {
        // 1. Ensure new permission exists
        $newPerm = Permission::firstOrCreate(
            ['name' => $newName, 'guard_name' => 'web']
        );

        // 2. Find old permission
        $oldPerm = DB::table('permissions')
            ->where('name', $oldName)
            ->where('guard_name', 'web')
            ->first();

        if (!$oldPerm) {
            $this->command->warn("  - {$oldName} not found in DB, skipping");
            return;
        }

        // 3. Copy role assignments: old permission → new permission
        $roleRows = DB::table('role_has_permissions')
            ->where('permission_id', $oldPerm->id)
            ->get();

        foreach ($roleRows as $row) {
            DB::table('role_has_permissions')->updateOrInsert(
                ['permission_id' => $newPerm->id, 'role_id' => $row->role_id],
                ['permission_id' => $newPerm->id, 'role_id' => $row->role_id]
            );
        }
        // Remove old role assignments
        DB::table('role_has_permissions')
            ->where('permission_id', $oldPerm->id)
            ->delete();

        // 4. Copy user (model) assignments: old → new
        $modelRows = DB::table('model_has_permissions')
            ->where('permission_id', $oldPerm->id)
            ->get();

        foreach ($modelRows as $row) {
            DB::table('model_has_permissions')->updateOrInsert(
                [
                    'permission_id' => $newPerm->id,
                    'model_type'    => $row->model_type,
                    'model_id'      => $row->model_id,
                ],
                [
                    'permission_id' => $newPerm->id,
                    'model_type'    => $row->model_type,
                    'model_id'      => $row->model_id,
                ]
            );
        }
        // Remove old user assignments
        DB::table('model_has_permissions')
            ->where('permission_id', $oldPerm->id)
            ->delete();

        // 5. Update struktur_permissions FK to point to new permission
        DB::table('struktur_permissions')
            ->where('permission_id', $oldPerm->id)
            ->update(['permission_id' => $newPerm->id]);

        // 6. Delete old permission (safe now – no FK rows point to it)
        DB::table('permissions')
            ->where('id', $oldPerm->id)
            ->delete();

        $this->command->info("  ✓ {$oldName} → {$newName}");
    }
}
