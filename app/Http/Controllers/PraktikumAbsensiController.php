<?php

namespace App\Http\Controllers;

use App\Models\PertemuanPraktikum;
use App\Models\AbsensiPraktikan;
use App\Models\AbsensiAslab;
use App\Models\AslabPraktikum;
use App\Models\Kelas;
use App\Models\PraktikanPraktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PraktikumAbsensiController extends Controller
{
    /**
     * Resolve enrollment kelas IDs for absensi context.
     * If pertemuan is on a parent kelas, include all descendant sub-kelas.
     */
    private function resolveEnrollmentKelasIds(PertemuanPraktikum $pertemuan): array
    {
        $allIds = [$pertemuan->kelas_id];
        $frontier = [$pertemuan->kelas_id];

        while (!empty($frontier)) {
            $children = Kelas::query()
                ->whereIn('parent_kelas_id', $frontier)
                ->pluck('id')
                ->all();

            $children = array_values(array_diff($children, $allIds));
            if (empty($children)) {
                break;
            }

            $allIds = array_merge($allIds, $children);
            $frontier = $children;
        }

        return $allIds;
    }

    /**
     * Display attendance form/list for a specific meeting
     */
    public function index(PertemuanPraktikum $pertemuan)
    {
        $pertemuan->load([
            'praktikum',
            'kelas.praktikum.praktikans.user',
            'kelas.praktikum.aslabPraktikum.user',
            'absensiPraktikan',
            'absensiAslab'
        ]);

        // Praktikan per konteks kelas pertemuan.
        // Jika pertemuan ada di parent kelas, tampilkan juga member sub-kelas.
        // IMPORTANT: Absensi validation expects praktikan_praktikum.id, not praktikan.id.
        $enrollmentKelasIds = $this->resolveEnrollmentKelasIds($pertemuan);

        $praktikans = PraktikanPraktikum::query()
            ->with('praktikan.user')
            ->whereIn('kelas_id', $enrollmentKelasIds)
            ->where('status', 'aktif')
            ->get();

        // Get all aslabs assigned (with pivot id from aslab_praktikum)
        $aslabs = $pertemuan->kelas->praktikum->aslabPraktikum ?? collect();

        return Inertia::render('Pertemuan/Absensi', [
            'pertemuan' => $pertemuan,
            'praktikans' => $praktikans,
            'aslabs' => $aslabs,
            'existingAbsensiPraktikan' => $pertemuan->absensiPraktikan->keyBy('praktikan_praktikum_id'),
            'existingAbsensiAslab' => $pertemuan->absensiAslab->keyBy('aslab_praktikum_id'),
        ]);
    }

    /**
     * Store/Update Praktikan Attendance
     */
    public function storePraktikan(Request $request, PertemuanPraktikum $pertemuan)
    {
        $enrollmentKelasIds = $this->resolveEnrollmentKelasIds($pertemuan);

        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.praktikan_praktikum_id' => [
                'required',
                Rule::exists('praktikan_praktikum', 'id')->where(function ($query) use ($enrollmentKelasIds) {
                    $query->whereIn('kelas_id', $enrollmentKelasIds)
                          ->where('status', 'aktif');
                }),
            ],
            'absensi.*.status' => 'required|in:hadir,izin,sakit,alpha',
            'absensi.*.keterangan' => 'nullable|string',
        ]);

        foreach ($request->absensi as $data) {
            AbsensiPraktikan::updateOrCreate(
                [
                    'pertemuan_id' => $pertemuan->id,
                    'praktikan_praktikum_id' => $data['praktikan_praktikum_id']
                ],
                [
                    'status' => $data['status'],
                    'keterangan' => $data['keterangan'] ?? null,
                    'waktu_absen' => now()
                ]
            );
        }

        return redirect()->back()->with('message', 'Absensi praktikan berhasil disimpan.');
    }

    /**
     * Store/Update Aslab Attendance
     */
    public function storeAslab(Request $request, PertemuanPraktikum $pertemuan)
    {
        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.aslab_praktikum_id' => 'nullable|exists:aslab_praktikum,id',
            'absensi.*.user_id' => 'nullable|exists:users,id',
            'absensi.*.status' => 'required|in:hadir,izin,sakit,alpha',
            'absensi.*.keterangan' => 'nullable|string',
        ]);

        foreach ($request->absensi as $data) {
            $aslabPraktikumId = $data['aslab_praktikum_id'] ?? null;

            if (!$aslabPraktikumId && !empty($data['user_id'])) {
                $aslabPraktikumId = AslabPraktikum::query()
                    ->where('praktikum_id', $pertemuan->kelas->praktikum_id)
                    ->where('user_id', $data['user_id'])
                    ->value('id');
            }

            if (!$aslabPraktikumId) {
                continue;
            }

            AbsensiAslab::updateOrCreate(
                [
                    'pertemuan_id' => $pertemuan->id,
                    'aslab_praktikum_id' => $aslabPraktikumId
                ],
                [
                    'status' => $data['status'],
                    'keterangan' => $data['keterangan'] ?? null,
                    'waktu_absen' => now()
                ]
            );
        }

        return redirect()->back()->with('message', 'Absensi aslab berhasil disimpan.');
    }
}
