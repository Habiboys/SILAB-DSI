<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use App\Models\User;
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

        // Get current additional permissions per jabatan (FK-based) — build BEFORE jabatanList
        // so we can compute the real "extra" count (excluding base role permissions)
        $jabatanPermissions = [];
        foreach ($strukturList as $item) {
            $jabatanPermissions[$item->jabatan] = DB::table('struktur_permissions')
                ->join('struktur', 'struktur_permissions.struktur_id', '=', 'struktur.id')
                ->join('permissions', 'struktur_permissions.permission_id', '=', 'permissions.id')
                ->where('struktur.struktur', $item->jabatan)
                ->distinct()
                ->pluck('permissions.name')
                ->toArray();
        }

        // Merge: show all jabatan from struktur, with permission counts and inherited perms
        // permissions_count = only the extra perms NOT already in the base role
        $jabatanList = $strukturList->map(function($item) use ($jabatanPermissions, $rolePermissions) {
            $baseRole = $item->base_role;
            $inherited = $rolePermissions[$baseRole] ?? [];
            $allConfigured = $jabatanPermissions[$item->jabatan] ?? [];
            $extraOnly = array_values(array_diff($allConfigured, $inherited));

            return (object)[
                'jabatan' => $item->jabatan,
                'permissions_count' => count($extraOnly),
                'base_role' => $baseRole,
                'inherited_permissions' => $inherited,
            ];
        })->values();

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
            'permissions'   => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Resolve struktur_id for the given jabatan name
        $strukturRecord = DB::table('struktur')->where('struktur', $jabatan)->first();
        if (!$strukturRecord) {
            return redirect()->back()->withErrors(['jabatan' => 'Jabatan tidak ditemukan di tabel struktur']);
        }
        $strukturId = $strukturRecord->id;

        $oldPermissions = DB::table('struktur_permissions')
            ->join('permissions', 'struktur_permissions.permission_id', '=', 'permissions.id')
            ->where('struktur_permissions.struktur_id', $strukturId)
            ->pluck('permissions.name')
            ->toArray();

        $newPermissions = $request->input('permissions', []);

        // Resolve permission IDs
        $permissionMap = DB::table('permissions')
            ->whereIn('name', $newPermissions)
            ->pluck('id', 'name')
            ->toArray();

        // 1. Persist to struktur_permissions + clear cache (FK-based)
        DB::transaction(function () use ($strukturId, $newPermissions, $permissionMap) {
            DB::table('struktur_permissions')
                ->where('struktur_id', $strukturId)
                ->delete();

            if (!empty($newPermissions)) {
                $data = collect($newPermissions)
                    ->filter(fn($perm) => isset($permissionMap[$perm]))
                    ->map(fn($perm) => [
                        'struktur_id'   => $strukturId,
                        'permission_id' => $permissionMap[$perm],
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ])->toArray();

                if (!empty($data)) {
                    DB::table('struktur_permissions')->insert($data);
                }
            }
        });

        // 2. Clear cache AFTER transaction commits
        PermissionService::clearCache($jabatan, $strukturId);

        // 3. Re-sync Spatie permissions for every user currently holding this jabatan
        //    (done outside transaction to avoid Spatie cache conflicts)
        $toRevoke = array_diff($oldPermissions, $newPermissions);
        $toGrant  = array_diff($newPermissions, $oldPermissions);

        if (!empty($toRevoke) || !empty($toGrant)) {
            $affectedUserIds = DB::table('kepengurusan_user')
                ->join('struktur', 'kepengurusan_user.struktur_id', '=', 'struktur.id')
                ->where('struktur.struktur', $jabatan)
                ->pluck('kepengurusan_user.user_id')
                ->unique();

            foreach (User::whereIn('id', $affectedUserIds)->get() as $u) {
                if (!empty($toGrant)) {
                    $u->givePermissionTo($toGrant);
                }

                if (!empty($toRevoke)) {
                    // Only revoke if no other jabatan the user holds still grants it
                    $keptByOther = DB::table('kepengurusan_user')
                        ->join('struktur', 'kepengurusan_user.struktur_id', '=', 'struktur.id')
                        ->where('kepengurusan_user.user_id', $u->id)
                        ->where('struktur.struktur', '!=', $jabatan)
                        ->pluck('struktur.struktur')
                        ->unique()
                        ->flatMap(fn($j) => PermissionService::getPermissionsForStruktur($j))
                        ->toArray();

                    $safeToRevoke = array_diff($toRevoke, $keptByOther);
                    if (!empty($safeToRevoke)) {
                        $u->revokePermissionTo($safeToRevoke);
                    }
                }
            }
        }

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

        // Resolve struktur_id for the given jabatan name
        $strukturRecord = DB::table('struktur')->where('struktur', $request->jabatan)->first();
        if (!$strukturRecord) {
            return redirect()->back()->withErrors(['jabatan' => 'Jabatan tidak ditemukan di tabel struktur']);
        }
        $strukturId = $strukturRecord->id;

        // Check if jabatan already has permissions configured
        $exists = DB::table('struktur_permissions')
            ->where('struktur_id', $strukturId)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['jabatan' => 'Jabatan already has permissions configured']);
        }

        DB::transaction(function () use ($request, $strukturId) {
            if (!empty($request->permissions)) {
                $permissionMap = DB::table('permissions')
                    ->whereIn('name', $request->permissions)
                    ->pluck('id', 'name')
                    ->toArray();

                $data = collect($request->permissions)
                    ->filter(fn($p) => isset($permissionMap[$p]))
                    ->map(fn($p) => [
                        'struktur_id'   => $strukturId,
                        'permission_id' => $permissionMap[$p],
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ])->toArray();

                if (!empty($data)) {
                    DB::table('struktur_permissions')->insert($data);
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
        $strukturRecord = DB::table('struktur')->where('struktur', $jabatan)->first();

        if ($strukturRecord) {
            DB::table('struktur_permissions')
                ->where('struktur_id', $strukturRecord->id)
                ->delete();

            PermissionService::clearCache($jabatan, $strukturRecord->id);
        } else {
            PermissionService::clearCache($jabatan);
        }

        return redirect()->back()->with('success', "Jabatan '{$jabatan}' deleted");
    }

    private function formatPermissionLabel(string $permission): string
    {
        $parts = explode('.', $permission);
        $action = $parts[1] ?? $permission;
        return ucwords(str_replace('_', ' ', $action));
    }
}
