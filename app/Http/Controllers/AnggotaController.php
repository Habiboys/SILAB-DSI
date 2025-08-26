<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
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

class AnggotaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $currentLab = $user->getCurrentLab();
    
        // If user has all_access, they can see all labs orhttp://127.0.0.1:8000/kepengurusan-lab filter by lab_id
        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } else {
            // Regular users can only see their own lab
            $lab_id = $user->laboratory_id;
        }
    
        $tahun_id = $request->input('tahun_id');
    
        // Get TahunKepengurusan data
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        } else {
            $tahunKepengurusan = collect(); // kosongkan jika lab belum dipilih
        }
    
        // If no tahun_id selected, use active year
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }
    
        // Ambil data kepengurusan lab berdasarkan lab_id & tahun_id (jika ada)
        $kepengurusanLabQuery = KepengurusanLab::where('laboratorium_id', $lab_id);
        
        if ($tahun_id) {
            $kepengurusanLabQuery->where('tahun_kepengurusan_id', $tahun_id);
        }
    
        $kepengurusanLab = $kepengurusanLabQuery->with(['tahunKepengurusan', 'laboratorium'])->get();
    
        // Ambil semua struktur (sekarang master data)
        $allStruktur = Struktur::orderBy('struktur')->get();
    
        // Ambil data anggota dengan user dan struktur
        $usersQuery = User::whereHas('profile') // Filter berdasarkan profile (anggota yang sudah lengkap)
            ->whereHas('struktur'); // Filter berdasarkan struktur (jabatan)
        
        // Jika ada tahun_id, filter berdasarkan kepengurusan di tahun tersebut (bisa aktif atau tidak)
        if ($tahun_id) {
            $usersQuery->whereHas('kepengurusan', function($query) use ($tahun_id, $lab_id) {
                $query->whereHas('kepengurusanLab', function($q) use ($tahun_id, $lab_id) {
                    $q->where('tahun_kepengurusan_id', $tahun_id)
                      ->where('laboratorium_id', $lab_id);
                });
            });
        } else {
            // Jika tidak ada tahun_id, ambil semua user yang memiliki kepengurusan di lab ini
            $usersQuery->whereHas('kepengurusan', function($query) use ($lab_id) {
                $query->whereHas('kepengurusanLab', function($q) use ($lab_id) {
                    $q->where('laboratorium_id', $lab_id);
                });
            });
        }
        
        $users = $usersQuery->with(['profile', 'struktur', 'kepengurusan.kepengurusanLab.tahunKepengurusan'])->get();
    
        // Ambil semua data kepengurusan lab dengan relasi tahunKepengurusan dan hitung jumlah anggota
        $allKepengurusanLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
            ->withCount('anggotaAktif')
            ->get();
    
        return Inertia::render('Anggota', [
            'anggota' => $users,
            'struktur' => $allStruktur,
            'kepengurusanlab' => $allKepengurusanLab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ],
        ]);
    }
 
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'nomor_induk' => 'required|string|max:50|unique:profile,nomor_induk',
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

        // Validasi jabatan tunggal per lab
        $struktur = Struktur::find($request->struktur_id);
        if ($struktur && $struktur->jabatan_tunggal) {
            $sudahAda = User::where('struktur_id', $struktur->id)
                ->where('laboratory_id', $request->lab_id)
                ->exists();
            if ($sudahAda) {
                return back()->withErrors(['message' => 'Jabatan ini hanya boleh diisi satu orang pada laboratorium ini.'])->withInput();
            }
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->nomor_induk), // Password menggunakan NIM/NIP
                'struktur_id' => $request->struktur_id,
                'laboratory_id' => $request->lab_id,
            ]);
    
            // Get the struktur and assign role based on tipe_jabatan
            $struktur = Struktur::find($request->struktur_id);
            if ($struktur->tipe_jabatan === 'dosen') {
                if ($struktur->jabatan_terkait === 'kalab') {
                    $user->assignRole('kalab');
                } else {
                    $user->assignRole('dosen');
                }
            } else {
                $user->assignRole('asisten');
            }
    
            // Handle profile photo
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
            
            // Otomatis tambahkan user ke kepengurusan aktif jika ada tahun_id
            if ($request->tahun_id) {
                $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $request->lab_id)
                    ->where('tahun_kepengurusan_id', $request->tahun_id)
                    ->first();
                
                if ($kepengurusanLab) {
                    KepengurusanUser::create([
                        'user_id' => $user->id,
                        'kepengurusan_lab_id' => $kepengurusanLab->id,
                        'struktur_id' => $request->struktur_id,
                        'is_active' => 1,
                        'tanggal_bergabung' => now(),
                    ]);
                }
            }
    
            DB::commit();
            return redirect()->back()->with('message', 'Anggota berhasil ditambahkan');
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
    ]);

    $struktur = Struktur::find($request->struktur_id);
    if ($struktur && $struktur->jabatan_tunggal) {
        $user = User::findOrFail($id);
        $sudahAda = User::where('struktur_id', $struktur->id)
            ->where('laboratory_id', $user->laboratory_id) // Check in same laboratory
            ->where('id', '!=', $id)
            ->exists();
        if ($sudahAda) {
            return back()->withErrors(['message' => 'Jabatan ini hanya boleh diisi satu orang pada laboratorium ini.'])->withInput();
        }
    }

    // Begin transaction
    \DB::beginTransaction();

    try {
        $user = User::findOrFail($id);
        $profile = $user->profile;

        // Update User
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'struktur_id' => $request->struktur_id,
        ]);

        // Update password jika NIM/NIP berubah
        if ($request->nomor_induk !== $profile->nomor_induk) {
            $user->update(['password' => Hash::make($request->nomor_induk)]);
        }

        // Update role sesuai jabatan terkait
        $struktur = Struktur::find($request->struktur_id);
        $user->syncRoles([]); // hapus role lama
        if ($struktur->tipe_jabatan === 'dosen') {
            if ($struktur->jabatan_terkait === 'kalab') {
                $user->assignRole('kalab');
            } else {
                $user->assignRole('dosen');
            }
        } else {
            $user->assignRole('asisten');
        }

        // Handle profile picture update
        if ($request->hasFile('foto_profile')) {
            // Hapus foto lama jika ada
            if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
                Storage::disk('public')->delete($profile->foto_profile);
            }

            // Simpan foto baru
            $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
            $profile->foto_profile = $fotoPath;
        }

        // Update Profile
        $profile->update([
            'nomor_induk' => $request->nomor_induk,
            'nomor_anggota' => $request->nomor_anggota,
            'jenis_kelamin' => $request->jenis_kelamin,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
        ]);

        \DB::commit();

        return redirect()->back()->with('message', 'Anggota berhasil diperbarui');
    } catch (\Exception $e) {
        \DB::rollback();
        return redirect()->back()->with('error', 'Gagal memperbarui anggota: ' . $e->getMessage());
    }
}

