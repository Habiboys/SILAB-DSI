<?php

namespace App\Http\Controllers;

use App\Models\KonfigurasiSurat;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KonfigurasiSuratController extends Controller
{
    /**
     * Show konfigurasi for a given kepengurusan_lab.
     * GET /surat-menyurat/konfigurasi?kepengurusan_lab_id=...
     */
    public function show(Request $request)
    {
        $user = Auth::user();
        if (!$user->can('konfigurasi-surat.view')) {
            abort(403);
        }

        $currentLab = $user->getCurrentLab();

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // Resolve lab_id from context
        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } elseif (isset($currentLab['laboratorium'])) {
            $lab_id = $currentLab['laboratorium']->id;
        } else {
            $lab_id = $user->access_lab_id ?? null;
        }

        $kepengurusanLab = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanLab = KepengurusanLab::with(['laboratorium', 'tahunKepengurusan'])
                ->find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $lab_id = $kepengurusanLab->laboratorium_id;
            }
        } else {
            $tahun_id   = $request->input('tahun_id');
            if (!$tahun_id && $lab_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif?->tahun_kepengurusan_id;
            }
            if ($lab_id && $tahun_id) {
                $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['laboratorium', 'tahunKepengurusan'])
                    ->first();
            }
        }

        $laboratorium = Laboratorium::select('id', 'nama')->get();

        $konfigurasi = null;
        if ($kepengurusanLab) {
            $konfigurasi = KonfigurasiSurat::firstOrNew(
                ['kepengurusan_lab_id' => $kepengurusanLab->id],
                [
                    'inisial_lab'      => strtoupper(substr($kepengurusanLab->laboratorium->nama ?? 'LAB', 0, 10)),
                    'format_nomor'     => '{nomor}/LAB.{inisial_lab}/{bulan_romawi}/{tahun}',
                    'reset_tiap_tahun' => true,
                ]
            );
        }

        return Inertia::render('SuratMenyurat/Konfigurasi', [
            'kepengurusanLab'   => $kepengurusanLab,
            'konfigurasi'       => $konfigurasi,
            'laboratorium'      => $laboratorium,
            'tahunKepengurusan' => $kepengurusanLab
                ? TahunKepengurusan::whereIn('id', function ($q) use ($lab_id) {
                    $q->select('tahun_kepengurusan_id')
                      ->from('kepengurusan_lab')
                      ->where('laboratorium_id', $lab_id);
                })->orderBy('tahun', 'desc')->get()
                : collect(),
        ]);
    }

    /**
     * Create or update konfigurasi.
     * POST /surat-menyurat/konfigurasi
     */
    public function upsert(Request $request)
    {
        $user = Auth::user();
        if (!$user->can('konfigurasi-surat.edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'kepengurusan_lab_id' => ['required', 'uuid', 'exists:kepengurusan_lab,id'],
            'inisial_lab'         => ['required', 'string', 'max:20'],
            'format_nomor'        => ['required', 'string', 'max:200'],
            'reset_tiap_tahun'    => ['required', 'boolean'],
        ]);

        KonfigurasiSurat::updateOrCreate(
            ['kepengurusan_lab_id' => $validated['kepengurusan_lab_id']],
            [
                'inisial_lab'      => $validated['inisial_lab'],
                'format_nomor'     => $validated['format_nomor'],
                'reset_tiap_tahun' => $validated['reset_tiap_tahun'],
            ]
        );

        return redirect()->back()->with('success', 'Konfigurasi surat berhasil disimpan.');
    }
}
