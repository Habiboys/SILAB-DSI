<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profile;
use App\Models\Struktur;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class AnggotaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    $lab_id = $request->input('lab_id');
    $tahun_id = $request->input('tahun_id');

    // Ambil data kepengurusan lab berdasarkan lab_id & tahun_id (jika ada)
    $kepengurusanLabQuery = KepengurusanLab::where('laboratorium_id', $lab_id);
    
    if ($tahun_id) {
        $kepengurusanLabQuery->where('tahun_kepengurusan_id', $tahun_id);
    }

    $kepengurusanLab = $kepengurusanLabQuery->with(['tahunKepengurusan', 'laboratorium'])->get();

    // Ambil semua struktur yang terkait dengan kepengurusanLab
    $strukturIds = Struktur::whereIn('kepengurusan_lab_id', $kepengurusanLab->pluck('id'))->get();

    // Ambil data anggota dengan user dan struktur secara langsung
    $users = User::whereIn('struktur_id', $strukturIds->pluck('id'))
        ->with(['profile', 'struktur.kepengurusanLab'])
        ->get();

    // Ambil semua data kepengurusan lab dengan relasi tahunKepengurusan
    $allKepengurusanLab = KepengurusanLab::with('tahunKepengurusan')->get();

    return Inertia::render('Anggota', [
        'anggota' => $users,
        'struktur' => $strukturIds, // Mengirim hanya ID struktur (jika diperlukan full data, bisa diubah)
        'kepengurusanlab' => $allKepengurusanLab,
    ]);
}


 
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'nomor_induk' => 'required|string|max:50|unique:profile',
            'nomor_anggota' => 'nullable|string|max:50',
            'jenis_kelamin' => 'required|in:laki-laki,perempuan',
            'foto_profile' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'alamat' => 'nullable|string',
            'no_hp' => 'nullable|string|max:15',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'struktur_id' => 'required|exists:struktur,id',
            'lab_id' => 'required|exists:kepengurusan_lab,id',
        ]);

        // Begin transaction
        \DB::beginTransaction();
        
        try {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'struktur_id' => $request->struktur_id,
            ]);

            // Handle profile photo
            $fotoPath = null;
            if ($request->hasFile('foto_profile')) {
                $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
            }

            // Create profile
            Profile::create([
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

            \DB::commit();
            
            return redirect()->back()->with('message', 'Anggota berhasil ditambahkan');
        } catch (\Exception $e) {
            \DB::rollback();
            
            // If photo was uploaded, delete it
            if (isset($fotoPath) && Storage::disk('public')->exists($fotoPath)) {
                Storage::disk('public')->delete($fotoPath);
            }
            
            return redirect()->back()->with('error', 'Gagal menambahkan anggota: ' . $e->getMessage());
        }
    }
    public function update(Request $request, $id)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $id,
        'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
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

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
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
        $profile = $user->profile;

        // Hapus foto dari storage jika ada
        if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
            Storage::disk('public')->delete($profile->foto_profile);
        }

        // Hapus profile dan user
        $profile->delete();
        $user->delete();

        \DB::commit();

        return redirect()->back()->with('message', 'Anggota berhasil dihapus');
    } catch (\Exception $e) {
        \DB::rollback();
        return redirect()->back()->with('error', 'Gagal menghapus anggota: ' . $e->getMessage());
    }
}


   
 
}