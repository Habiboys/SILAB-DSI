<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Praktikan;
use App\Models\Struktur;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use App\Models\KepengurusanUser;
use App\Services\PermissionService;

class AnggotaController extends Controller
{


    public function index(Request $request)
    {
        $user = auth()->user();
        $currentLab = $user->getCurrentLab();

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } elseif (isset($currentLab['laboratorium'])) {
            $lab_id = $currentLab['laboratorium']->id;
        } else {

            $lab_id = $user->access_lab_id;
        }

        $tahun_id = $request->input('tahun_id');

        $kepengurusanLabId = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanLabObj = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanLabObj) {
                $kepengurusanLabId = $kepengurusanLabObj->id;
                $lab_id = $kepengurusanLabObj->laboratorium_id;
                $tahun_id = $kepengurusanLabObj->tahun_kepengurusan_id;
            }
        }

        else {

            if (!$tahun_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanLabObj = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->first();
                if ($kepengurusanLabObj) {
                    $kepengurusanLabId = $kepengurusanLabObj->id;
                }
            }
        }

        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        } else {
            $tahunKepengurusan = collect();
        }

        $kepengurusanLab = collect();
        if ($kepengurusanLabId) {
            $kepengurusanLab = KepengurusanLab::where('id', $kepengurusanLabId)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->get();
        } elseif ($lab_id) {
            $kepengurusanLabQuery = KepengurusanLab::where('laboratorium_id', $lab_id);
            if ($tahun_id) {
                $kepengurusanLabQuery->where('tahun_kepengurusan_id', $tahun_id);
            }
            $kepengurusanLab = $kepengurusanLabQuery->with(['tahunKepengurusan', 'laboratorium'])->get();
        }

        $allStruktur = Struktur::orderBy('struktur')->get();

        $usersQuery = User::whereHas('profile')
            ->whereHas('kepengurusan');

        if ($kepengurusanLabId) {
            $usersQuery->whereHas('kepengurusan', function($query) use ($kepengurusanLabId) {
                $query->where('kepengurusan_lab_id', $kepengurusanLabId);
            });
        } elseif ($tahun_id && $lab_id) {
            $usersQuery->whereHas('kepengurusan', function($query) use ($tahun_id, $lab_id) {
                $query->whereHas('kepengurusanLab', function($q) use ($tahun_id, $lab_id) {
                    $q->where('tahun_kepengurusan_id', $tahun_id)
                      ->where('laboratorium_id', $lab_id);
                });
            });
        } elseif ($lab_id) {
            $usersQuery->whereHas('kepengurusan', function($query) use ($lab_id) {
                $query->whereHas('kepengurusanLab', function($q) use ($lab_id) {
                    $q->where('laboratorium_id', $lab_id);
                });
            });
        }

        if ($search = $request->input('search')) {
            $usersQuery->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhereHas('profile', function($q) use ($search) {
                          $q->where('nomor_induk', 'like', "%{$search}%")
                            ->orWhere('nomor_anggota', 'like', "%{$search}%");
                      });
            });
        }

        $sortBy  = $request->input('sort', 'name');
        $sortDir = $request->input('dir', 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['name', 'nomor_induk', 'nomor_anggota', 'struktur'];
        if (in_array($sortBy, ['nomor_induk', 'nomor_anggota'])) {
            $usersQuery->leftJoin('profile', 'profile.user_id', '=', 'users.id')
                       ->orderBy("profile.{$sortBy}", $sortDir)
                       ->select('users.*');
        } elseif ($sortBy === 'struktur') {
            $usersQuery
                ->leftJoin('kepengurusan_user as ku_sort', function ($join) use ($kepengurusanLabId) {
                    $join->on('ku_sort.user_id', '=', 'users.id');
                    if ($kepengurusanLabId) {
                        $join->where('ku_sort.kepengurusan_lab_id', '=', $kepengurusanLabId);
                    }
                })
                ->leftJoin('struktur as s_sort', 's_sort.id', '=', 'ku_sort.struktur_id')
                ->orderBy('s_sort.struktur', $sortDir)
                ->select('users.*');
        } else {
            $usersQuery->orderBy('users.name', $sortDir);
        }

        $perPage = $request->input('perPage', 10);
        $users = $usersQuery->with(['profile', 'kepengurusan.kepengurusanLab.tahunKepengurusan', 'kepengurusan.struktur'])
            ->paginate($perPage)
            ->withQueryString();

        $allKepengurusanLabQuery = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->withCount('anggotaAktif');

        if ($lab_id) {
            $allKepengurusanLabQuery->where('laboratorium_id', $lab_id);
        }

        $allKepengurusanLab = $allKepengurusanLabQuery->get();

        $anggotaData = $users->through(function($user) use ($kepengurusanLabId) {
            $kepengurusanFilter = $user->kepengurusan->filter(function($k) use ($kepengurusanLabId) {
                return $kepengurusanLabId ? $k->kepengurusan_lab_id == $kepengurusanLabId : true;
            });
            $kepengurusanAktif = $kepengurusanFilter->first() ?? $user->kepengurusanAktif->first();
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile' => $user->profile,
                'struktur' => $kepengurusanAktif ? $kepengurusanAktif->struktur : null,
                'struktur_id' => $kepengurusanAktif ? $kepengurusanAktif->struktur_id : null,
                'kepengurusan' => $user->kepengurusan,
                'laboratory_id' => $user->access_lab_id,
            ];
        });

        return Inertia::render('Anggota', [
            'anggota' => $anggotaData,
            'struktur' => $allStruktur,
            'kepengurusanlab' => $allKepengurusanLab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'kepengurusan_lab_id' => $kepengurusanLabId,
                'search' => $request->input('search'),
                'perPage' => $perPage,
                'sort' => $sortBy,
                'dir' => $sortDir,
            ],
        ]);
    }

    public function store(Request $request)
    {

        $nim = trim($request->nomor_induk);

        $targetLabId = $request->lab_id;
        $targetTahunId = $request->tahun_id;

        if (!$targetTahunId) {
            $targetTahunId = KepengurusanLab::where('laboratorium_id', $targetLabId)
                ->where('is_active', true)
                ->value('tahun_kepengurusan_id');
        }

        $targetKepengurusanLab = null;
        if ($targetLabId && $targetTahunId) {
            $targetKepengurusanLab = KepengurusanLab::where('laboratorium_id', $targetLabId)
                ->where('tahun_kepengurusan_id', $targetTahunId)
                ->first();
        }

        $existingPraktikan = Praktikan::where('nim', $nim)->first();

        $existingProfile = Profile::where('nomor_induk', $nim)->first();

        $existingUserByEmail = User::where('email', 'LIKE', '%' . $nim . '%')->first();

        $existingUser = null;
        if ($existingPraktikan) {

            $existingUser = User::find($existingPraktikan->user_id);
        } elseif ($existingProfile) {

            $existingUser = User::find($existingProfile->user_id);
        } elseif ($existingUserByEmail) {

            $existingUser = $existingUserByEmail;
        }

        if ($existingUser && $targetKepengurusanLab) {

            $alreadyInSameLabAndPeriod = KepengurusanUser::where('user_id', $existingUser->id)
                ->where('kepengurusan_lab_id', $targetKepengurusanLab->id)
                ->exists();

            if ($alreadyInSameLabAndPeriod) {
                return redirect()->back()->withErrors([
                    'nomor_induk' => "NIM {$nim} sudah tergabung pada kepengurusan lab dan tahun yang sama."
                ])->withInput();
            }
        }

        $allPraktikan = Praktikan::where('nim', 'LIKE', '%' . $nim . '%')->get();
        $allProfiles = Profile::where('nomor_induk', 'LIKE', '%' . $nim . '%')->get();

        \Log::info('Checking existing user', [
            'input_nim' => $request->nomor_induk,
            'trimmed_nim' => $nim,
            'existingPraktikan' => $existingPraktikan ? $existingPraktikan->id : null,
            'existingPraktikanNIM' => $existingPraktikan ? $existingPraktikan->nim : null,
            'existingProfile' => $existingProfile ? $existingProfile->id : null,
            'existingProfileNIM' => $existingProfile ? $existingProfile->nomor_induk : null,
            'existingUserByEmail' => $existingUserByEmail ? $existingUserByEmail->id : null,
            'existingUserByEmailEmail' => $existingUserByEmail ? $existingUserByEmail->email : null,
            'existingUser' => $existingUser ? $existingUser->id : null,
            'existingUserEmail' => $existingUser ? $existingUser->email : null,
            'allPraktikanWithSimilarNIM' => $allPraktikan->pluck('nim', 'id')->toArray(),
            'allProfilesWithSimilarNIM' => $allProfiles->pluck('nomor_induk', 'id')->toArray(),
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'nomor_induk' => 'required|string|max:50',
            'nomor_anggota' => 'nullable|string|max:50',
            'jenis_kelamin' => 'required|in:laki-laki,perempuan',
            'foto_profile' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'alamat' => 'nullable|string',
            'no_hp' => 'nullable|string|max:15',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'struktur_id' => 'required|exists:struktur,id',
            'lab_id' => 'required|exists:laboratorium,id',
            'tahun_id' => 'nullable|exists:tahun_kepengurusan,id',
        ]);

        if ($existingUser) {
            $request->validate([
                'email' => 'required|string|email|max:255|unique:users,email,' . $existingUser->id,
            ]);
        } else {
            $request->validate([
                'email' => 'required|string|email|max:255|unique:users',
            ]);
        }

        $struktur = Struktur::find($request->struktur_id);
        if ($struktur && $struktur->jabatan_tunggal) {

            $sudahAda = KepengurusanUser::where('struktur_id', $struktur->id)
                ->whereHas('kepengurusanLab', function($query) use ($request) {
                    $query->where('laboratorium_id', $request->lab_id)
                          ->where('tahun_kepengurusan_id', $request->tahun_id);
                })
                ->exists();
            if ($sudahAda) {
                return back()->withErrors(['message' => 'Jabatan ini hanya boleh diisi satu orang pada periode kepengurusan ini.'])->withInput();
            }
        }

        DB::beginTransaction();
        try {

            if ($existingUser) {

                $user = $existingUser;

                $user->update([
                    'name' => $request->name,
                    'email' => $request->email,
                    'laboratory_id' => $request->lab_id,
                ]);

                $profile = $user->profile;

                if ($profile) {

                    $profile->update([
                        'nomor_induk' => $request->nomor_induk,
                        'nomor_anggota' => $request->nomor_anggota,
                        'jenis_kelamin' => $request->jenis_kelamin,
                        'alamat' => $request->alamat,
                        'no_hp' => $request->no_hp,
                        'tempat_lahir' => $request->tempat_lahir,
                        'tanggal_lahir' => $request->tanggal_lahir,
                    ]);

                    if ($request->hasFile('foto_profile')) {

                        if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
                            Storage::disk('public')->delete($profile->foto_profile);
                        }

                        $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
                        $profile->foto_profile = $fotoPath;
                        $profile->save();
                    }
                } else {

                    $fotoPath = null;
                    if ($request->hasFile('foto_profile')) {
                        $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
                    }

                    $profile = Profile::create([
                        'user_id' => $user->id,
                        'nomor_induk' => $request->nomor_induk,
                        'nomor_anggota' => $request->nomor_anggota,
                        'jenis_kelamin' => $request->jenis_kelamin,
                        'foto_profile' => $fotoPath,
                        'alamat' => $request->alamat,
                        'no_hp' => $request->no_hp,
                        'tempat_lahir' => $request->tempat_lahir,
                        'tanggal_lahir' => $request->tanggal_lahir,
                    ]);
                }

                \Log::info('Updating existing user', [
                    'nim' => $request->nomor_induk,
                    'old_email' => $existingUser->email,
                    'new_email' => $request->email,
                    'user_id' => $existingUser->id,
                    'profile_exists' => $profile ? 'yes' : 'no',
                    'profile_id' => $profile ? $profile->id : null,
                ]);

                $existingPraktikan = Praktikan::where('user_id', $user->id)->first();
                if ($existingPraktikan) {
                    $existingPraktikan->update([
                        'nama' => $request->name,
                        'no_hp' => $request->no_hp,
                    ]);

                    \Log::info('Updated existing praktikan data', [
                        'praktikan_id' => $existingPraktikan->id,
                        'nama' => $request->name,
                        'no_hp' => $request->no_hp,
                    ]);
                }

                $struktur = Struktur::with('defaultRole')->find($request->struktur_id);
                $currentRoles = $user->roles->pluck('name')->toArray();
                $hasPraktikanRole = in_array('praktikan', $currentRoles);

                $user->syncRoles([]);

                if ($struktur && $struktur->defaultRole) {
                    $user->assignRole($struktur->defaultRole->name);
                } else {

                    \Log::warning('Struktur tidak memiliki defaultRole, fallback ke asisten', ['struktur_id' => $request->struktur_id]);
                    $user->assignRole('asisten');
                }

                if ($hasPraktikanRole) {
                    $user->assignRole('praktikan');
                }

                $jabatan = $struktur->struktur;
                $permissions = PermissionService::getPermissionsForStruktur($jabatan);

                if (!empty($permissions)) {
                    $user->givePermissionTo($permissions);
                    \Log::info('Auto-assigned permissions for existing user', [
                        'user_id' => $user->id,
                        'jabatan' => $jabatan,
                        'permissions' => $permissions,
                    ]);
                }

            } else {

                \Log::info('No existing user found, creating new user', [
                    'nim' => $request->nomor_induk,
                    'email' => $request->email,
                ]);

                $plainPassword = \Illuminate\Support\Str::random(12);

                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($plainPassword),
                    'laboratory_id' => $request->lab_id,
                    'must_change_password' => true,
                ]);

                $user->notify(new \App\Notifications\AkunBaruNotification($plainPassword, $request->email));

                $struktur = Struktur::with('defaultRole')->find($request->struktur_id);

                if ($struktur && $struktur->defaultRole) {
                    $user->assignRole($struktur->defaultRole->name);
                } else {
                    $user->assignRole('asisten');
                }

                $jabatan = $struktur->struktur;
                $permissions = PermissionService::getPermissionsForStruktur($jabatan);

                if (!empty($permissions)) {
                    $user->givePermissionTo($permissions);
                    \Log::info('Auto-assigned permissions for new user', [
                        'user_id' => $user->id,
                        'jabatan' => $jabatan,
                        'permissions' => $permissions,
                    ]);
                }

                $fotoPath = null;
                if ($request->hasFile('foto_profile')) {
                    $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
                }

                $profile = Profile::create([
                    'user_id' => $user->id,
                    'nomor_induk' => $request->nomor_induk,
                    'nomor_anggota' => $request->nomor_anggota,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'foto_profile' => $fotoPath,
                    'alamat' => $request->alamat,
                    'no_hp' => $request->no_hp,
                    'tempat_lahir' => $request->tempat_lahir,
                    'tanggal_lahir' => $request->tanggal_lahir,
                ]);

                \Log::info('Creating new user', [
                    'nim' => $request->nomor_induk,
                    'email' => $request->email,
                    'user_id' => $user->id
                ]);

                $existingPraktikan = Praktikan::where('nim', $request->nomor_induk)->first();
                if ($existingPraktikan) {
                    $existingPraktikan->update([
                        'nama' => $request->name,
                        'no_hp' => $request->no_hp,
                        'user_id' => $user->id,
                    ]);

                    \Log::info('Updated existing praktikan data for new user', [
                        'praktikan_id' => $existingPraktikan->id,
                        'nama' => $request->name,
                        'no_hp' => $request->no_hp,
                        'user_id' => $user->id,
                    ]);
                }
            }

            if ($request->tahun_id) {
                $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $request->lab_id)
                    ->where('tahun_kepengurusan_id', $request->tahun_id)
                    ->first();

                if ($kepengurusanLab) {

                    $existingKepengurusan = KepengurusanUser::where('user_id', $user->id)
                        ->where('kepengurusan_lab_id', $kepengurusanLab->id)
                        ->first();

                    if (!$existingKepengurusan) {
                        KepengurusanUser::create([
                            'user_id' => $user->id,
                            'kepengurusan_lab_id' => $kepengurusanLab->id,
                            'struktur_id' => $request->struktur_id,
                            'is_active' => 1,
                            'tanggal_bergabung' => now(),
                        ]);
                    } else {

                        $existingKepengurusan->update([
                            'struktur_id' => $request->struktur_id,
                            'is_active' => 1,
                        ]);
                    }
                }
            }

            DB::commit();

            if ($existingUser) {
                return redirect()->back()->with('message', 'Anggota berhasil ditambahkan (menggunakan data existing dengan NIM: ' . $request->nomor_induk . ')');
            } else {
                return redirect()->back()->with('message', 'Anggota baru berhasil ditambahkan');
            }
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Gagal menambahkan anggota: ' . $e->getMessage());
        }
    }
    public function update(Request $request, $id)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $id,
        'nomor_induk' => 'required|string|max:50|unique:profile,nomor_induk,' . $id . ',user_id',
        'nomor_anggota' => 'nullable|string|max:50',
        'jenis_kelamin' => 'required|in:laki-laki,perempuan',
        'foto_profile' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        'alamat' => 'nullable|string',
        'no_hp' => 'nullable|string|max:15',
        'tempat_lahir' => 'nullable|string|max:100',
        'tanggal_lahir' => 'nullable|date',
        'struktur_id' => 'required|exists:struktur,id',
        'password' => 'nullable|string|min:6',
    ]);

    $struktur = Struktur::find($request->struktur_id);
    if ($struktur && $struktur->jabatan_tunggal) {
        $user = User::findOrFail($id);

        $currentKepengurusanLabId = $request->kepengurusan_lab_id;

        if (!$currentKepengurusanLabId) {
            $currentKepengurusanUser = KepengurusanUser::where('user_id', $id)->orderBy('created_at', 'desc')->first();
            if ($currentKepengurusanUser) {
                $currentKepengurusanLabId = $currentKepengurusanUser->kepengurusan_lab_id;
            }
        }

        if (!$currentKepengurusanLabId) {
            return back()->withErrors(['message' => 'User tidak terdaftar di kepengurusan manapun.'])->withInput();
        }

        $sudahAda = KepengurusanUser::where('struktur_id', $struktur->id)
            ->where('user_id', '!=', $id)
            ->where('kepengurusan_lab_id', $currentKepengurusanLabId)
            ->exists();
        if ($sudahAda) {
            return back()->withErrors(['message' => 'Jabatan ini hanya boleh diisi satu orang pada laboratorium ini.'])->withInput();
        }
    }

    \DB::beginTransaction();

    try {
        $user = User::findOrFail($id);
        $profile = $user->profile;

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        if ($request->nomor_induk !== $profile->nomor_induk) {
            $user->update(['password' => Hash::make($request->nomor_induk)]);
        } elseif ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        $currentRoles = $user->roles->pluck('name')->toArray();
        $hasPraktikanRole = in_array('praktikan', $currentRoles);

        $user->syncRoles([]);

        $struktur = Struktur::with('defaultRole')->find($request->struktur_id);
        if ($struktur && $struktur->defaultRole) {
            $user->assignRole($struktur->defaultRole->name);
        } else {
            $user->assignRole('asisten');
        }

        if ($hasPraktikanRole) {
            $user->assignRole('praktikan');
        }

        if ($request->hasFile('foto_profile')) {

            if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
                Storage::disk('public')->delete($profile->foto_profile);
            }

            $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
            $profile->foto_profile = $fotoPath;
        }

        $profile->update([
            'nomor_induk' => $request->nomor_induk,
            'nomor_anggota' => $request->nomor_anggota,
            'jenis_kelamin' => $request->jenis_kelamin,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
        ]);

        $kepengurusanUser = KepengurusanUser::where('user_id', $id)->first();
        if ($kepengurusanUser) {
            $kepengurusanUser->update([
                'struktur_id' => $request->struktur_id,
            ]);
        }

        \DB::commit();

        return redirect()->back()->with('message', 'Anggota berhasil diperbarui');
    } catch (\Exception $e) {
        \DB::rollback();
        return redirect()->back()->with('error', 'Gagal memperbarui anggota: ' . $e->getMessage());
    }
}

