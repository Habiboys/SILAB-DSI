<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionController extends Controller
{

    public function index()
    {

        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized access to role & permission management');
        }

        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions_count' => $role->permissions->count(),
                'permissions' => $role->permissions->pluck('name')->toArray(),
            ];
        });

        $permissions = Permission::all();
        $groupedPermissions = [];

        foreach ($permissions as $permission) {
            $parts = explode('.', $permission->name);
            $module = ucfirst($parts[0] ?? 'other');

            if (!isset($groupedPermissions[$module])) {
                $groupedPermissions[$module] = [];
            }

            $groupedPermissions[$module][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => $this->formatPermissionLabel($permission->name),
            ];
        }

        return Inertia::render('Admin/RolePermissionManager', [
            'roles' => $roles,
            'permissions' => $groupedPermissions,
            'allPermissions' => $permissions->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => $this->formatPermissionLabel($p->name),
                ];
            }),
        ]);
    }


    public function updateRolePermissions(Request $request, $roleId)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::findOrFail($roleId);


        $role->syncPermissions($request->permissions);


        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', "Permissions updated for role: {$role->name}");
    }


    public function createRole(Request $request)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'name' => 'required|string|unique:roles,name|max:255',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        if ($request->has('permissions')) {
            $role->givePermissionTo($request->permissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', "Role '{$request->name}' created successfully");
    }


    public function updateRole(Request $request, $roleId)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $role = Role::findOrFail($roleId);

        if (in_array($role->name, ['superadmin', 'kadep', 'admin', 'asisten', 'praktikan'])) {
            return back()->with('error', "Cannot edit core role: {$role->name}");
        }

        $request->validate([
            'name' => 'required|string|unique:roles,name,' . $roleId . '|max:255',
        ]);

        $role->update(['name' => $request->name]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', "Role updated successfully");
    }


    public function deleteRole($roleId)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $role = Role::findOrFail($roleId);

        if (in_array($role->name, ['superadmin', 'kadep', 'admin', 'asisten', 'praktikan'])) {
            return back()->with('error', "Cannot delete core role: {$role->name}");
        }

        if ($role->users()->count() > 0) {
            return back()->with('error', "Cannot delete role '{$role->name}' - it is assigned to {$role->users()->count()} user(s)");
        }

        $role->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', "Role '{$role->name}' deleted successfully");
    }


    public function getRoleUsers($roleId)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $role = Role::findOrFail($roleId);

        $users = $role->users()->with('profile')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ];
        });

        return response()->json([
            'role' => $role->name,
            'users' => $users,
        ]);
    }


    public function bulkAssignPermissions(Request $request)
    {
        if (!auth()->check() || !auth()->user()->hasRole('superadmin')) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        foreach ($request->role_ids as $roleId) {
            $role = Role::find($roleId);
            if ($role) {
                $role->givePermissionTo($request->permissions);
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return back()->with('success', "Permissions assigned to " . count($request->role_ids) . " role(s)");
    }


    private function formatPermissionLabel($permissionName)
    {
        $parts = explode('.', $permissionName);
        $module = ucfirst($parts[0] ?? '');
        $action = isset($parts[1]) ? ucfirst(str_replace('-', ' ', $parts[1])) : '';

        return $action ? "{$action}" : $module;
    }
}
