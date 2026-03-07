<?php

namespace App\Http\Controllers;

use App\Models\PertemuanPraktikum;
use App\Models\AbsensiPraktikan;
use App\Models\AbsensiAslab;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PraktikumAbsensiController extends Controller
{
    /**
     * Display attendance form/list for a specific meeting
     */
    public function index(PertemuanPraktikum $pertemuan)
    {
        $pertemuan->load(['kelas.praktikum.praktikans.user', 'kelas.praktikum.aslab', 'absensiPraktikan', 'absensiAslab']);

        // Get all praktikans enrolled in this kelas's praktikum
        $praktikans = $pertemuan->kelas->praktikum->praktikans ?? collect();

        // Get all aslabs assigned
        $aslabs = $pertemuan->kelas->praktikum->aslab ?? collect();

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
        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.praktikan_praktikum_id' => 'required|exists:praktikan_praktikum,id',
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
            'absensi.*.aslab_praktikum_id' => 'required|exists:praktikan_praktikum,id',
            'absensi.*.status' => 'required|in:hadir,izin,sakit,alpha',
            'absensi.*.keterangan' => 'nullable|string',
        ]);

        foreach ($request->absensi as $data) {
            AbsensiAslab::updateOrCreate(
                [
                    'pertemuan_id' => $pertemuan->id,
                    'aslab_praktikum_id' => $data['aslab_praktikum_id']
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
