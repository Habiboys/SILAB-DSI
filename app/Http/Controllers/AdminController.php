<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Get all admin users with their labs
        $admins = User::role(['admin'])
            ->with('laboratory')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()->name,
                    'laboratory' => $user->laboratory ? [
                        'id' => $user->laboratory->id,
                        'name' => $user->laboratory->nama
                    ] : null
                ];
            });

        // Get all labs for the dropdown
        $laboratories = Laboratorium::select('id', 'nama as name')->get();
        
        // Get all admin roles
        $roles = Role::whereIn('name', ['admin'])->get();

        return Inertia::render('Admin/Index', [
            'admins' => $admins,
            'laboratories' => $laboratories,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:admin,superadmin,kadep',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        // For admin role, laboratory_id is required
        if ($request->role === 'admin' && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'The laboratory field is required for admin users.']);
        }

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'laboratory_id' => $request->role === 'admin' ? $request->laboratory_id : null,
        ]);

        // Assign the role
        $user->assignRole($request->role);

        return redirect()->route('admin.index')->with('message', 'Admin created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $admin)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $admin->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:admin,superadmin,kadep',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        // For admin role, laboratory_id is required
        if ($request->role === 'admin' && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'The laboratory field is required for admin users.']);
        }

        // Update user details
        $admin->name = $request->name;
        $admin->email = $request->email;
        
        if ($request->password) {
            $admin->password = Hash::make($request->password);
        }
        
        // Update laboratory assignment based on role
        $admin->laboratory_id = $request->role === 'admin' ? $request->laboratory_id : null;
        $admin->save();

        // Update role if changed
        if (!$admin->hasRole($request->role)) {
            $admin->syncRoles([$request->role]);
        }

        return redirect()->route('admin.index')->with('message', 'Admin updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $admin)
    {
        // Prevent deleting yourself
        if (auth()->id() === $admin->id) {
            return back()->withErrors(['delete' => 'You cannot delete your own account.']);
        }

        $admin->delete();

        return redirect()->route('admin.index')->with('message', 'Admin deleted successfully');
    }
}