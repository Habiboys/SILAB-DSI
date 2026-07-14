<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Pagination\LengthAwarePaginator;

class UserManagementController extends Controller
{

    public function index(Request $request)
    {
        $authUser = auth()->user();
        $search  = $request->input('search');
        $role    = $request->input('role');
        $perPage = min((int) $request->input('perPage', 15), 100);

        $query = User::with([
                'roles',
                'laboratory',
                'profile',
                'praktikan.praktikanPraktikums.kelas',
                'praktikan.praktikanPraktikums.praktikum',
            ])
            ->orderBy('name');

        // Admin hanya lihat user di lab-nya
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            $labId = $authUser->access_lab_id;
            if (!$labId) {
                $emptyPaginator = new LengthAwarePaginator([], 0, $perPage);
                return Inertia::render('UserManagement', [
                    'users' => $emptyPaginator,
                    'laboratories' => collect([]),
                    'roles' => Role::orderBy('name')->get(['id', 'name']),
                    'pendingCount' => 0,
                    'filters' => ['search' => '', 'role' => '', 'perPage' => $perPage],
                ]);
            }
            $query->where('access_lab_id', $labId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role === 'no-role') {
            $query->doesntHave('roles');
        } elseif ($role && $role !== 'all') {
            $query->role($role);
        }

        $users = $query->paginate($perPage)->withQueryString();

        $users->getCollection()->transform(function ($user) {
            $roles = $user->roles->pluck('name')->values()->toArray();

            $labInfo = null;
            if ($user->laboratory) {
                $labInfo = [
                    'id'   => $user->laboratory->id,
                    'name' => $user->laboratory->nama,
                    'source' => 'access_lab',
                ];
            } else {

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
                'microsoft_email' => $user->microsoft_email,
                'roles'      => $roles,
                'laboratory' => $labInfo,
                'access_lab_id' => $user->access_lab_id,
                'created_at' => $user->created_at?->format('d M Y'),
                'created_at_full' => $user->created_at?->format('d M Y H:i'),
                'updated_at_full' => $user->updated_at?->format('d M Y H:i'),
                'profile' => $user->profile ? [
                    'nomor_induk' => $user->profile->nomor_induk,
                    'nomor_anggota' => $user->profile->nomor_anggota,
                    'jenis_kelamin' => $user->profile->jenis_kelamin,
                    'alamat' => $user->profile->alamat,
                    'no_hp' => $user->profile->no_hp,
                    'tempat_lahir' => $user->profile->tempat_lahir,
                    'tanggal_lahir' => $user->profile->tanggal_lahir?->format('d M Y'),
                ] : null,
                'praktikan_detail' => $user->praktikan ? [
                    'id' => $user->praktikan->id,
                    'nim' => $user->praktikan->nim,
                    'nama' => $user->praktikan->nama,
                    'no_hp' => $user->praktikan->no_hp,
                    'enrollments' => $user->praktikan->praktikanPraktikums->map(function ($pp) {
                        return [
                            'praktikum' => $pp->praktikum?->mata_kuliah,
                            'kelas' => $pp->kelas?->nama_kelas,
                            'status' => $pp->status,
                        ];
                    })->values(),
                ] : null,
            ];
        });

        $laboratories = Laboratorium::select('id', 'nama as name')->orderBy('nama')->get();

        $roles = Role::orderBy('name')->get(['id', 'name']);

        // Hitung jumlah user pending (tanpa role)
        $pendingQuery = User::doesntHave('roles');
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            $pendingQuery->where('access_lab_id', $authUser->access_lab_id);
        }
        $pendingCount = $pendingQuery->count();

