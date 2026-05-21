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

    public function index(Request $request)
    {

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

        $laboratories = Laboratorium::select('id', 'nama as name')->get();


        $roles = Role::whereIn('name', ['admin'])->get();

        return Inertia::render('Admin/Index', [
            'admins' => $admins,
            'laboratories' => $laboratories,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:admin,superadmin,kadep',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        if ($request->role === 'admin' && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'The laboratory field is required for admin users.']);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'access_lab_id' => $request->role === 'admin' ? $request->laboratory_id : null,
        ]);

        $user->assignRole($request->role);

        return redirect()->route('admin.index')->with('message', 'Admin created successfully');
    }


    public function update(Request $request, User $admin)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $admin->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:admin,superadmin,kadep',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        if ($request->role === 'admin' && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'The laboratory field is required for admin users.']);
        }

        $admin->name = $request->name;
        $admin->email = $request->email;

        if ($request->password) {
            $admin->password = Hash::make($request->password);
        }


        $admin->access_lab_id = $request->role === 'admin' ? $request->laboratory_id : null;
        $admin->save();

        if (!$admin->hasRole($request->role)) {
            $admin->syncRoles([$request->role]);
        }

        return redirect()->route('admin.index')->with('message', 'Admin updated successfully');
    }


    public function destroy(User $admin)
    {

        if (auth()->id() === $admin->id) {
            return back()->withErrors(['delete' => 'You cannot delete your own account.']);
        }

        $admin->delete();

        return redirect()->route('admin.index')->with('message', 'Admin deleted successfully');
    }
}
