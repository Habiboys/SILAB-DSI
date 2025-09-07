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
        // Skip middleware untuk route tertentu yang tidak memerlukan lab_id
        $skipRoutes = ['/', '/login', '/register', '/dashboard', '/about', '/profile'];
        if (in_array($request->path(), $skipRoutes)) {
            return $next($request);
        }
        
        // Skip untuk route yang tidak memerlukan kepengurusan aktif
        $skipKepengurusanRoutes = [
            'praktikum', 'praktikum/*', 'praktikum/*/modul', 'praktikum/*/praktikan', 
            'praktikum/*/tugas', 'praktikum/*/tugas/*/pengumpulan', 'praktikum/*/tugas/*/submissions'
        ];
        
        foreach ($skipKepengurusanRoutes as $pattern) {
            if (fnmatch($pattern, $request->path())) {
                return $next($request);
            }
        }
        
        // Coba dapatkan lab_id dari berbagai sumber
        $lab_id = $request->input('lab_id') ?? 
                   $request->route('lab_id') ?? 
                   $request->input('laboratory_id') ??
                   auth()->user()->laboratory_id;
        
        // Jika ada kepengurusan_lab_id, gunakan itu untuk mendapatkan lab_id
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        if ($kepengurusan_lab_id && !$lab_id) {
            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $lab_id = $kepengurusanLab->laboratorium_id;
            }
        }
        
        if (!$lab_id) {
            // Jika masih tidak ada, coba dapatkan dari user yang sedang login
            $user = auth()->user();
            if ($user && $user->laboratory_id) {
                $lab_id = $user->laboratory_id;
            } else {
                \Log::error('Lab ID tidak ditemukan di middleware', [
                    'request_data' => $request->all(),
                    'user' => $user ? $user->toArray() : 'null'
                ]);
                
                // Gunakan abort() alih-alih response()->json() untuk menghindari error Inertia
                abort(400, 'Lab ID tidak ditemukan. Silakan pilih laboratorium terlebih dahulu.');
            }
        }

        // Cek apakah ada kepengurusan aktif untuk lab ini
        $kepengurusanAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->whereHas('tahunKepengurusan', function($query) {
                $query->where('isactive', 1);
            })
            ->first();

        if (!$kepengurusanAktif) {
            // Debug log untuk troubleshooting
            \Log::error('Tidak ada kepengurusan aktif untuk lab', [
                'lab_id' => $lab_id,
                'request_data' => $request->all(),
                'user_lab_id' => auth()->user()->laboratory_id ?? 'null'
            ]);
            
            // Gunakan abort() alih-alih response()->json() untuk menghindari error Inertia
            abort(403, 'Tidak ada kepengurusan aktif untuk laboratorium ini. Modul ini hanya dapat diakses saat ada kepengurusan aktif.');
        }

        // Hanya blokir untuk method yang memanipulasi data (POST, PUT, DELETE)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            // Cek apakah data yang diakses sesuai dengan kepengurusan aktif
            if ($modul && $request->route('id')) {
                $this->checkDataAccess($request, $modul, $kepengurusanAktif);
            }
        }

        // Tambahkan data kepengurusan aktif ke request
        $request->merge(['active_kepengurusan_id' => $kepengurusanAktif->id]);
        $request->merge(['active_tahun_id' => $kepengurusanAktif->tahun_kepengurusan_id]);

        return $next($request);
    }

    /**
     * Cek apakah data yang diakses sesuai dengan kepengurusan aktif
     */
    private function checkDataAccess(Request $request, string $modul, $kepengurusanAktif): void
    {
        $dataId = $request->route('id');
        
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
        $piket = \App\Models\JadwalPiket::find($dataId);
        if ($piket && $piket->periode_piket->kepengurusan_lab_id !== $kepengurusanAktif->id) {
            abort(403, 'Tidak dapat memanipulasi data piket dari kepengurusan yang tidak aktif');
        }
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
}
