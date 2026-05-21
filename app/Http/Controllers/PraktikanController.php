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
use App\Models\Kelas;
use App\Models\PertemuanPraktikum;
use App\Support\KelasScopeResolver;

class PraktikanController extends Controller
{

    public function index(Request $request, $praktikumId)
    {
        $praktikum = Praktikum::with([
            'kepengurusanLab.laboratorium',
            'kelas' => function($query) {
                $query->where('status', 'aktif')->orderBy('nama_kelas');
            }
        ])->findOrFail($praktikumId);

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        $praktikanPraktikumsQuery = PraktikanPraktikum::with(['praktikan.user', 'kelas'])
            ->where('praktikum_id', $praktikumId)
            ->join('praktikan', 'praktikan_praktikum.praktikan_id', '=', 'praktikan.id')
            ->leftJoin('profile', 'praktikan.user_id', '=', 'profile.user_id')
            ->orderBy('profile.nomor_induk')
            ->select('praktikan_praktikum.*');

        if (!empty($kelasScopeIds)) {
            $praktikanPraktikumsQuery->whereIn('praktikan_praktikum.kelas_id', $kelasScopeIds);
        }

        $praktikanPraktikums = $praktikanPraktikumsQuery->get();

        $praktikanByKelas = [];
        foreach ($praktikum->kelas as $kelas) {
            $praktikanByKelas[$kelas->id] = $praktikanPraktikums->where('kelas_id', $kelas->id)->values();
        }

        $praktikanTanpaKelas = $praktikanPraktikums->whereNull('kelas_id')->values();

        $allPraktikan = $praktikanPraktikums->map(function($pp) {
            $praktikan = $pp->praktikan;
            $praktikan->kelas = $pp->kelas;
            $praktikan->status = $pp->status;
            return $praktikan;
        });

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

        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $praktikum->kelas->firstWhere('id', $requestedKelasId);

            if (!empty($kelasScopeIds)) {
                $praktikanByKelas[$requestedKelasId] = $praktikanPraktikums
                    ->whereIn('kelas_id', $kelasScopeIds)
                    ->values();
            }
        }

