<?php

namespace App\Http\Controllers;

use App\Models\Praktikan;
use App\Models\User;
use App\Models\Lab;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\PraktikanImport;
use App\Exports\PraktikanTemplateExport;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\TugasPraktikum;
use App\Models\PengumpulanTugas;

class PraktikanController extends Controller
{
    /**
     * Display a listing of praktikan for a specific praktikum
     */
    public function index(Request $request, $praktikumId)
    {
        $praktikum = Praktikum::with([
            'kepengurusanLab.laboratorium',
            'kelas' => function($query) {
                $query->where('status', 'aktif')->orderBy('nama_kelas');
            }
        ])->findOrFail($praktikumId);
        
        // Get all praktikan for this praktikum
        $allPraktikan = Praktikan::with(['user', 'kelas'])
            ->where('praktikum_id', $praktikumId)
            ->orderBy('nama')
            ->get();

        // Get praktikan grouped by kelas
        $praktikanByKelas = [];
        foreach ($praktikum->kelas as $kelas) {
            $praktikanByKelas[$kelas->id] = $allPraktikan->where('kelas_id', $kelas->id)->values();
        }

        // Get praktikan without kelas (belum diassign)
        $praktikanTanpaKelas = $allPraktikan->whereNull('kelas_id')->values();
        
        // Get all users with praktikan role for search functionality
        $availableUsers = User::role('praktikan')
            ->with(['profile'])
            ->whereDoesntHave('praktikan', function($query) use ($praktikumId) {
                $query->where('praktikum_id', $praktikumId);
            })
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'nama' => $user->name,
                    'nim' => $user->profile ? $user->profile->nomor_induk : null,
                    'email' => $user->email
                ];
            });
 
        return Inertia::render('Praktikan/Index', [
            'praktikum' => $praktikum,
            'praktikan' => $allPraktikan, // For backward compatibility
            'praktikanByKelas' => $praktikanByKelas,
            'praktikanTanpaKelas' => $praktikanTanpaKelas,
            'availableUsers' => $availableUsers,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium
        ]);
    }

    /**
     * Assign existing user as praktikan to this praktikum
     */
    public function addExistingUser(Request $request, $praktikumId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        $praktikum = Praktikum::findOrFail($praktikumId);
        $user = User::with('profile')->findOrFail($request->user_id);

        // Check if user is already praktikan in this praktikum
        $existingPraktikan = Praktikan::where('praktikum_id', $praktikumId)
            ->where('user_id', $user->id)
            ->first();
            
        if ($existingPraktikan) {
            return back()->with('error', 'User ini sudah terdaftar sebagai praktikan di praktikum ini');
        }

        // Assign praktikan role if not exists
        if (!$user->hasRole('praktikan')) {
            $user->assignRole('praktikan');
        }

        // Get NIM from profile or create placeholder
        $nim = $user->profile && $user->profile->nomor_induk 
            ? $user->profile->nomor_induk 
            : 'TEMP-' . substr($user->id, 0, 8); // Use part of user ID as temporary NIM

        // Create praktikan record
        Praktikan::create([
            'user_id' => $user->id,
            'praktikum_id' => $praktikumId,
            'nim' => $nim,
            'nama' => $user->name,
            'kelas_id' => $request->kelas_id
        ]);

        return back()->with('message', 'Praktikan berhasil ditambahkan ke praktikum');
    }

    /**
     * Assign praktikan to a specific kelas
     */
    public function assignToKelas(Request $request, $praktikumId, $praktikanId)
    {
        $request->validate([
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        $praktikan = Praktikan::where('id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        // Validate that kelas belongs to the same praktikum
        $kelas = \App\Models\Kelas::where('id', $request->kelas_id)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikan->update(['kelas_id' => $request->kelas_id]);

        return back()->with('message', 'Praktikan berhasil diassign ke kelas ' . $kelas->nama_kelas);
    }

    /**
     * Remove praktikan from kelas (unassign)
     */
    public function removeFromKelas($praktikumId, $praktikanId)
    {
        $praktikan = Praktikan::where('id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikan->update(['kelas_id' => null]);

        return back()->with('message', 'Praktikan berhasil dikeluarkan dari kelas');
    }

    /**
     * Store a newly created praktikan
     */
    public function store(Request $request, $praktikumId)
    {
        $request->validate([
            'nim' => 'required|string|max:20',
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'kelas_id' => 'required|exists:kelas,id',
            'is_existing_user' => 'boolean', // Flag untuk praktikan existing
        ]);

        // Check if user is already praktikan in this praktikum (based on NIM)
        $existingPraktikan = Praktikan::where('praktikum_id', $praktikumId)
            ->where('nim', $request->nim)
            ->first();
            
        if ($existingPraktikan) {
            return redirect()->back()->with('error', 'Praktikan dengan NIM ini sudah ada di praktikum ini');
        }

        $userId = null;
        
        if ($request->is_existing_user) {
            // Jika praktikan existing, cari user berdasarkan NIM
            $existingUser = User::whereHas('profile', function($query) use ($request) {
                $query->where('nomor_induk', $request->nim);
            })->first();
            
            if ($existingUser) {
                $userId = $existingUser->id;
                
                // Check if user already has praktikan role
                if (!$existingUser->hasRole('praktikan')) {
                    $existingUser->assignRole('praktikan');
                }
            } else {
                return redirect()->back()->with('error', 'User dengan NIM tersebut tidak ditemukan');
            }
        } else {
            // Jika praktikan baru, buat user baru
            $existingUser = User::whereHas('profile', function($query) use ($request) {
                $query->where('nomor_induk', $request->nim);
            })->first();
            
            if ($existingUser) {
                $userId = $existingUser->id;
                
                // Check if user already has praktikan role
                if (!$existingUser->hasRole('praktikan')) {
                    $existingUser->assignRole('praktikan');
                }
            } else {
                // Create new user if doesn't exist
                $email = $this->generateEmail($request->nim, $request->nama);
                
                // Ensure email is unique
                $counter = 1;
                $originalEmail = $email;
                while (User::where('email', $email)->exists()) {
                    $email = $originalEmail . '.' . $counter;
                    $counter++;
                }
                
                $user = User::create([
                    'name' => $request->nama,
                    'email' => $email,
                    'password' => Hash::make($request->nim), // Default password is NIM
                ]);
                
                // Assign praktikan role
                $user->assignRole('praktikan');
                
                $userId = $user->id;
            }
        }

        // Create praktikan record
        $praktikan = Praktikan::create([
            'nim' => $request->nim,
            'nama' => $request->nama,
            'no_hp' => $request->no_hp ?? null, // Pastikan null jika kosong
            'user_id' => $userId,
            'praktikum_id' => $praktikumId,
            'kelas_id' => $request->kelas_id,
            'status' => 'aktif'
        ]);

        $message = $request->is_existing_user 
            ? 'Praktikan existing berhasil ditambahkan ke praktikum' 
            : 'Praktikan baru berhasil ditambahkan';
            
        return redirect()->back()->with('success', $message);
    }

    /**
     * Import praktikan from Excel
     */
    public function import(Request $request, $praktikumId)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:2048'
        ]);

        try {
            Excel::import(new PraktikanImport($praktikumId), $request->file('file'));
            return redirect()->back()->with('success', 'Data praktikan berhasil diimport');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal import data: ' . $e->getMessage());
        }
    }

    /**
     * Download template Excel untuk import praktikan
     */
    public function downloadTemplate()
    {
        return Excel::download(new PraktikanTemplateExport(), 'template_praktikan.xlsx');
    }

    /**
     * Tampilkan halaman tugas praktikum untuk praktikan
     */
    public function praktikumTugas($praktikumId)
    {
        $user = Auth::user();
        
        // Ambil praktikum yang dipilih
        $praktikan = Praktikan::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('user_id', $user->id)
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->firstOrFail();
        
        // Ambil semua tugas dari praktikum ini
        $tugasPraktikums = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->get();
        
        // Ambil riwayat pengumpulan untuk praktikum ini
        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikan'
            ])
            ->where('praktikan_id', $praktikan->id)
            ->orderBy('submitted_at', 'desc')
            ->get();
        
        return Inertia::render('Praktikan/PraktikumTugas', [
            'praktikan' => $praktikan,
            'tugasPraktikums' => $tugasPraktikums,
            'riwayatPengumpulan' => $riwayatPengumpulan
        ]);
    }

    /**
     * Tampilkan halaman riwayat tugas untuk praktikan
     */
    public function riwayatTugas()
    {
        $user = Auth::user();
        
        // Ambil semua praktikum yang diikuti
        $praktikans = Praktikan::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('user_id', $user->id)
            ->where('status', 'aktif')
            ->get();
        
        // Coba dengan query yang lebih sederhana
        $riwayatPengumpulan = PengumpulanTugas::query()
            ->whereIn('praktikan_id', $praktikans->pluck('id'))
            ->orderBy('submitted_at', 'desc')
            ->get();

        // Load relasi secara manual setelah query
        $riwayatPengumpulan->load([
            'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
            'praktikan'
        ]);
        
        // Debug: Cek apakah data benar-benar ada di database
        if ($riwayatPengumpulan->count() > 0) {
            $first = $riwayatPengumpulan->first();
            \Log::info('Manual Check:', [
                'tugas_praktikum_id' => $first->tugas_praktikum_id,
                'tugasPraktikum_exists' => isset($first->tugasPraktikum),
                'tugasPraktikum_id_from_relation' => $first->tugasPraktikum?->id ?? 'NULL',
                'praktikum_exists' => isset($first->tugasPraktikum?->praktikum),
                'mata_kuliah' => $first->tugasPraktikum?->praktikum?->mata_kuliah ?? 'NULL'
            ]);
        }
        
        // Debug: Log data untuk memastikan relasi ter-load dengan benar
        \Log::info('RiwayatPengumpulan Data:', [
            'count' => $riwayatPengumpulan->count(),
            'first_item' => $riwayatPengumpulan->first() ? [
                'id' => $riwayatPengumpulan->first()->id,
                'tugas_praktikum_id' => $riwayatPengumpulan->first()->tugas_praktikum_id,
                'tugasPraktikum' => $riwayatPengumpulan->first()->tugasPraktikum ? [
                    'id' => $riwayatPengumpulan->first()->tugasPraktikum->id,
                    'judul_tugas' => $riwayatPengumpulan->first()->tugasPraktikum->judul_tugas,
                    'praktikum_id' => $riwayatPengumpulan->first()->tugasPraktikum->praktikum_id,
                    'praktikum' => $riwayatPengumpulan->first()->tugasPraktikum->praktikum ? [
                        'id' => $riwayatPengumpulan->first()->tugasPraktikum->praktikum->id,
                        'mata_kuliah' => $riwayatPengumpulan->first()->tugasPraktikum->praktikum->mata_kuliah,
                    ] : 'NULL'
                ] : 'NULL'
            ] : 'NULL'
        ]);

        // Debug: Cek data yang akan dikirim ke Inertia
        \Log::info('Data yang akan dikirim ke Inertia:', [
            'riwayat_count' => $riwayatPengumpulan->count(),
            'riwayat_sample' => $riwayatPengumpulan->first() ? [
                'id' => $riwayatPengumpulan->first()->id,
                'tugasPraktikum' => $riwayatPengumpulan->first()->tugasPraktikum ? 'EXISTS' : 'NULL',
                'praktikan' => $riwayatPengumpulan->first()->praktikan ? 'EXISTS' : 'NULL'
            ] : 'NULL'
        ]);
        

        
        // Debug: Cek data yang akan dikirim ke Inertia
        \Log::info('Data yang akan dikirim ke Inertia:', [
            'riwayat_count' => $riwayatPengumpulan->count(),
            'riwayat_sample' => $riwayatPengumpulan->first() ? [
                'id' => $riwayatPengumpulan->first()->id,
                'tugasPraktikum' => $riwayatPengumpulan->first()->tugasPraktikum ? 'EXISTS' : 'NULL',
                'praktikan' => $riwayatPengumpulan->first()->praktikan ? 'EXISTS' : 'NULL'
            ] : 'NULL'
        ]);

        // SOLUSI: Buat data yang pasti bisa di-serialize
        $riwayatData = [];
        foreach ($riwayatPengumpulan as $riwayat) {
            $riwayatData[] = [
                'id' => $riwayat->id,
                'tugas_praktikum_id' => $riwayat->tugas_praktikum_id,
                'praktikan_id' => $riwayat->praktikan_id,
                'file_pengumpulan' => $riwayat->file_pengumpulan,
                'catatan' => $riwayat->catatan,
                'feedback' => $riwayat->feedback,
                'nilai' => $riwayat->nilai,
                'status' => $riwayat->status,
                'submitted_at' => $riwayat->submitted_at,
                'dinilai_at' => $riwayat->dinilai_at,
                'created_at' => $riwayat->created_at,
                'updated_at' => $riwayat->updated_at,
                'tugasPraktikum' => $riwayat->tugasPraktikum ? [
                    'id' => $riwayat->tugasPraktikum->id,
                    'praktikum_id' => $riwayat->tugasPraktikum->praktikum_id,
                    'judul_tugas' => $riwayat->tugasPraktikum->judul_tugas,
                    'deskripsi' => $riwayat->tugasPraktikum->deskripsi,
                    'file_tugas' => $riwayat->tugasPraktikum->file_tugas,
                    'deadline' => $riwayat->tugasPraktikum->deadline,
                    'status' => $riwayat->tugasPraktikum->status,
                    'praktikum' => $riwayat->tugasPraktikum->praktikum ? [
                        'id' => $riwayat->tugasPraktikum->praktikum->id,
                        'mata_kuliah' => $riwayat->tugasPraktikum->praktikum->mata_kuliah,
                        'kepengurusan_lab_id' => $riwayat->tugasPraktikum->praktikum->kepengurusan_lab_id,
                    ] : null
                ] : null,
                'praktikan' => $riwayat->praktikan ? [
                    'id' => $riwayat->praktikan->id,
                    'nim' => $riwayat->praktikan->nim,
                    'nama' => $riwayat->praktikan->nama,
                    'no_hp' => $riwayat->praktikan->no_hp,
                    'user_id' => $riwayat->praktikan->user_id,
                    'praktikum_id' => $riwayat->praktikan->praktikum_id,
                    'status' => $riwayat->praktikan->status,
                ] : null
            ];
        }

        return Inertia::render('Praktikan/RiwayatTugas', [
            'riwayatPengumpulan' => $riwayatData,
            'praktikans' => $praktikans
        ]);
    }

    /**
     * Tampilkan halaman daftar tugas untuk praktikan
     */
    public function daftarTugas()
    {
        $user = Auth::user();
        
        // Ambil semua praktikum yang diikuti
        $praktikans = Praktikan::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('user_id', $user->id)
            ->where('status', 'aktif')
            ->get();
        
        // Ambil semua tugas dari praktikum yang diikuti
        $tugasPraktikums = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->whereIn('praktikum_id', $praktikans->pluck('praktikum_id'))
            ->where('status', 'aktif')
            ->get();
        
        // Ambil riwayat pengumpulan tugas untuk status
        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikan'
            ])
            ->whereIn('praktikan_id', $praktikans->pluck('id'))
            ->orderBy('submitted_at', 'desc')
            ->get();
        
        return Inertia::render('Praktikan/DaftarTugas', [
            'praktikans' => $praktikans,
            'tugasPraktikums' => $tugasPraktikums,
            'riwayatPengumpulan' => $riwayatPengumpulan
        ]);
    }

    /**
     * Update praktikan status
     */
    public function updateStatus(Request $request, $id)
    {
        $praktikan = Praktikan::findOrFail($id);
        $praktikan->update(['status' => $request->status]);
        
        return redirect()->back()->with('success', 'Status praktikan berhasil diubah');
    }

    /**
     * Remove praktikan from praktikum
     */
    public function destroy($id)
    {
        $praktikan = Praktikan::findOrFail($id);
        
        // If user was created specifically for this praktikum, delete the user
        if ($praktikan->user && $praktikan->user->praktikan()->count() <= 1) {
            $praktikan->user->delete();
        }
        
        $praktikan->delete();
        
        return redirect()->back()->with('success', 'Praktikan berhasil dihapus');
    }

    /**
     * Get praktikan data for API
     */
    public function getPraktikan($praktikumId)
    {
        $praktikan = Praktikan::with(['user', 'lab'])
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->get();

        return response()->json($praktikan);
    }

    /**
     * Generate email berdasarkan NIM dan nama
     */
    private function generateEmail($nim, $nama)
    {
        // Ambil kata pertama dari nama (nama awal)
        $nama_awal = strtok(strtolower($nama), ' ');
        // Bersihkan karakter khusus dan spasi
        $nama_awal = preg_replace('/[^a-zA-Z0-9]/', '', $nama_awal);
        
        return $nim . '_' . $nama_awal . '@student.unand.ac.id';
    }
}
