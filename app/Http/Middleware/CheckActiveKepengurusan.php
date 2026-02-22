<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\TahunKepengurusan;
use App\Models\KepengurusanLab;
use App\Helpers\KepengurusanHelper;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveKepengurusan
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $modul = null): Response
    {
        // SUPERADMIN/KADEP BYPASS: Always allow superadmin and kadep
        if (auth()->check() && auth()->user()->hasRole(['superadmin', 'kadep'])) {
            return $next($request);
        }

        // Skip middleware untuk route tertentu yang tidak memerlukan lab_id
        $skipRoutes = ['/', '/login', '/register', '/dashboard', '/about', '/profile'];
        if (in_array($request->path(), $skipRoutes)) {
            return $next($request);
        }
        
        // Skip untuk route yang tidak memerlukan kepengurusan aktif
        // Update patterns to be more comprehensive for praktikum
        $skipKepengurusanRoutes = [
            // 'praktikum', // Removed to enforce check
            // 'praktikum/*', // Removed to enforce check
        ];
        
        foreach ($skipKepengurusanRoutes as $pattern) {
            if ($request->is($pattern)) {
                // \Log::info("Skipping middleware for path: " . $request->path() . " with pattern: " . $pattern);
                return $next($request);
            }
        }
        
        // Additional check for specific routes (redundant if praktikum/* works, but keeping for safety)
        if ($request->is('praktikum/submission/*')) {
             return $next($request);
        }
        
        // Coba dapatkan lab_id dari berbagai sumber
        $lab_id = $request->input('lab_id') ?? 
                   $request->route('lab_id') ?? 
                   $request->input('laboratory_id') ??
                   auth()->user()->laboratory_id;
        
        // 1. Try to get kepengurusan_lab_id from request or session
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        
        if ($kepengurusan_lab_id) {
            // New selection: update session
            session(['active_kepengurusan_lab_id' => $kepengurusan_lab_id]);
        } else {
            // Fallback: check session
            $kepengurusan_lab_id = session('active_kepengurusan_lab_id');
        }

        // 2. Determine lab_id based on kepengurusan_lab_id or other sources
        if ($kepengurusan_lab_id && !$lab_id) {
            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $lab_id = $kepengurusanLab->laboratorium_id;
            }
        }
        
        // NEW: If lab_id is still missing, try to infer it from the resource in the route
        if (!$lab_id && $modul) {
            $lab_id = $this->inferLabIdFromResource($request, $modul);
        }
        
        if (!$lab_id) {
            // Jika masih tidak ada, coba dapatkan dari user yang sedang login
            $user = auth()->user();
            if ($user && $user->laboratory_id) {
                $lab_id = $user->laboratory_id;
            } else {
                // \Log::error('Lab ID tidak ditemukan di middleware', ['request_data' => $request->all(), 'user_id' => $user->id ?? 'null']);
                
                // Gunakan abort() alih-alih response()->json() untuk menghindari error Inertia
                // abort(400, 'Lab ID tidak ditemukan. Silakan pilih laboratorium terlebih dahulu.');
                // Relaxed: if no lab_id found, just let it pass, maybe the controller handles it or it's a general route
                 return $next($request);
            }
        }

        // Cek apakah ada kepengurusan aktif untuk lab ini
        $kepengurusanAktif = null;
        
        // If we have a specific ID, use it
        if ($kepengurusan_lab_id) {
            $kepengurusanAktif = KepengurusanLab::where('id', $kepengurusan_lab_id)
                ->where('laboratorium_id', $lab_id) // Ensure it belongs to the lab
                ->first();
        }
        
        // Default to the ACTIVE kepengurusan if no specific ID or invalid ID
        if (!$kepengurusanAktif) {
            $kepengurusanAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->whereHas('tahunKepengurusan', function($query) {
                    $query->where('isactive', 1);
                })
                ->first();
                
            // Update session to reflect the actual active one if we fell back
            if ($kepengurusanAktif) {
                 session(['active_kepengurusan_lab_id' => $kepengurusanAktif->id]);
            }
        }

        if (!$kepengurusanAktif) {
            // \Log::error('Tidak ada kepengurusan aktif untuk lab', ['lab_id' => $lab_id]);
            abort(403, 'Tidak ada kepengurusan aktif untuk laboratorium ini.');
        }

        // Always check data access if valid ID is present, regardless of method
        if ($modul) {
             $this->checkDataAccess($request, $modul, $kepengurusanAktif);
        }

        // Tambahkan data kepengurusan aktif ke request
        // Ensure controllers using 'kepengurusan_lab_id' see this value, even if URL param is missing
        if (!$request->has('kepengurusan_lab_id')) {
            $request->merge(['kepengurusan_lab_id' => $kepengurusanAktif->id]);
        }
        
        $request->merge(['active_kepengurusan_id' => $kepengurusanAktif->id]);
        $request->merge(['active_tahun_id' => $kepengurusanAktif->tahun_kepengurusan_id]);

        return $next($request);
    }

    /**
     * Cek apakah data yang diakses sesuai dengan kepengurusan aktif
     */
    private function checkDataAccess(Request $request, string $modul, $kepengurusanAktif): void
    {
        // Try to find the ID from various route parameter names
        $dataId = $request->route('id') ?? 
                  $request->route('praktikum') ?? 
                  $request->route('kegiatan') ??
                  $request->route('proker') ??
                  $request->route('riwayatKeuangan') ??
                  $request->route('jadwalPiket');
        
        // If dataId is an object (Model binding), get the ID
        if (is_object($dataId)) {
            $dataId = $dataId->id;
        }

        if (!$dataId) {
            return;
        }
        
        switch ($modul) {
            case 'keuangan':
                $this->checkKeuanganAccess($dataId, $kepengurusanAktif);
                break;
            case 'piket':
                $this->checkPiketAccess($dataId, $kepengurusanAktif);
                break;
            case 'praktikum':
                $this->checkPraktikumAccess($dataId, $kepengurusanAktif);
                break;
            case 'proker':
                $this->checkProkerAccess($dataId, $kepengurusanAktif);
                break;
        }
    }

    private function checkKeuanganAccess($dataId, $kepengurusanAktif): void
    {
        $keuangan = \App\Models\RiwayatKeuangan::find($dataId);
        if ($keuangan && $keuangan->kepengurusan_lab_id !== $kepengurusanAktif->id) {
            abort(403, 'Tidak dapat memanipulasi data keuangan dari kepengurusan yang tidak aktif');
        }
    }

    private function checkPiketAccess($dataId, $kepengurusanAktif): void
    {
        \Log::info('checkPiketAccess called', [
            'dataId' => $dataId,
            'kepengurusanAktifId' => $kepengurusanAktif->id
        ]);
        
        // Check JadwalPiket
        $piket = \App\Models\JadwalPiket::find($dataId);
        if ($piket) {
            \Log::info('Found JadwalPiket', [
                'piketId' => $piket->id,
                'piketKepengurusanId' => $piket->kepengurusan_lab_id,
                'kepengurusanAktifId' => $kepengurusanAktif->id
            ]);
            if ($piket->kepengurusan_lab_id !== $kepengurusanAktif->id) {
                abort(403, 'Tidak dapat memanipulasi data piket dari kepengurusan yang tidak aktif');
            }
        }
        
        // Check GantiJadwalPiket
        $gantiJadwal = \App\Models\GantiJadwalPiket::find($dataId);
        if ($gantiJadwal) {
            // Load the periodePiket relationship first
            $gantiJadwal->load('periodePiket');
            
            \Log::info('Found GantiJadwalPiket', [
                'gantiJadwalId' => $gantiJadwal->id,
                'periodeKepengurusanId' => $gantiJadwal->periodePiket->kepengurusan_lab_id,
                'kepengurusanAktifId' => $kepengurusanAktif->id
            ]);
            if ($gantiJadwal->periodePiket->kepengurusan_lab_id !== $kepengurusanAktif->id) {
                abort(403, 'Tidak dapat memanipulasi data ganti jadwal dari kepengurusan yang tidak aktif');
            }
        }
        
        \Log::info('checkPiketAccess passed');
    }

    private function checkPraktikumAccess($dataId, $kepengurusanAktif): void
    {
        $praktikum = \App\Models\Praktikum::find($dataId);
        if ($praktikum && $praktikum->kepengurusan_lab_id !== $kepengurusanAktif->id) {
            abort(403, 'Tidak dapat memanipulasi data praktikum dari kepengurusan yang tidak aktif');
        }
    }

    private function checkProkerAccess($dataId, $kepengurusanAktif): void
    {
        $proker = \App\Models\Proker::find($dataId);
        if ($proker && $proker->kepengurusan_lab_id !== $kepengurusanAktif->id) {
            abort(403, 'Tidak dapat memanipulasi data proker dari kepengurusan yang tidak aktif');
        }
    }

    /**
     * Infer Lab ID from the resource ID in the route parameter
     */
    private function inferLabIdFromResource(Request $request, string $modul)
    {
        // Extract ID using the same logic as checkDataAccess
        $dataId = $request->route('id') ?? 
                  $request->route('praktikum') ?? 
                  $request->route('kegiatan') ??
                  $request->route('proker') ??
                  $request->route('riwayatKeuangan') ??
                  $request->route('jadwalPiket');
        
        if (is_object($dataId)) {
            // If model binding, we can allow the ID string or the object itself if needed,
            // but usually we need to query its relationship.
            // However, getting the ID is safer for uniform querying.
            $dataId = $dataId->id;
        }

        if (!$dataId) {
            return null;
        }

        $kepengurusanLabId = null;

        switch ($modul) {
            case 'praktikum':
                $praktikum = \App\Models\Praktikum::find($dataId);
                $kepengurusanLabId = $praktikum?->kepengurusan_lab_id;
                break;
            case 'keuangan':
                $keuangan = \App\Models\RiwayatKeuangan::find($dataId);
                $kepengurusanLabId = $keuangan?->kepengurusan_lab_id;
                break;
            case 'piket':
                $piket = \App\Models\JadwalPiket::find($dataId);
                $kepengurusanLabId = $piket?->kepengurusan_lab_id;
                break;
            case 'proker':
                $proker = \App\Models\Proker::find($dataId);
                $kepengurusanLabId = $proker?->kepengurusan_lab_id;
                break;
             case 'kegiatan':
                $kegiatan = \App\Models\Kegiatan::with('proker')->find($dataId);
                $kepengurusanLabId = $kegiatan?->proker?->kepengurusan_lab_id;
                break;
        }

        if ($kepengurusanLabId) {
            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusanLabId);
            return $kepengurusanLab?->laboratorium_id;
        }

        return null;
    }
}
