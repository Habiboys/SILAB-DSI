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
        $pertemuan->load(['praktikum.praktikans.user', 'praktikum.aslab', 'absensiPraktikan', 'absensiAslab']);

        // Get all praktikans enrolled in this praktikum
        $praktikans = $pertemuan->praktikum->praktikans;
        
        // Get all aslabs assigned
        $aslabs = $pertemuan->praktikum->aslab;

        return Inertia::render('Pertemuan/Absensi', [
            'pertemuan' => $pertemuan,
            'praktikans' => $praktikans,
            'aslabs' => $aslabs,
            'existingAbsensiPraktikan' => $pertemuan->absensiPraktikan->keyBy('praktikan_id'),
            'existingAbsensiAslab' => $pertemuan->absensiAslab->keyBy('user_id'),
        ]);
    }

    /**
     * Store/Update Praktikan Attendance
     */
    public function storePraktikan(Request $request, PertemuanPraktikum $pertemuan)
    {
        $request->validate([
            'absensi' => 'required|array',
            'absensi.*.praktikan_id' => 'required|exists:praktikan,id',
            'absensi.*.status' => 'required|in:hadir,izin,sakit,alpha',
            'absensi.*.keterangan' => 'nullable|string',
        ]);

        foreach ($request->absensi as $data) {
            AbsensiPraktikan::updateOrCreate(
                [
                    'pertemuan_id' => $pertemuan->id,
                    'praktikan_id' => $data['praktikan_id']
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
            'absensi.*.user_id' => 'required|exists:users,id',
            'absensi.*.status' => 'required|in:hadir,izin,sakit,alpha',
            'absensi.*.keterangan' => 'nullable|string',
        ]);

        foreach ($request->absensi as $data) {
            AbsensiAslab::updateOrCreate(
                [
                    'pertemuan_id' => $pertemuan->id,
                    'user_id' => $data['user_id']
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
