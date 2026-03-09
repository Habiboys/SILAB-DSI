<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Praktikum;
use App\Models\Kelas;
use App\Models\TugasPraktikum;
use App\Models\PertemuanPraktikum;
use App\Models\ModulPraktikum;
use App\Models\PengumpulanTugas;

class CheckAslabAccess
{
    /**
     * Hanya admin/kadep atau aslab yang di-assign ke praktikum yang boleh akses (kelola tugas, pertemuan, modul, praktikan).
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if ($user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            return $next($request);
        }

        $praktikumId = $this->resolvePraktikumId($request);
        if ($praktikumId === null) {
            return $next($request);
        }

        if ($user->hasRole('asisten') && $user->canManagePraktikum($praktikumId)) {
            return $next($request);
        }

        abort(403, 'Anda tidak di-assign sebagai aslab untuk praktikum ini. Hanya aslab yang ditugaskan yang dapat mengelola.');
    }

    /**
     * Resolve praktikum id dari route parameter (praktikum, tugas, pertemuan, modul, pengumpulan).
     */
    private function resolvePraktikumId(Request $request): ?string
    {
        $route = $request->route();
        if (!$route) {
            return null;
        }

        $praktikum = $route->parameter('praktikum');
        if ($praktikum !== null) {
            return $praktikum instanceof Praktikum ? $praktikum->id : $praktikum;
        }

        $tugas = $route->parameter('tugas');
        if ($tugas !== null) {
            $model = $tugas instanceof TugasPraktikum ? $tugas : TugasPraktikum::find($tugas);
            if ($model) {
                if ($model->kelas_id) {
                    return $model->kelas?->praktikum_id;
                }
                return $model->pertemuan?->kelas?->praktikum_id;
            }
        }

        $pertemuan = $route->parameter('pertemuan');
        if ($pertemuan !== null) {
            $model = $pertemuan instanceof PertemuanPraktikum ? $pertemuan : PertemuanPraktikum::find($pertemuan);
            return $model?->kelas?->praktikum_id;
        }

        $modul = $route->parameter('modul');
        if ($modul !== null) {
            $model = $modul instanceof ModulPraktikum ? $modul : ModulPraktikum::find($modul);
            return $model?->pertemuan?->kelas?->praktikum_id;
        }

        $pengumpulan = $route->parameter('pengumpulan');
        if ($pengumpulan !== null) {
            $model = $pengumpulan instanceof PengumpulanTugas ? $pengumpulan : PengumpulanTugas::find($pengumpulan);
            $tugasPraktikum = $model?->tugasPraktikum;
            if ($tugasPraktikum) {
                return $tugasPraktikum->kelas?->praktikum_id ?? $tugasPraktikum->pertemuan?->kelas?->praktikum_id;
            }
        }

        $kelas = $route->parameter('kelas');
        if ($kelas !== null) {
            $model = $kelas instanceof Kelas ? $kelas : Kelas::find($kelas);
            return $model?->praktikum_id;
        }

        $subKelas = $route->parameter('subKelas');
        if ($subKelas !== null) {
            $model = $subKelas instanceof Kelas ? $subKelas : Kelas::find($subKelas);
            return $model?->praktikum_id;
        }

        return null;
    }
}
