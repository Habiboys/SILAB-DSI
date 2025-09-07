<?php

namespace App\Http\Controllers;

use App\Models\Praktikan;
use App\Models\PraktikanPraktikum;
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
        
        // Get all praktikan for this praktikum through praktikan_praktikum
        $praktikanPraktikums = PraktikanPraktikum::with(['praktikan.user', 'kelas'])
            ->where('praktikum_id', $praktikumId)
            ->join('praktikan', 'praktikan_praktikum.praktikan_id', '=', 'praktikan.id')
            ->orderBy('praktikan.nama')
            ->select('praktikan_praktikum.*')
            ->get();

        // Get praktikan grouped by kelas
        $praktikanByKelas = [];
        foreach ($praktikum->kelas as $kelas) {
            $praktikanByKelas[$kelas->id] = $praktikanPraktikums->where('kelas_id', $kelas->id)->values();
        }

        // Get praktikan without kelas (belum diassign)
        $praktikanTanpaKelas = $praktikanPraktikums->whereNull('kelas_id')->values();
        
        // For backward compatibility, create praktikan collection
        $allPraktikan = $praktikanPraktikums->map(function($pp) {
            $praktikan = $pp->praktikan;
            $praktikan->kelas = $pp->kelas;
            $praktikan->status = $pp->status;
            return $praktikan;
        });
        
        // Get all users with praktikan role for search functionality
        $availableUsers = User::role('praktikan')
            ->with(['profile'])
            ->whereDoesntHave('praktikan.praktikanPraktikums', function($query) use ($praktikumId) {
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
        $existingPraktikan = Praktikan::where('user_id', $user->id)->first();
        
        if ($existingPraktikan) {
            // Check if already enrolled in this praktikum
            $existingEnrollment = PraktikanPraktikum::where('praktikan_id', $existingPraktikan->id)
                ->where('praktikum_id', $praktikumId)
                ->first();
                
            if ($existingEnrollment) {
                return back()->with('error', 'User ini sudah terdaftar sebagai praktikan di praktikum ini');
            }
        }

        // Assign praktikan role if not exists
        if (!$user->hasRole('praktikan')) {
            $user->assignRole('praktikan');
        }

        // Get NIM from profile or create placeholder
        $nim = $user->profile && $user->profile->nomor_induk 
            ? $user->profile->nomor_induk 
            : 'TEMP-' . substr($user->id, 0, 8); // Use part of user ID as temporary NIM

        if ($existingPraktikan) {
            // Use existing praktikan
            $praktikan = $existingPraktikan;
        } else {
            // Create new praktikan record
            $praktikan = Praktikan::create([
                'user_id' => $user->id,
                'nim' => $nim,
                'nama' => $user->name,
            ]);
        }

        // Create praktikan_praktikum record
        PraktikanPraktikum::create([
            'praktikan_id' => $praktikan->id,
            'praktikum_id' => $praktikumId,
            'kelas_id' => $request->kelas_id,
            'status' => 'aktif'
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

        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        // Validate that kelas belongs to the same praktikum
        $kelas = \App\Models\Kelas::where('id', $request->kelas_id)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikanPraktikum->update(['kelas_id' => $request->kelas_id]);

        return back()->with('message', 'Praktikan berhasil diassign ke kelas ' . $kelas->nama_kelas);
    }

    /**
     * Remove praktikan from kelas (unassign)
     */
    public function removeFromKelas($praktikumId, $praktikanId)
    {
        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikanPraktikum->update(['kelas_id' => null]);

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

        // Check if praktikan with this NIM already exists in this praktikum
        $existingPraktikan = Praktikan::where('nim', $request->nim)->first();
        
        if ($existingPraktikan) {
            // Check if already enrolled in this praktikum
            $existingEnrollment = PraktikanPraktikum::where('praktikan_id', $existingPraktikan->id)
                ->where('praktikum_id', $praktikumId)
                ->first();
                
            if ($existingEnrollment) {
                return redirect()->back()->with('error', 'Praktikan dengan NIM ini sudah ada di praktikum ini');
            }
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

        // Create or update praktikan record
        if ($existingPraktikan) {
            // Update existing praktikan data if needed
            $existingPraktikan->update([
                'nama' => $request->nama,
                'no_hp' => $request->no_hp ?? null,
                'user_id' => $userId,
            ]);
            
            $praktikan = $existingPraktikan;
        } else {
            // Create new praktikan record
            $praktikan = Praktikan::create([
                'nim' => $request->nim,
                'nama' => $request->nama,
                'no_hp' => $request->no_hp ?? null,
                'user_id' => $userId,
            ]);
        }

        // Create praktikan_praktikum record
        PraktikanPraktikum::create([
            'praktikan_id' => $praktikan->id,
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
        \Log::info('Import request received', [
            'praktikum_id' => $praktikumId,
            'request_data' => $request->all(),
            'has_file' => $request->hasFile('file'),
            'file_name' => $request->file('file')?->getClientOriginalName(),
            'file_size' => $request->file('file')?->getSize()
        ]);

        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:2048'
        ]);

        try {
            \Log::info('Starting Excel import');
            Excel::import(new PraktikanImport($praktikumId), $request->file('file'));
            \Log::info('Excel import completed successfully');
            return redirect()->back()->with('success', 'Data praktikan berhasil diimport');
        } catch (\Exception $e) {
            \Log::error('Excel import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
        
        // Ambil praktikan yang sedang login di praktikum ini
        $praktikanPraktikum = PraktikanPraktikum::with(['praktikan', 'praktikum.kepengurusanLab.laboratorium', 'kelas'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->firstOrFail();
        
        // Ambil tugas dari praktikum ini, tapi filter berdasarkan kelas
        $tugasPraktikums = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->where(function($query) use ($praktikanPraktikum) {
                // Tugas untuk semua kelas (kelas_id = null) atau kelas yang sama
                $query->whereNull('kelas_id')
                      ->orWhere('kelas_id', $praktikanPraktikum->kelas_id);
            })
            ->get();
        
        // Ambil riwayat pengumpulan untuk praktikum ini (hanya untuk praktikan ini)
        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikan'
            ])
            ->where('praktikan_id', $praktikanPraktikum->praktikan_id)
            ->orderBy('submitted_at', 'desc')
            ->get();
        
        // Tambahkan perhitungan nilai dengan bonus
        $riwayatPengumpulan->each(function ($riwayat) {
            $nilaiDasar = $riwayat->nilai ?? 0;
            
            // Ambil nilai tambahan
            $nilaiTambahans = \App\Models\NilaiTambahan::where('tugas_praktikum_id', $riwayat->tugas_praktikum_id)
                ->where('praktikan_id', $riwayat->praktikan_id)
                ->get();
            
            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            
            // Hitung total nilai dengan bonus (max 100)
            // Nilai dasar sudah termasuk nilai rubrik, jadi tidak perlu ditambah lagi
            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);
            
            // Set properties (bukan database fields)
            $riwayat->setAttribute('total_nilai_tambahan', $totalNilaiTambahan);
            $riwayat->setAttribute('total_nilai_with_bonus', $totalNilaiWithBonus);
        });
        
        return Inertia::render('Praktikan/PraktikumTugas', [
            'praktikan' => $praktikanPraktikum,
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
        $praktikanPraktikums = PraktikanPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'aktif')
            ->get();
        
        // Coba dengan query yang lebih sederhana
        $praktikanIds = $praktikanPraktikums->pluck('praktikan_id')->unique();
        $riwayatPengumpulan = PengumpulanTugas::query()
            ->whereIn('praktikan_id', $praktikanIds)
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
            // Hitung total nilai dengan bonus
            $nilaiDasar = $riwayat->nilai ?? 0;
            
            // Ambil nilai tambahan
            $nilaiTambahans = \App\Models\NilaiTambahan::where('tugas_praktikum_id', $riwayat->tugas_praktikum_id)
                ->where('praktikan_id', $riwayat->praktikan_id)
                ->get();
            
            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            
            // Hitung total nilai dengan bonus (max 100)
            // Nilai dasar sudah termasuk nilai rubrik, jadi tidak perlu ditambah lagi
            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);
            
            // Debug: Log perhitungan nilai
            \Log::info('Perhitungan nilai riwayatTugas', [
                'praktikan_id' => $riwayat->praktikan_id,
                'tugas_id' => $riwayat->tugas_praktikum_id,
                'nilai_dasar' => $nilaiDasar,
                'total_nilai_tambahan' => $totalNilaiTambahan,
                'total_nilai_with_bonus' => $totalNilaiWithBonus
            ]);
            
            $riwayatData[] = [
                'id' => $riwayat->id,
                'tugas_praktikum_id' => $riwayat->tugas_praktikum_id,
                'praktikan_id' => $riwayat->praktikan_id,
                'file_pengumpulan' => $riwayat->file_pengumpulan,
                'catatan' => $riwayat->catatan,
                'feedback' => $riwayat->feedback,
                'nilai' => $riwayat->nilai,
                'total_nilai_tambahan' => $totalNilaiTambahan,
                'total_nilai_with_bonus' => $totalNilaiWithBonus,
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
            'praktikans' => $praktikanPraktikums
        ]);
    }

    /**
     * Tampilkan halaman daftar tugas untuk praktikan
     */
    public function daftarTugas()
    {
        $user = Auth::user();
        
        // Ambil semua praktikum yang diikuti dengan kelas
        $praktikanPraktikums = PraktikanPraktikum::with(['praktikum.kepengurusanLab.laboratorium', 'kelas'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'aktif')
            ->get();
        
        // Ambil semua tugas dari praktikum yang diikuti, tapi filter berdasarkan kelas
        $tugasPraktikums = collect();
        foreach ($praktikanPraktikums as $pp) {
            $tugas = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
                ->where('praktikum_id', $pp->praktikum_id)
                ->where('status', 'aktif')
                ->where(function($query) use ($pp) {
                    // Tugas untuk semua kelas (kelas_id = null) atau kelas yang sama
                    $query->whereNull('kelas_id')
                          ->orWhere('kelas_id', $pp->kelas_id);
                })
                ->get();
            
            $tugasPraktikums = $tugasPraktikums->merge($tugas);
        }
        
        // Remove duplicates berdasarkan ID tugas
        $tugasPraktikums = $tugasPraktikums->unique('id')->values();
        
        // Ambil riwayat pengumpulan tugas untuk status (hanya untuk praktikan ini)
        $praktikanIds = $praktikanPraktikums->pluck('praktikan_id')->unique();
        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikan'
            ])
            ->whereIn('praktikan_id', $praktikanIds)
            ->orderBy('submitted_at', 'desc')
            ->get();
        
        // Tambahkan perhitungan nilai dengan bonus
        $riwayatPengumpulan->each(function ($riwayat) {
            $nilaiDasar = $riwayat->nilai ?? 0;
            
            // Ambil nilai tambahan
            $nilaiTambahans = \App\Models\NilaiTambahan::where('tugas_praktikum_id', $riwayat->tugas_praktikum_id)
                ->where('praktikan_id', $riwayat->praktikan_id)
                ->get();
            
            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            
            // Hitung total nilai dengan bonus (max 100)
            // Nilai dasar sudah termasuk nilai rubrik, jadi tidak perlu ditambah lagi
            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);
            
            // Set properties (bukan database fields)
            $riwayat->setAttribute('total_nilai_tambahan', $totalNilaiTambahan);
            $riwayat->setAttribute('total_nilai_with_bonus', $totalNilaiWithBonus);
        });
        
        return Inertia::render('Praktikan/DaftarTugas', [
            'praktikans' => $praktikanPraktikums,
            'tugasPraktikums' => $tugasPraktikums,
            'riwayatPengumpulan' => $riwayatPengumpulan
        ]);
    }

    /**
     * Update praktikan data
     */
    public function update(Request $request, $praktikumId, $praktikanId)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'kelas_id' => 'required|exists:kelas,id',
            'password' => 'nullable|string|min:6'
        ]);

        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikan = $praktikanPraktikum->praktikan;
        $user = $praktikan->user;

        // Update praktikan data
        $praktikan->update([
            'nama' => $request->nama,
            'no_hp' => $request->no_hp
        ]);

        // Update kelas assignment
        $praktikanPraktikum->update([
            'kelas_id' => $request->kelas_id
        ]);

        // Update password if provided
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        return redirect()->back()->with('success', 'Data praktikan berhasil diperbarui');
    }

    /**
     * Remove praktikan from specific praktikum
     */
    public function removeFromPraktikum($praktikumId, $praktikanId)
    {
        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();
        
        $praktikanPraktikum->delete();
        
        return redirect()->back()->with('success', 'Praktikan berhasil dihapus dari praktikum');
    }

    /**
     * Remove praktikan from praktikum
     */
    public function destroy($id)
    {
        $praktikan = Praktikan::findOrFail($id);
        
        // Delete all praktikan_praktikum records first
        $praktikan->praktikanPraktikums()->delete();
        
        // If user was created specifically for this praktikan, delete the user
        // But don't delete if user has other roles (like aslab)
        if ($praktikan->user && $praktikan->user->praktikan && $praktikan->user->praktikan->praktikanPraktikums()->count() <= 1) {
            // Check if user has other roles besides praktikan
            $userRoles = $praktikan->user->roles->pluck('name')->toArray();
            $hasOtherRoles = count($userRoles) > 1 || !in_array('praktikan', $userRoles);
            
            if (!$hasOtherRoles) {
                $praktikan->user->delete();
            }
        }
        
        $praktikan->delete();
        
        return redirect()->back()->with('success', 'Praktikan berhasil dihapus');
    }

    /**
     * Get praktikan data for API
     */
    public function getPraktikan($praktikumId)
    {
        $praktikanPraktikums = PraktikanPraktikum::with(['praktikan.user', 'praktikan.labs'])
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->get();

        $praktikan = $praktikanPraktikums->map(function($pp) {
            $praktikan = $pp->praktikan;
            $praktikan->lab = $praktikan->getLabByPraktikum($pp->praktikum_id);
            return $praktikan;
        });

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