public function destroy($id)
{
    // Begin transaction
    \DB::beginTransaction();

    try {
        $user = User::findOrFail($id);
        
        // Ambil lab_id dan tahun_id dari request untuk menentukan kepengurusan mana yang dihapus
        $lab_id = request()->input('lab_id');
        $tahun_id = request()->input('tahun_id');
        
        if ($lab_id && $tahun_id) {
            // Hapus user dari kepengurusan tertentu saja
            $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->first();
            
            if ($kepengurusanLab) {
                // Hapus dari kepengurusan_user
                KepengurusanUser::where('user_id', $id)
                    ->where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->delete();
                
                \DB::commit();
                return redirect()->back()->with('message', 'Anggota berhasil dihapus dari kepengurusan ini');
            }
        }
        
        // Jika tidak ada lab_id atau tahun_id, hapus user total (fallback)
        $profile = $user->profile;
        
        // Hapus foto dari storage jika ada
        if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
            Storage::disk('public')->delete($profile->foto_profile);
        }
        
        // Hapus dari semua kepengurusan
        KepengurusanUser::where('user_id', $id)->delete();
        
        // Hapus profile dan user
        $profile->delete();
        $user->delete();
        
        \DB::commit();
        return redirect()->back()->with('message', 'Anggota berhasil dihapus total');
        
    } catch (\Exception $e) {
        \DB::rollback();
        return redirect()->back()->with('error', 'Gagal menghapus anggota: ' . $e->getMessage());
    }
}

    public function transferFromPrevious(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|uuid|exists:kepengurusan_lab,id',
            'user_ids' => 'required|array',
            'user_ids.*' => 'uuid|exists:users,id',
            'struktur_id' => 'required|uuid|exists:struktur,id',
        ]);

        $kepengurusanLab = KepengurusanLab::findOrFail($request->kepengurusan_lab_id);
        $struktur = Struktur::findOrFail($request->struktur_id);
        
        $transferredUsers = [];
        $errors = [];

        foreach ($request->user_ids as $userId) {
            try {
                // Cek apakah user sudah ada di kepengurusan ini
                $existingUser = KepengurusanUser::where('kepengurusan_lab_id', $request->kepengurusan_lab_id)
                    ->where('user_id', $userId)
                    ->first();

                if ($existingUser) {
                    $errors[] = "User sudah ada di kepengurusan ini";
                    continue;
                }

                // Buat entry baru di kepengurusan_user
                $kepengurusanUser = KepengurusanUser::create([
                    'kepengurusan_lab_id' => $request->kepengurusan_lab_id,
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
            return response()->json([
                'success' => true,
                'message' => count($transferredUsers) . ' anggota berhasil ditransfer',
                'transferred_users' => $transferredUsers,
                'errors' => $errors
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada anggota yang berhasil ditransfer',
                'errors' => $errors
            ], 400);
        }
    }

    public function getActiveMembersFromPrevious(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|uuid|exists:kepengurusan_lab,id',
        ]);

        $currentKepengurusan = KepengurusanLab::findOrFail($request->kepengurusan_lab_id);
        
        // Ambil semua kepengurusan lab yang sama (laboratorium_id sama) tapi bukan yang sekarang
        $previousKepengurusan = KepengurusanLab::where('laboratorium_id', $currentKepengurusan->laboratorium_id)
            ->where('id', '!=', $request->kepengurusan_lab_id)
            ->with(['anggotaAktif.user', 'anggotaAktif.struktur'])
            ->get();

        $activeMembers = [];
        foreach ($previousKepengurusan as $kepengurusan) {
            foreach ($kepengurusan->anggotaAktif as $anggota) {
                $activeMembers[] = [
                    'id' => $anggota->user->id,
                    'name' => $anggota->user->name,
                    'email' => $anggota->user->email,
                    'struktur' => $anggota->struktur->nama_struktur,
                    'kepengurusan_tahun' => $kepengurusan->tahunKepengurusan->tahun,
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