        return Inertia::render('Praktikan/Index', [
            'praktikum' => $praktikum,
            'praktikan' => $allPraktikan,
            'praktikanByKelas' => $praktikanByKelas,
            'praktikanTanpaKelas' => $praktikanTanpaKelas,
            'availableUsers' => $availableUsers,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium,
            'filters' => $request->only(['kelas_id', 'context_kelas_id']),
            'classContext' => $classContext,
        ]);
    }


    private function validateEnrollmentKelas(string $kelasId): ?string
    {
        $hasSubKelas = \App\Models\Kelas::where('parent_kelas_id', $kelasId)->exists();
        if ($hasSubKelas) {
            return 'Kelas ini memiliki sub-kelas. Pilih sub-kelas yang sesuai untuk menambahkan praktikan.';
        }
        return null;
    }


    public function addExistingUser(Request $request, $praktikumId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        $praktikum = Praktikum::findOrFail($praktikumId);
        $user = User::with('profile')->findOrFail($request->user_id);

        $existingPraktikan = Praktikan::where('user_id', $user->id)->first();

        if ($existingPraktikan) {

            $existingEnrollment = PraktikanPraktikum::where('praktikan_id', $existingPraktikan->id)
                ->where('praktikum_id', $praktikumId)
                ->first();

            if ($existingEnrollment) {
                return back()->with('error', 'User ini sudah terdaftar sebagai praktikan di praktikum ini');
            }
        }

        if (!$user->hasRole('praktikan')) {
            $user->assignRole('praktikan');
        }

        $nim = $user->profile && $user->profile->nomor_induk
            ? $user->profile->nomor_induk
            : 'TEMP-' . substr($user->id, 0, 8);

        if ($existingPraktikan) {

            $praktikan = $existingPraktikan;
        } else {

            $praktikan = Praktikan::create([
                'user_id' => $user->id,
                'nim' => $nim,
                'nama' => $user->name,
            ]);
        }

        PraktikanPraktikum::create([
            'praktikan_id' => $praktikan->id,
            'praktikum_id' => $praktikumId,
            'kelas_id' => $request->kelas_id,
            'status' => 'aktif'
        ]);

        return back()->with('message', 'Praktikan berhasil ditambahkan ke praktikum');
    }


    public function assignToKelas(Request $request, $praktikumId, $praktikanId)
    {
        $request->validate([
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $kelas = \App\Models\Kelas::where('id', $request->kelas_id)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikanPraktikum->update(['kelas_id' => $request->kelas_id]);

        return back()->with('message', 'Praktikan berhasil diassign ke kelas ' . $kelas->nama_kelas);
    }


    public function removeFromKelas($praktikumId, $praktikanId)
    {
        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikanPraktikum->delete();

        return back()->with('message', 'Praktikan berhasil dikeluarkan dari kelas');
    }


    public function pindahKelasMassal(Request $request, $praktikumId)
    {
        if ($request->input('target_kelas_id') === '') {
            $request->merge(['target_kelas_id' => null]);
        }
        $validated = $request->validate([
            'praktikan_ids' => 'required|array|min:1',
            'praktikan_ids.*' => 'exists:praktikan_praktikum,id',
            'target_kelas_id' => 'nullable|exists:kelas,id',
        ]);

        $targetKelasId = $request->filled('target_kelas_id') ? $request->target_kelas_id : null;

        if ($targetKelasId) {
            $kelas = \App\Models\Kelas::where('id', $targetKelasId)->where('praktikum_id', $praktikumId)->firstOrFail();
        }

        $updated = PraktikanPraktikum::whereIn('id', $validated['praktikan_ids'])
            ->where('praktikum_id', $praktikumId)
            ->update(['kelas_id' => $targetKelasId]);

        $message = $targetKelasId
            ? $updated . ' praktikan berhasil dipindahkan ke kelas ' . $kelas->nama_kelas . '.'
            : $updated . ' praktikan berhasil dikeluarkan dari kelas (tanpa kelas).';

        return back()->with('message', $message);
    }


    public function store(Request $request, $praktikumId)
    {
        $request->validate([
            'nim' => 'required|string|max:20',
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'kelas_id' => 'required|exists:kelas,id',
            'is_existing_user' => 'boolean',
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        $existingPraktikan = Praktikan::where('nim', $request->nim)->first();

        if ($existingPraktikan) {

            $existingEnrollment = PraktikanPraktikum::where('praktikan_id', $existingPraktikan->id)
                ->where('praktikum_id', $praktikumId)
                ->first();

            if ($existingEnrollment) {
                return redirect()->back()->with('error', 'Praktikan dengan NIM ini sudah ada di praktikum ini');
            }
        }

        $userId = null;

        if ($request->is_existing_user) {

            $existingUser = User::whereHas('profile', function($query) use ($request) {
                $query->where('nomor_induk', $request->nim);
            })->first();

            if ($existingUser) {
                $userId = $existingUser->id;

                if (!$existingUser->hasRole('praktikan')) {
                    $existingUser->assignRole('praktikan');
                }
            } else {
                return redirect()->back()->with('error', 'User dengan NIM tersebut tidak ditemukan');
            }
        } else {

            $existingUser = User::whereHas('profile', function($query) use ($request) {
                $query->where('nomor_induk', $request->nim);
            })->first();

            if ($existingUser) {
                $userId = $existingUser->id;

                if (!$existingUser->hasRole('praktikan')) {
                    $existingUser->assignRole('praktikan');
                }
            } else {

                $email = $this->generateEmail($request->nim, $request->nama);

                $counter = 1;
                $originalEmail = $email;
                while (User::where('email', $email)->exists()) {
                    $email = $originalEmail . '.' . $counter;
                    $counter++;
                }

                $user = User::create([
                    'name' => $request->nama,
                    'email' => $email,
                    'password' => Hash::make($request->nim),
                ]);

                $user->assignRole('praktikan');

                $userId = $user->id;
            }
        }

        if ($existingPraktikan) {

            $existingPraktikan->update([
                'nama' => $request->nama,
                'no_hp' => $request->no_hp ?? null,
                'user_id' => $userId,
            ]);

            $praktikan = $existingPraktikan;
        } else {

            $praktikan = Praktikan::create([
                'nim' => $request->nim,
                'nama' => $request->nama,
                'no_hp' => $request->no_hp ?? null,
                'user_id' => $userId,
            ]);
        }

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

            throw \Illuminate\Validation\ValidationException::withMessages([
                'file' => ['Gagal import: ' . $e->getMessage()],
            ]);
        }
    }


    public function downloadTemplate()
    {
        return Excel::download(new PraktikanTemplateExport(), 'template_praktikan.xlsx');
    }


    public function praktikumTugas($praktikumId)
    {
        $user = Auth::user();

        $praktikanPraktikum = PraktikanPraktikum::with(['praktikan', 'praktikum.kepengurusanLab.laboratorium', 'kelas'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->firstOrFail();

        $tugasPraktikums = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->where(function($query) use ($praktikanPraktikum) {

                $query->whereNull('kelas_id')
                      ->orWhere('kelas_id', $praktikanPraktikum->kelas_id);
            })
            ->get();

        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikanPraktikum.praktikan',
                'praktikan'
            ])
            ->where('praktikan_praktikum_id', $praktikanPraktikum->id)
            ->orderBy('submitted_at', 'desc')
            ->get();

        $riwayatPengumpulan->each(function ($riwayat) {
            $nilaiDasar = $riwayat->nilai ?? 0;

            $nilaiTambahans = \App\Models\NilaiTambahan::where('pengumpulan_tugas_id', $riwayat->id)

                ->get();

            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');

            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);

            $riwayat->setAttribute('total_nilai_tambahan', $totalNilaiTambahan);
            $riwayat->setAttribute('total_nilai_with_bonus', $totalNilaiWithBonus);
        });

        return Inertia::render('Praktikan/PraktikumTugas', [
            'praktikan' => $praktikanPraktikum,
            'tugasPraktikums' => $tugasPraktikums,
            'riwayatPengumpulan' => $riwayatPengumpulan
        ]);
    }


    public function riwayatTugas()
    {
        $user = Auth::user();

        $praktikanPraktikums = PraktikanPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'aktif')
            ->get();

        $allPpIds = PraktikanPraktikum::whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->pluck('id');

        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum',
                'tugasPraktikum.kelas',
                'tugasPraktikum.pertemuan.kelas'
            ])
            ->whereIn('praktikan_praktikum_id', $allPpIds)
            ->get();

        $countByPraktikum = [];
        foreach ($riwayatPengumpulan as $riwayat) {
            $effectivePraktikumId =
                $riwayat->tugasPraktikum?->praktikum?->id
                ?? $riwayat->tugasPraktikum?->praktikum_id
                ?? $riwayat->tugasPraktikum?->kelas?->praktikum_id
                ?? $riwayat->tugasPraktikum?->pertemuan?->kelas?->praktikum_id;

            if ($effectivePraktikumId) {
                $key = (string) $effectivePraktikumId;
                $countByPraktikum[$key] = ($countByPraktikum[$key] ?? 0) + 1;
            }
        }

        $praktikumRiwayatList = $praktikanPraktikums->map(function ($pp) use ($countByPraktikum) {
            $praktikum = $pp->praktikum;
            $count = $countByPraktikum[(string) $praktikum->id] ?? 0;

            return [
                'id' => $praktikum->id,
                'mata_kuliah' => $praktikum->mata_kuliah,
                'periode' => $praktikum->periode,
                'riwayat_count' => $count,
            ];
        })->values();

        return Inertia::render('Praktikan/RiwayatTugasIndex', [
            'praktikumRiwayatList' => $praktikumRiwayatList,
        ]);
    }


    public function riwayatTugasByPraktikum($praktikumId)
    {
        $user = Auth::user();

        $praktikanPraktikum = PraktikanPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->firstOrFail();

        $allPpIds = PraktikanPraktikum::whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('praktikum_id', $praktikumId)
            ->pluck('id');

        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'tugasPraktikum.kelas.praktikum',
                'tugasPraktikum.pertemuan.kelas.praktikum',
                'praktikanPraktikum.praktikan',
                'praktikan'
            ])
            ->whereIn('praktikan_praktikum_id', $allPpIds)
            ->orderBy('submitted_at', 'desc')
            ->get();

        $riwayatData = [];
        foreach ($riwayatPengumpulan as $riwayat) {
            $nilaiDasar = $riwayat->nilai ?? 0;

            $nilaiTambahans = \App\Models\NilaiTambahan::where('pengumpulan_tugas_id', $riwayat->id)->get();
            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);

            $riwayatData[] = [
                'id' => $riwayat->id,
                'tugas_praktikum_id' => $riwayat->tugas_praktikum_id,
                'praktikan_id' => $riwayat->praktikanPraktikum?->praktikan_id ?? $riwayat->praktikan?->id,
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
                    'praktikum_id' => $riwayat->tugasPraktikum->kelas?->praktikum_id ?? $riwayat->tugasPraktikum->pertemuan?->kelas?->praktikum_id ?? $riwayat->tugasPraktikum->praktikum?->id,
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
            ];
        }

        return Inertia::render('Praktikan/RiwayatTugas', [
            'riwayatPengumpulan' => $riwayatData,
            'praktikum' => [
                'id' => $praktikanPraktikum->praktikum->id,
                'mata_kuliah' => $praktikanPraktikum->praktikum->mata_kuliah,
                'periode' => $praktikanPraktikum->praktikum->periode,
            ],
        ]);
    }


    public function detailRiwayatTugas($pengumpulanId)
    {
        $user = Auth::user();

        $riwayat = PengumpulanTugas::with([
            'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
            'praktikanPraktikum.praktikan',
            'praktikan'
        ])->findOrFail($pengumpulanId);

        if (!$riwayat->praktikan || $riwayat->praktikan->user_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }

        $nilaiDasar = $riwayat->nilai ?? 0;

        $nilaiTambahans = \App\Models\NilaiTambahan::where('pengumpulan_tugas_id', $riwayat->id)->get();
        $totalNilaiTambahan = $nilaiTambahans->sum('nilai');
        $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);

        $detailData = [
            'id' => $riwayat->id,
            'tugas_praktikum_id' => $riwayat->tugas_praktikum_id,
            'praktikan_id' => $riwayat->praktikanPraktikum?->praktikan_id ?? $riwayat->praktikan?->id,
            'file_pengumpulan' => $riwayat->file_pengumpulan,
            'catatan' => $riwayat->catatan,
            'feedback' => $riwayat->feedback,
            'nilai' => $riwayat->nilai,
            'total_nilai_tambahan' => $totalNilaiTambahan,
            'detail_nilai_tambahan' => $nilaiTambahans,
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
            ] : null
        ];

        return Inertia::render('Praktikan/RiwayatTugasDetail', [
            'riwayat' => $detailData
        ]);
    }


    public function daftarTugas()
    {
        $user = Auth::user();

        $praktikanPraktikums = PraktikanPraktikum::with(['praktikum.kepengurusanLab.laboratorium', 'kelas'])
            ->whereHas('praktikan', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'aktif')
            ->get();

        $tugasPraktikums = collect();
        foreach ($praktikanPraktikums as $pp) {
            $kelasIds = Kelas::where('praktikum_id', $pp->praktikum_id)->pluck('id');
            $pertemuanIds = PertemuanPraktikum::whereIn('kelas_id', $kelasIds)->pluck('id');
            $parentKelasId = Kelas::find($pp->kelas_id)?->parent_kelas_id;

            $tugas = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium', 'kelas', 'pertemuan'])
                ->where('status', 'aktif')
                ->where(function ($query) use ($pp, $parentKelasId, $pertemuanIds) {
                    $query->where(function ($q) use ($pertemuanIds) {
                        $q->whereNull('kelas_id')->whereIn('pertemuan_id', $pertemuanIds);
                    })
                    ->orWhere('kelas_id', $pp->kelas_id)
                    ->when($parentKelasId, fn ($q) => $q->orWhere('kelas_id', $parentKelasId));
                })
                ->get();

            $tugasPraktikums = $tugasPraktikums->merge($tugas);
        }

        $tugasPraktikums = $tugasPraktikums->unique('id')->values();

        $allPpIdsDaftar = PraktikanPraktikum::whereHas('praktikan', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->pluck('id');
        $riwayatPengumpulan = PengumpulanTugas::with([
                'tugasPraktikum.praktikum.kepengurusanLab.laboratorium',
                'praktikanPraktikum.praktikan',
                'praktikan'
            ])
            ->whereIn('praktikan_praktikum_id', $allPpIdsDaftar)
            ->orderBy('submitted_at', 'desc')
            ->get();

        $riwayatPengumpulan->each(function ($riwayat) {
            $nilaiDasar = $riwayat->nilai ?? 0;

            $nilaiTambahans = \App\Models\NilaiTambahan::where('pengumpulan_tugas_id', $riwayat->id)

                ->get();

            $totalNilaiTambahan = $nilaiTambahans->sum('nilai');

            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);

            $riwayat->setAttribute('total_nilai_tambahan', $totalNilaiTambahan);
            $riwayat->setAttribute('total_nilai_with_bonus', $totalNilaiWithBonus);
        });

        return Inertia::render('Praktikan/DaftarTugas', [
            'praktikans' => $praktikanPraktikums,
            'tugasPraktikums' => $tugasPraktikums,
            'riwayatPengumpulan' => $riwayatPengumpulan
        ]);
    }


    public function detailTugas($tugasId)
    {
        $user = Auth::user();

        $tugas = TugasPraktikum::with([
            'praktikum.kepengurusanLab.laboratorium',
            'kelas.praktikum',
            'pertemuan.kelas.praktikum'
        ])->findOrFail($tugasId);

        $praktikumId = $tugas->kelas?->praktikum_id ?? $tugas->pertemuan?->kelas?->praktikum_id;
        if (!$praktikumId) {
            abort(404, 'Tugas tidak terhubung ke praktikum.');
        }

        $isRegistered = PraktikanPraktikum::where('praktikum_id', $praktikumId)
            ->whereHas('praktikan', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('status', 'aktif')->exists();

        if (!$isRegistered) {
            abort(403, 'Akses ditolak.');
        }

        $pengumpulan = PengumpulanTugas::with('praktikan')->where('tugas_praktikum_id', $tugasId)
            ->whereHas('praktikan', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->first();

        $detailNilaiTambahan = [];
        $totalNilaiTambahan = 0;
        $totalNilaiWithBonus = null;

        if ($pengumpulan && $pengumpulan->status === 'dinilai') {
            $nilaiDasar = $pengumpulan->nilai ?? 0;
            $detailNilaiTambahan = \App\Models\NilaiTambahan::where('pengumpulan_tugas_id', $pengumpulan->id)->get();
            $totalNilaiTambahan = $detailNilaiTambahan->sum('nilai');
            $totalNilaiWithBonus = min($nilaiDasar + $totalNilaiTambahan, 100);
        }

        return Inertia::render('Praktikan/DaftarTugasDetail', [
            'tugas' => $tugas,
            'pengumpulan' => $pengumpulan ? [
                'id' => $pengumpulan->id,
                'status' => $pengumpulan->status,
                'file_pengumpulan' => $pengumpulan->file_pengumpulan,
                'catatan' => $pengumpulan->catatan,
                'feedback' => $pengumpulan->feedback,
                'nilai' => $pengumpulan->nilai,
                'submitted_at' => $pengumpulan->submitted_at,
                'dinilai_at' => $pengumpulan->dinilai_at,
                'total_nilai_tambahan' => $totalNilaiTambahan,
                'detail_nilai_tambahan' => $detailNilaiTambahan,
                'total_nilai_with_bonus' => $totalNilaiWithBonus,
            ] : null
        ]);
    }


    public function update(Request $request, $praktikumId, $praktikanId)
    {
        \Log::info('Update praktikan request:', [
            'praktikum_id' => $praktikumId,
            'praktikan_id' => $praktikanId,
            'request_data' => $request->all()
        ]);

        $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'kelas_id' => 'required|exists:kelas,id',
            'password' => 'nullable|string|min:6'
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $kelas = \App\Models\Kelas::where('id', $request->kelas_id)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikan = $praktikanPraktikum->praktikan;
        $user = $praktikan->user;

        $praktikan->update([
            'nama' => $request->nama,
            'no_hp' => $request->no_hp
        ]);

        $praktikanPraktikum->update([
            'kelas_id' => $request->kelas_id
        ]);

        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        return redirect()->back()->with('success', 'Data praktikan berhasil diperbarui');
    }


    public function removeFromPraktikum($praktikumId, $praktikanId)
    {
        $praktikanPraktikum = PraktikanPraktikum::where('praktikan_id', $praktikanId)
            ->where('praktikum_id', $praktikumId)
            ->firstOrFail();

        $praktikanPraktikum->delete();

        return redirect()->back()->with('success', 'Praktikan berhasil dihapus dari praktikum');
    }


    public function destroy($id)
    {
        $praktikan = Praktikan::findOrFail($id);

        $praktikan->praktikanPraktikums()->delete();

        if ($praktikan->user && $praktikan->user->praktikan && $praktikan->user->praktikan->praktikanPraktikums()->count() <= 1) {

            $userRoles = $praktikan->user->roles->pluck('name')->toArray();
            $hasOtherRoles = count($userRoles) > 1 || !in_array('praktikan', $userRoles);

            if (!$hasOtherRoles) {
                $praktikan->user->delete();
            }
        }

        $praktikan->delete();

        return redirect()->back()->with('success', 'Praktikan berhasil dihapus');
    }


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


    private function generateEmail($nim, $nama)
    {

        $nama_awal = strtok(strtolower($nama), ' ');

        $nama_awal = preg_replace('/[^a-zA-Z0-9]/', '', $nama_awal);

        return $nim . '_' . $nama_awal . '@student.unand.ac.id';
    }
}