public function destroy($id)
{

    \DB::beginTransaction();

    try {
        $user = User::findOrFail($id);

        $kepengurusan_lab_id = request()->input('kepengurusan_lab_id');

        $lab_id = request()->input('lab_id');
        $tahun_id = request()->input('tahun_id');

        if ($kepengurusan_lab_id) {
            $deleted = KepengurusanUser::where('user_id', $id)
                ->where('kepengurusan_lab_id', $kepengurusan_lab_id)
                ->delete();

            if ($deleted > 0) {
                DB::commit();
                return redirect()->back()->with('message', 'Anggota berhasil dihapus dari kepengurusan ini');
            }

            DB::rollback();
            return redirect()->back()->with('error', 'Data kepengurusan anggota pada periode ini tidak ditemukan.');
        }

        if ($lab_id && $tahun_id) {

            $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->first();

            if ($kepengurusanLab) {

                KepengurusanUser::where('user_id', $id)
                    ->where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->delete();

                DB::commit();
                return redirect()->back()->with('message', 'Anggota berhasil dihapus dari kepengurusan ini');
            }

            DB::rollback();
            return redirect()->back()->with('error', 'Kepengurusan yang dipilih tidak ditemukan.');
        }

        DB::rollback();
        return redirect()->back()->with('error', 'Parameter kepengurusan tidak lengkap. Penghapusan dibatalkan untuk mencegah terhapus dari periode lain.');

    } catch (\Exception $e) {
        DB::rollback();
        return redirect()->back()->with('error', 'Gagal menghapus anggota: ' . $e->getMessage());
    }
}

    public function transferFromPrevious(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|uuid|exists:kepengurusan_lab,id',
            'active_kepengurusan_id' => 'required|uuid|exists:kepengurusan_lab,id',
            'user_ids' => 'required|array',
            'user_ids.*' => 'uuid|exists:users,id',
            'struktur_id' => 'required|uuid|exists:struktur,id',
        ]);

        $kepengurusanLab = KepengurusanLab::findOrFail($request->active_kepengurusan_id);
        $struktur = Struktur::findOrFail($request->struktur_id);

        $transferredUsers = [];
        $errors = [];

        foreach ($request->user_ids as $userId) {
            try {

                $existingUser = KepengurusanUser::where('kepengurusan_lab_id', $request->active_kepengurusan_id)
                    ->where('user_id', $userId)
                    ->first();

                if ($existingUser) {
                    $errors[] = "User sudah ada di kepengurusan ini";
                    continue;
                }

                $kepengurusanUser = KepengurusanUser::create([
                    'kepengurusan_lab_id' => $request->active_kepengurusan_id,
                    'user_id' => $userId,
                    'struktur_id' => $request->struktur_id,
                    'is_active' => true,
                    'tanggal_bergabung' => now(),
                    'catatan' => 'Transfer dari kepengurusan sebelumnya',
                ]);

                $transferredUsers[] = $kepengurusanUser;
            } catch (\Exception $e) {
                $errors[] = "Gagal mentransfer user: " . $e->getMessage();
            }
        }

        if (count($transferredUsers) > 0) {
            $msg = count($transferredUsers) . ' anggota berhasil ditransfer.';
            if (count($errors) > 0) {
                $msg .= ' Beberapa gagal: ' . implode(', ', $errors);
            }
            return redirect()->back()->with('success', $msg);
        } else {
            $errorMsg = 'Tidak ada anggota yang berhasil ditransfer.';
            if (count($errors) > 0) {
                $errorMsg .= ' Alasan: ' . implode(', ', array_unique($errors));
            }
            return redirect()->back()->with('error', $errorMsg);
        }
    }

    public function getActiveMembersFromPrevious(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|uuid|exists:kepengurusan_lab,id',
        ]);

        $kepengurusan = KepengurusanLab::with(['anggotaAktif.user', 'anggotaAktif.struktur', 'tahunKepengurusan'])
            ->findOrFail($request->kepengurusan_lab_id);

        $activeMembers = [];
        foreach ($kepengurusan->anggotaAktif as $anggota) {
            if ($anggota->user) {
                $activeMembers[] = [
                    'id' => $anggota->user->id,
                    'name' => $anggota->user->name,
                    'email' => $anggota->user->email,
                    'struktur' => $anggota->struktur ? $anggota->struktur->nama_struktur : '-',
                    'kepengurusan_tahun' => $kepengurusan->tahunKepengurusan ? $kepengurusan->tahunKepengurusan->tahun : '-',
                    'tanggal_bergabung' => $anggota->tanggal_bergabung,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'active_members' => $activeMembers
        ]);
    }

}
