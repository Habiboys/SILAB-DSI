<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;
use App\Models\Permission\Permission;

return new class extends Migration
{
    private array $legacyPermissions = [
        'surat.view',
        'surat.create',
        'surat.update',
        'surat.delete',
        'surat.create_resmi',
        'surat.view_all',
    ];

    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');

        $permissionsTable = $tableNames['permissions'] ?? 'permissions';
        $roleHasPermissionsTable = $tableNames['role_has_permissions'] ?? 'role_has_permissions';
        $modelHasPermissionsTable = $tableNames['model_has_permissions'] ?? 'model_has_permissions';
        $permissionPivotKey = $columnNames['permission_pivot_key'] ?? 'permission_id';

        $permissionIds = DB::table($permissionsTable)
            ->whereIn('name', $this->legacyPermissions)
            ->pluck('id')
            ->all();

        if (!empty($permissionIds)) {
            DB::table($roleHasPermissionsTable)
                ->whereIn($permissionPivotKey, $permissionIds)
                ->delete();

            DB::table($modelHasPermissionsTable)
                ->whereIn($permissionPivotKey, $permissionIds)
                ->delete();

            if (Schema::hasTable('struktur_permissions')) {
                if (Schema::hasColumn('struktur_permissions', 'permission_id')) {
                    DB::table('struktur_permissions')
                        ->whereIn('permission_id', $permissionIds)
                        ->delete();
                } elseif (Schema::hasColumn('struktur_permissions', 'permission')) {
                    DB::table('struktur_permissions')
                        ->whereIn('permission', $this->legacyPermissions)
                        ->delete();
                }
            }
        }

        DB::table($permissionsTable)
            ->whereIn('name', $this->legacyPermissions)
            ->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        foreach ($this->legacyPermissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