        return Inertia::render('UserManagement', [
            'users'        => $users,
            'laboratories' => $laboratories,
            'roles'        => $roles,
            'pendingCount' => $pendingCount,
            'filters'      => [
                'search'  => $search,
                'role'    => $role,
                'perPage' => $perPage,
            ],
        ]);
    }


    public function store(Request $request)
    {
        $authUser = auth()->user();

        // Admin cuma bisa buat user di lab-nya
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            $request->merge(['laboratory_id' => $authUser->access_lab_id]);
        }

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'password'      => ['required', 'confirmed', Rules\Password::defaults()],
            'roles'         => 'required|array|min:1',
            'roles.*'       => 'string|exists:roles,name',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
        ]);

        $selectedRoles = $request->roles;

        if (in_array('admin', $selectedRoles) && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'Laboratorium wajib diisi untuk role Admin.']);
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'access_lab_id' => in_array('admin', $selectedRoles) ? $request->laboratory_id : null,
        ]);

        $user->syncRoles($selectedRoles);

        return redirect()->route('user-management.index')->with('message', 'User berhasil ditambahkan.');
    }


    public function update(Request $request, User $user)
    {
        $authUser = auth()->user();

        // Admin cuma bisa edit user di lab-nya
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            if ($user->access_lab_id !== $authUser->access_lab_id) {
                return back()->with('error', 'Anda hanya bisa mengelola user di lab Anda.');
            }
        }

        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password'      => ['nullable', 'confirmed', Rules\Password::defaults()],
            'roles'         => 'required|array|min:1',
            'roles.*'       => 'string|exists:roles,name',
            'laboratory_id' => 'nullable|exists:laboratorium,id',
            'nomor_induk'   => 'nullable|string|max:50',
            'nomor_anggota' => 'nullable|string|max:50',
            'jenis_kelamin' => 'nullable|string|in:laki-laki,perempuan',
            'alamat'        => 'nullable|string|max:500',
            'no_hp'         => 'nullable|string|max:15',
            'tempat_lahir'  => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
        ]);

        $selectedRoles = $request->roles;

        if (in_array('admin', $selectedRoles) && !$request->laboratory_id) {
            return back()->withErrors(['laboratory_id' => 'Laboratorium wajib diisi untuk role Admin.']);
        }

        $user->name  = $request->name;
        $user->email = $request->email;

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        $user->access_lab_id = in_array('admin', $selectedRoles) ? $request->laboratory_id : null;
        $user->save();

        $user->syncRoles($selectedRoles);

        // Update profile jika ada
        $profileData = $request->only(['nomor_induk', 'nomor_anggota', 'jenis_kelamin', 'alamat', 'no_hp', 'tempat_lahir', 'tanggal_lahir']);
        if (array_filter($profileData)) {
            if ($user->profile) {
                $user->profile->update($profileData);
            } else {
                $user->profile()->create($profileData);
            }
        }

        return redirect()->route('user-management.index')->with('message', 'User berhasil diperbarui.');
    }


    public function destroy(User $user)
    {
        $authUser = auth()->user();

        // Admin cuma bisa hapus user di lab-nya
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            if ($user->access_lab_id !== $authUser->access_lab_id) {
                return back()->with('error', 'Anda hanya bisa mengelola user di lab Anda.');
            }
        }

        if (auth()->id() === $user->id) {
            return back()->withErrors(['delete' => 'Anda tidak dapat menghapus akun sendiri.']);
        }

        if ($user->hasRole('superadmin') && !auth()->user()->hasRole('superadmin')) {
            return back()->withErrors(['delete' => 'Hanya superadmin yang dapat menghapus akun superadmin lain.']);
        }

        $user->delete();

        return redirect()->route('user-management.index')->with('message', 'User berhasil dihapus.');
    }

    public function approve(Request $request, User $user)
    {
        $authUser = auth()->user();

        // Admin cuma bisa approve user di lab-nya (user tanpa lab bisa diakses siapa saja)
        if ($authUser->hasRole('admin') && !$authUser->hasRole(['superadmin', 'kadep'])) {
            if ($user->access_lab_id && $user->access_lab_id !== $authUser->access_lab_id) {
                return back()->with('error', 'Anda hanya bisa mengelola user di lab Anda.');
            }
        }

        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        if ($user->roles()->count() > 0) {
            return back()->with('error', 'User ini sudah memiliki role.');
        }

        $user->assignRole($request->role);

        return redirect()->route('user-management.index')
            ->with('message', "User {$user->name} telah disetujui sebagai {$request->role}.");
    }
}
