<?php

namespace App\Http\Controllers;

use App\Models\PengumpulanTugas;
use App\Models\TugasPraktikum;
use App\Models\Praktikan;
use App\Models\Praktikum;
use App\Models\NilaiTambahan;
use App\Exports\TugasSubmissionExport;
use App\Exports\MultipleTugasSubmissionExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PengumpulanTugasController extends Controller
{
    /**
     * Display a listing of pengumpulan tugas for a specific tugas
     */
    public function index(Request $request, $tugasId)
    {
        $tugas = TugasPraktikum::with(['praktikum.kepengurusanLab'])->findOrFail($tugasId);
        
        $pengumpulan = PengumpulanTugas::with(['praktikan.user', 'praktikan.labs'])
            ->where('tugas_praktikum_id', $tugasId)
            ->orderBy('submitted_at', 'desc')
            ->get();

        return Inertia::render('PengumpulanTugas/Index', [
            'tugas' => $tugas,
            'pengumpulan' => $pengumpulan,
            'lab' => $tugas->praktikum->lab
        ]);
    }

    /**
     * Store a newly created pengumpulan tugas
     */
    public function store(Request $request, $tugasId)
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:pdf,doc,docx,zip,rar|max:10240', // Max 10MB per file
            'catatan' => 'nullable|string',
        ]);

        $tugas = TugasPraktikum::findOrFail($tugasId);
        
        // Ambil praktikan_id dari user yang sedang login
        $user = auth()->user();
        $praktikan = Praktikan::where('user_id', $user->id)
            ->where('praktikum_id', $tugas->praktikum_id)
            ->first();

        if (!$praktikan) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak terdaftar di praktikum ini'
            ], 403);
        }

        // Check if already submitted
        $existing = PengumpulanTugas::where('tugas_praktikum_id', $tugasId)
            ->where('praktikan_id', $praktikan->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Tugas sudah dikumpulkan'
            ], 400);
        }

        $status = 'dikumpulkan';
        if (now()->gt($tugas->deadline)) {
            $status = 'terlambat';
        }

        // Simpan file-file yang diupload
        $filePaths = [];
        foreach ($request->file('files') as $file) {
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('public/pengumpulan_tugas', $filename);
            $filePaths[] = $path;
        }

        // Simpan sebagai JSON string untuk multiple files
        $filePathsJson = json_encode($filePaths);

        PengumpulanTugas::create([
            'tugas_praktikum_id' => $tugasId,
            'praktikan_id' => $praktikan->id,
            'file_pengumpulan' => $filePathsJson, // Simpan sebagai JSON string
            'catatan' => $request->catatan,
            'status' => $status,
            'submitted_at' => now()
        ]);

        return redirect()->route('praktikan.riwayat')->with('success', 'Tugas berhasil dikumpulkan');
    }

    /**
     * Update pengumpulan tugas (for grading)
     */
    public function update(Request $request, $id)
    {
        $pengumpulan = PengumpulanTugas::findOrFail($id);

        $request->validate([
            'nilai' => 'required|numeric|min:0|max:100',
            'feedback' => 'nullable|string',
        ]);

        $pengumpulan->update([
            'nilai' => $request->nilai,
            'feedback' => $request->feedback,
            'status' => 'dinilai',
            'dinilai_at' => now()
        ]);

        return redirect()->back()->with('success', 'Nilai berhasil diupdate');
    }

    /**
     * Remove pengumpulan tugas
     */
    public function destroy($id)
    {
        $pengumpulan = PengumpulanTugas::findOrFail($id);
        
        // Delete file if exists
        if ($pengumpulan->file_pengumpulan) {
            Storage::delete($pengumpulan->file_pengumpulan);
        }
        
        $pengumpulan->delete();

        return redirect()->back()->with('success', 'Pengumpulan tugas berhasil dihapus');
    }

    /**
     * Download file pengumpulan
     */
    public function downloadFile($id)
    {
        $pengumpulan = PengumpulanTugas::findOrFail($id);
        
        if (!$pengumpulan->file_pengumpulan || !Storage::exists($pengumpulan->file_pengumpulan)) {
            abort(404);
        }

        return Storage::download($pengumpulan->file_pengumpulan);
    }

    /**
     * Download file pengumpulan by filename
     */
    public function downloadFileByFilename($filename)
    {
        $filePath = 'public/pengumpulan_tugas/' . $filename;
        
        if (!Storage::exists($filePath)) {
            abort(404, 'File tidak ditemukan');
        }
        
        // Get original filename without timestamp prefix
        $originalFilename = preg_replace('/^\d+_/', '', $filename);
        
        return Storage::download($filePath, $originalFilename);
    }

    /**
     * Get pengumpulan data for API
     */
    public function getPengumpulan($tugasId)
    {
        $pengumpulan = PengumpulanTugas::with(['praktikan.user', 'praktikan.labs'])
            ->where('tugas_praktikum_id', $tugasId)
            ->orderBy('submitted_at', 'desc')
            ->get();

        return response()->json($pengumpulan);
    }

    /**
     * Get pengumpulan by praktikan
     */
    public function getPengumpulanByPraktikan($praktikanId)
    {
        $pengumpulan = PengumpulanTugas::with(['tugasPraktikum.praktikum.kepengurusanLab'])
            ->where('praktikan_id', $praktikanId)
            ->orderBy('submitted_at', 'desc')
            ->get();

        return response()->json($pengumpulan);
    }

    /**
     * Admin melihat semua pengumpulan tugas untuk tugas tertentu
     */
    public function adminSubmissions($tugasId)
    {
        $tugas = TugasPraktikum::with([
            'praktikum.kepengurusanLab.laboratorium',
            'praktikum.praktikans.user', // Load praktikan untuk nilai tambahan
            'komponenRubriks' => function($query) {
                $query->orderBy('urutan');
            }
        ])->findOrFail($tugasId);
        
        $submissions = PengumpulanTugas::with([
            'praktikan.user', 
            'praktikan.praktikums',
            'nilaiRubriks.komponenRubrik' // Load nilai rubrik yang sudah ada
        ])
            ->where('tugas_praktikum_id', $tugasId)
            ->orderBy('submitted_at', 'desc')
            ->get();

        // Tambahkan total nilai dengan bonus ke setiap submission
        $submissions->each(function ($submission) use ($tugasId) {
            // Load nilai tambahan untuk praktikan ini di tugas ini
            $nilaiTambahans = NilaiTambahan::where('tugas_praktikum_id', $tugasId)
                ->where('praktikan_id', $submission->praktikan_id)
                ->get();
            
            // Set properties (bukan database fields)
            $submission->setAttribute('nilaiTambahans', $nilaiTambahans);
            $submission->setAttribute('has_nilai_tambahan', $nilaiTambahans->count() > 0);
            $submission->setAttribute('total_nilai_tambahan', $nilaiTambahans->sum('nilai'));
            
            // Hitung nilai dasar (dari rubrik atau manual)
            $nilaiDasar = $submission->total_nilai_rubrik ?? $submission->nilai ?? 0;
            
            // Hitung total dengan bonus (max 100)
            $totalBonus = $nilaiTambahans->sum('nilai');
            $submission->setAttribute('total_nilai_with_bonus', min($nilaiDasar + $totalBonus, 100));
            
            // Update status jika ada nilai tapi status masih bukan 'dinilai'
            if (($submission->nilai > 0 || $submission->total_nilai_rubrik > 0) && $submission->status !== 'dinilai') {
                // Update hanya kolom yang ada di database
                PengumpulanTugas::where('id', $submission->id)->update([
                    'status' => 'dinilai',
                    'dinilai_at' => now()
                ]);
                $submission->status = 'dinilai'; // Update object untuk response
            }
        });

        // Dapatkan praktikan yang terdaftar di kelas yang sama dengan tugas ini
        if ($tugas->kelas_id) {
            // Tugas untuk kelas tertentu
            $allPraktikans = $tugas->praktikum->praktikans()
                ->wherePivot('kelas_id', $tugas->kelas_id)
                ->with('user')
                ->get();
        } else {
            // Tugas untuk semua kelas
            $allPraktikans = $tugas->praktikum->praktikans()
                ->with('user')
                ->get();
        }
        
        // Buat array praktikan yang belum submit
        $submittedPraktikanIds = $submissions->pluck('praktikan_id')->toArray();
        $nonSubmittedPraktikans = $allPraktikans->filter(function ($praktikan) use ($submittedPraktikanIds) {
            return !in_array($praktikan->id, $submittedPraktikanIds);
        });

        // Tambahkan nilai tambahan untuk praktikan yang belum submit
        $nonSubmittedWithBonus = $nonSubmittedPraktikans->map(function ($praktikan) use ($tugasId) {
            $nilaiTambahans = NilaiTambahan::where('tugas_praktikum_id', $tugasId)
                ->where('praktikan_id', $praktikan->id)
                ->get();
            
            return (object) [
                'id' => null, // tidak ada submission
                'praktikan_id' => $praktikan->id,
                'praktikan' => $praktikan,
                'status' => 'belum-submit',
                'submitted_at' => null,
                'file_pengumpulan' => null,
                'nilai' => null,
                'total_nilai_rubrik' => null,
                'nilaiTambahans' => $nilaiTambahans,
                'has_nilai_tambahan' => $nilaiTambahans->count() > 0,
                'total_nilai_tambahan' => $nilaiTambahans->sum('nilai'),
                'total_nilai_with_bonus' => $nilaiTambahans->sum('nilai') // hanya bonus karena belum ada nilai dasar
            ];
        })->values(); // Pastikan ini adalah collection yang bisa di-filter

        return Inertia::render('TugasPraktikum/TugasSubmissions', [
            'tugas' => $tugas,
            'submissions' => $submissions,
            'nonSubmittedPraktikans' => $nonSubmittedWithBonus
        ]);
    }

    /**
     * Admin memberikan nilai untuk pengumpulan tugas
     */
    public function gradeSubmission(Request $request, $pengumpulanId)
    {
        $request->validate([
            'nilai' => 'required|numeric|min:0|max:100',
            'feedback' => 'nullable|string|max:1000'
        ]);

        $pengumpulan = PengumpulanTugas::findOrFail($pengumpulanId);
        
        $pengumpulan->update([
            'nilai' => $request->nilai,
            'feedback' => $request->feedback,
            'status' => 'dinilai',
            'dinilai_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nilai berhasil disimpan'
        ]);
    }

    /**
     * Export tugas submission grades separated by class
     */
    public function exportGrades($tugasId)
    {
        $tugas = TugasPraktikum::with(['praktikum.kepengurusanLab'])->findOrFail($tugasId);
        
        $filename = 'Nilai_Tugas_' . str_replace(' ', '_', $tugas->judul_tugas) . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
        
        return Excel::download(new TugasSubmissionExport($tugasId), $filename);
    }

    /**
     * Export multiple tugas grades in one Excel file
     */
    public function exportMultipleGrades($praktikumId, Request $request)
    {
        $praktikum = Praktikum::with(['kepengurusanLab'])->findOrFail($praktikumId);
        
        // Get selected tugas IDs from request
        $tugasIds = $request->get('tugas', '');
        if (empty($tugasIds)) {
            return redirect()->back()->with('error', 'Tidak ada tugas yang dipilih');
        }
        
        $tugasIdsArray = explode(',', $tugasIds);
        $tugas = TugasPraktikum::whereIn('id', $tugasIdsArray)
            ->where('praktikum_id', $praktikumId)
            ->get();
        
        if ($tugas->isEmpty()) {
            return redirect()->back()->with('error', 'Tugas tidak ditemukan');
        }
        
        $filename = 'Nilai_Praktikum_' . str_replace(' ', '_', $praktikum->mata_kuliah) . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
        
        return Excel::download(new MultipleTugasSubmissionExport($tugasIdsArray), $filename);
    }

    /**
     * Cancel pengumpulan tugas (hanya untuk yang belum dinilai)
     */
    public function cancelSubmission($pengumpulanId)
    {
        $pengumpulan = PengumpulanTugas::findOrFail($pengumpulanId);
        
        // Cek apakah sudah dinilai
        if ($pengumpulan->status === 'dinilai') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa membatalkan tugas yang sudah dinilai'
            ], 400);
        }
        
        // Hapus file lama jika ada
        if ($pengumpulan->file_pengumpulan) {
            try {
                $files = json_decode($pengumpulan->file_pengumpulan, true);
                if (is_array($files)) {
                    foreach ($files as $file) {
                        Storage::delete($file);
                    }
                } else {
                    Storage::delete($pengumpulan->file_pengumpulan);
                }
            } catch (Exception $e) {
                // Ignore file deletion errors
            }
        }
        
        // Hapus record pengumpulan
        $pengumpulan->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Pengumpulan tugas berhasil dibatalkan'
        ]);
    }

    /**
     * Admin menolak pengumpulan tugas
     */
    public function rejectSubmission(Request $request, $pengumpulanId)
    {
        $request->validate([
            'alasan_penolakan' => 'required|string|max:1000'
        ]);

        $pengumpulan = PengumpulanTugas::findOrFail($pengumpulanId);
        
        // Cek apakah sudah dinilai
        if ($pengumpulan->status === 'dinilai') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menolak tugas yang sudah dinilai'
            ], 400);
        }
        
        // Update status menjadi ditolak
        $pengumpulan->update([
            'status' => 'ditolak',
            'feedback' => $request->alasan_penolakan,
            'dinilai_at' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Pengumpulan tugas berhasil ditolak'
        ]);
    }

    /**
     * Store nilai rubrik untuk pengumpulan tugas
     */
    public function storeNilaiRubrik(Request $request)
    {
        $request->validate([
            'pengumpulan_tugas_id' => 'nullable|exists:pengumpulan_tugas,id',
            'praktikan_id' => 'required|exists:praktikan,id',
            'tugas_id' => 'required|exists:tugas_praktikum,id',
            'nilai_rubrik' => 'required|array',
            'nilai_rubrik.*.komponen_rubrik_id' => 'required|exists:komponen_rubrik,id',
            'nilai_rubrik.*.nilai' => 'required|numeric|min:0',
            'nilai_rubrik.*.catatan' => 'nullable|string'
        ]);

        // Jika pengumpulan_tugas_id null, cari atau buat pengumpulan tugas baru
        if ($request->pengumpulan_tugas_id) {
            $pengumpulan = PengumpulanTugas::findOrFail($request->pengumpulan_tugas_id);
        } else {
            // Cari pengumpulan tugas yang sudah ada atau buat yang baru
            $pengumpulan = PengumpulanTugas::firstOrCreate(
                [
                    'tugas_praktikum_id' => $request->tugas_id,
                    'praktikan_id' => $request->praktikan_id,
                ],
                [
                    'file_pengumpulan' => null,
                    'catatan' => null,
                    'status' => 'dinilai', // Langsung dinilai karena belum submit
                    'submitted_at' => now(),
                    'dinilai_at' => now()
                ]
            );
        }

        foreach ($request->nilai_rubrik as $nilaiData) {
            \App\Models\NilaiRubrik::updateOrCreate(
                [
                    'komponen_rubrik_id' => $nilaiData['komponen_rubrik_id'],
                    'praktikan_id' => $request->praktikan_id
                ],
                [
                    'pengumpulan_tugas_id' => $pengumpulan->id,
                    'nilai' => $nilaiData['nilai'],
                    'catatan' => $nilaiData['catatan'] ?? null,
                    'dinilai_oleh' => auth()->id(),
                    'dinilai_at' => now()
                ]
            );
        }

        // Hitung total nilai dan update pengumpulan tugas
        $totalNilai = $this->hitungTotalNilaiRubrik($pengumpulan);
        
        $pengumpulan->update([
            'nilai' => $totalNilai,
            'status' => 'dinilai',
            'dinilai_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nilai rubrik berhasil disimpan',
            'total_nilai' => $totalNilai
        ]);
    }

    /**
     * Hitung total nilai berdasarkan rubrik
     */
    private function hitungTotalNilaiRubrik($pengumpulan)
    {
        $komponenRubriks = $pengumpulan->tugasPraktikum->komponenRubriks;
        $nilaiRubriks = $pengumpulan->nilaiRubriks;
        
        $totalNilai = 0;
        $totalBobot = 0;

        foreach ($komponenRubriks as $komponen) {
            $nilaiRubrik = $nilaiRubriks->where('komponen_rubrik_id', $komponen->id)->first();
            if ($nilaiRubrik) {
                // Normalisasi nilai berdasarkan nilai maksimal komponen
                $nilaiNormalisasi = ($nilaiRubrik->nilai / $komponen->nilai_maksimal) * 100;
                $totalNilai += $nilaiNormalisasi * ($komponen->bobot / 100);
                $totalBobot += $komponen->bobot;
            }
        }

        return $totalBobot > 0 ? $totalNilai : 0;
    }
}
