<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    /**
     * Display a listing of all users with search, role filter, and pagination.
     */
    public function index(Request $request)
    {
        $search  = $request->input('search');
        $role    = $request->input('role');
        $perPage = min((int) $request->input('perPage', 15), 100);

        $query = User::with(['roles', 'laboratory'])
            ->orderBy('name');

        // Search by name or email
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($role && $role !== 'all') {
            $query->role($role);
        }

        $users = $query->paginate($perPage)->withQueryString();

        // Transform users data
        $users->getCollection()->transform(function ($user) {
            $roles = $user->roles->pluck('name')->values()->toArray();

            // Determine lab info: from access_lab_id OR from active kepengurusan
            $labInfo = null;
            if ($user->laboratory) {
                $labInfo = [
                    'id'   => $user->laboratory->id,
                    'name' => $user->laboratory->nama,
                    'source' => 'access_lab',
                ];
            } else {
                // Try to get lab from active kepengurusan
                $activeKepengurusan = $user->kepengurusanAktif()
                    ->with('kepengurusanLab.laboratorium')
                    ->first();
                if ($activeKepengurusan && $activeKepengurusan->kepengurusanLab) {
                    $lab = $activeKepengurusan->kepengurusanLab->laboratorium;
                    $labInfo = [
                        'id'   => $lab->id ?? null,
                        'name' => $lab->nama ?? '-',
                        'source' => 'kepengurusan',
                    ];
                }
            }

            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'roles'      => $roles,
                'laboratory' => $labInfo,
                'access_lab_id' => $user->access_lab_id,
                'created_at' => $user->created_at?->format('d M Y'),
            ];
        });

        // Get all labs for the dropdown
        $laboratories = Laboratorium::select('id', 'nama as name')->orderBy('nama')->get();

        // Get all available roles
        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('UserManagement', [
            'users'        => $users,
            'laboratories' => $laboratories,
            'roles'        => $roles,
            'filters'      => [
                'search'  => $search,
                'role'    => $role,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'password'      => ['required', 'confirmed', Rules\Password::defaults()],
            'roles'         => 'required|array|min:1',
            'roles.*'       => 'string|exists:roles,name',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        $selectedRoles = $request->roles;

        // For admin role, laboratory_id is required
        if (in_array('admin', $selectedRoles) && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'Laboratorium wajib diisi untuk role Admin.']);
        }

        // Create the user
        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'access_lab_id' => in_array('admin', $selectedRoles) ? $request->laboratory_id : null,
        ]);

        // Assign roles
        $user->syncRoles($selectedRoles);

        return redirect()->route('user-management.index')->with('message', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password'      => ['nullable', 'confirmed', Rules\Password::defaults()],
            'roles'         => 'required|array|min:1',
            'roles.*'       => 'string|exists:roles,name',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        $selectedRoles = $request->roles;

        // For admin role, laboratory_id is required
        if (in_array('admin', $selectedRoles) && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'Laboratorium wajib diisi untuk role Admin.']);
        }

        // Update user details
        $user->name  = $request->name;
        $user->email = $request->email;

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        // Update laboratory assignment
        $user->access_lab_id = in_array('admin', $selectedRoles) ? $request->laboratory_id : null;
        $user->save();

        // Sync roles
        $user->syncRoles($selectedRoles);

        return redirect()->route('user-management.index')->with('message', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return back()->withErrors(['delete' => 'Anda tidak dapat menghapus akun sendiri.']);
        }

        // Prevent deleting superadmin if you're not superadmin
        if ($user->hasRole('superadmin') && !auth()->user()->hasRole('superadmin')) {
            return back()->withErrors(['delete' => 'Hanya superadmin yang dapat menghapus akun superadmin lain.']);
        }

        $user->delete();

        return redirect()->route('user-management.index')->with('message', 'User berhasil dihapus.');
    }
}
