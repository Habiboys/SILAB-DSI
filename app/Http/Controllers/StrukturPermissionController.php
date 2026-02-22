<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class StrukturPermissionController extends Controller
{
    /**
     * Display struktur permission management page
     */
    public function index()
    {
        // Get unique jabatan from struktur table with their default role
        $strukturList = DB::table('struktur')
            ->join('roles', 'struktur.default_role_id', '=', 'roles.id')
            ->select('struktur.struktur as jabatan', 'roles.name as base_role', 'roles.id as role_id')
            // Handle duplicates: prioritized distinct by jabatan name, assuming same jabatan has same role
            ->whereNotNull('struktur.struktur')
            ->where('struktur.struktur', '!=', '')
            ->orderBy('struktur.struktur')
            ->get()
            ->unique('jabatan');

        // Get jabatan that already have permissions configured
        $jabatanWithPermissions = DB::table('struktur_permissions')
            ->select('jabatan', DB::raw('COUNT(*) as permissions_count'))
            ->groupBy('jabatan')
            ->orderBy('jabatan')
            ->get();

        // Get all available permissions grouped by module
        $allPermissions = Permission::all();
        $permissionsByModule = [];
        
        foreach ($allPermissions as $permission) {
            $parts = explode('.', $permission->name);
            $module = ucfirst($parts[0] ?? 'Other');
            
            if (!isset($permissionsByModule[$module])) {
                $permissionsByModule[$module] = [];
            }
            
            $permissionsByModule[$module][] = [
                'name' => $permission->name,
                'label' => $this->formatPermissionLabel($permission->name),
            ];
        }

        // Helper to get permissions for a role
        // Since we now have dynamic roles from DB, we can cache them by ID or Name
        // We'll fetch all role permissions in one go
        $rolePermissions = DB::table('role_has_permissions')
            ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
            ->join('roles', 'role_has_permissions.role_id', '=', 'roles.id')
            ->select('roles.name as role_name', 'permissions.name as permission_name')
            ->get()
            ->groupBy('role_name')
            ->map(function ($items) {
                return $items->pluck('permission_name')->toArray();
            })
            ->toArray();

        // Merge: show all jabatan from struktur, with permission counts and inherited perms
        $jabatanList = $strukturList->map(function($item) use ($jabatanWithPermissions, $rolePermissions) {
            $configured = $jabatanWithPermissions->firstWhere('jabatan', $item->jabatan);
            $baseRole = $item->base_role;
            
            return (object)[
                'jabatan' => $item->jabatan,
                'permissions_count' => $configured ? $configured->permissions_count : 0,
                'base_role' => $baseRole,
                'inherited_permissions' => $rolePermissions[$baseRole] ?? [],
            ];
        })->values();

        // Get current additional permissions per jabatan
        $jabatanPermissions = [];
        foreach ($jabatanList as $jab) {
            $jabatanPermissions[$jab->jabatan] = DB::table('struktur_permissions')
                ->where('jabatan', $jab->jabatan)
                ->pluck('permission')
                ->toArray();
        }

        return Inertia::render('Admin/StrukturPermissionManager', [
            'jabatans' => $jabatanList,
            'permissions' => $permissionsByModule,
            'jabatanPermissions' => $jabatanPermissions,
        ]);
    }

    /**
     * Update permissions for a jabatan
     */
    public function update(Request $request, string $jabatan)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        DB::transaction(function () use ($jabatan, $request) {
            // Delete existing permissions for this jabatan
            DB::table('struktur_permissions')
                ->where('jabatan', $jabatan)
                ->delete();

            // Insert new permissions
            if (!empty($request->permissions)) {
                $data = collect($request->permissions)->map(fn($perm) => [
                    'jabatan' => $jabatan,
                    'permission' => $perm,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->toArray();

                DB::table('struktur_permissions')->insert($data);
            }
            
            // Clear cache
            PermissionService::clearCache($jabatan);
        });

        return redirect()->back()->with('success', "Permissions updated for {$jabatan}");
    }

    /**
     * Create new jabatan with permissions
     */
    public function store(Request $request)
    {
        $request->validate([
            'jabatan' => 'required|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        // Check if jabatan already exists
        $exists = DB::table('struktur_permissions')
            ->where('jabatan', $request->jabatan)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['jabatan' => 'Jabatan already exists']);
        }

        DB::transaction(function () use ($request) {
            if (!empty($request->permissions)) {
                foreach ($request->permissions as $permission) {
                    DB::table('struktur_permissions')->insert([
                        'jabatan' => $request->jabatan,
                        'permission' => $permission,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            
            PermissionService::clearCache();
        });

        return redirect()->back()->with('success', "Jabatan '{$request->jabatan}' created");
    }

    /**
     * Delete a jabatan and all its permissions
     */
    public function destroy(string $jabatan)
    {
        DB::table('struktur_permissions')
            ->where('jabatan', $jabatan)
            ->delete();
            
        PermissionService::clearCache($jabatan);

        return redirect()->back()->with('success', "Jabatan '{$jabatan}' deleted");
    }

    private function formatPermissionLabel(string $permission): string
    {
        $parts = explode('.', $permission);
        $action = $parts[1] ?? $permission;
        return ucwords(str_replace('_', ' ', $action));
    }
}
