<?php

namespace App\Http\Controllers;

use App\Models\RubrikPenilaian;
use App\Models\KomponenRubrik;
use App\Models\TugasPraktikum;
use App\Models\NilaiRubrik;
use App\Models\NilaiTambahan;
use App\Models\Praktikan;
use App\Models\PengumpulanTugas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RubrikPenilaianController extends Controller
{
    /**
     * Display rubrik for a specific tugas
     */
    public function index($tugasId)
    {
        $tugas = TugasPraktikum::with(['praktikum.kepengurusanLab.laboratorium'])->findOrFail($tugasId);
        
        $rubrik = RubrikPenilaian::with('komponenRubriks')
            ->where('tugas_praktikum_id', $tugasId)
            ->where('is_active', true)
            ->first();

        return Inertia::render('RubrikPenilaian/Index', [
            'tugas' => $tugas,
            'rubrik' => $rubrik
        ]);
    }

    /**
     * Store a new rubrik
     */
    public function store(Request $request, $tugasId)
    {
        $request->validate([
            'nama_rubrik' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'komponen' => 'required|array|min:1',
            'komponen.*.nama_komponen' => 'required|string|max:255',
            'komponen.*.deskripsi' => 'nullable|string',
            'komponen.*.bobot' => 'required|numeric|min:0|max:100',
            'komponen.*.nilai_maksimal' => 'required|numeric|min:1|max:100'
        ]);

        // Validasi total bobot harus 100%
        $totalBobot = array_sum(array_column($request->komponen, 'bobot'));
        if ($totalBobot != 100) {
            return back()->withErrors(['komponen' => 'Total bobot semua komponen harus 100%']);
        }

        try {
            DB::beginTransaction();

            // Nonaktifkan rubrik lama jika ada
            RubrikPenilaian::where('tugas_praktikum_id', $tugasId)
                ->update(['is_active' => false]);

            // Buat rubrik baru
            $rubrik = RubrikPenilaian::create([
                'tugas_praktikum_id' => $tugasId,
                'nama_rubrik' => $request->nama_rubrik,
                'deskripsi' => $request->deskripsi,
                'bobot_total' => $totalBobot,
                'is_active' => true
            ]);

            // Buat komponen rubrik
            foreach ($request->komponen as $index => $komponen) {
                KomponenRubrik::create([
                    'rubrik_penilaian_id' => $rubrik->id,
                    'nama_komponen' => $komponen['nama_komponen'],
                    'deskripsi' => $komponen['deskripsi'] ?? null,
                    'bobot' => $komponen['bobot'],
                    'nilai_maksimal' => $komponen['nilai_maksimal'],
                    'urutan' => $index + 1
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Rubrik penilaian berhasil dibuat');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Show grading page
     */
    public function showGrading($tugasId)
    {
        $tugas = TugasPraktikum::with([
            'praktikum.kepengurusanLab.laboratorium',
            'rubrikAktif.komponenRubriks'
        ])->findOrFail($tugasId);

        if (!$tugas->rubrikAktif) {
            return redirect()->back()->withErrors(['error' => 'Belum ada rubrik penilaian untuk tugas ini']);
        }

        // Get all praktikan for this praktikum
        $praktikans = Praktikan::with(['user', 'praktikum'])
            ->where('praktikum_id', $tugas->praktikum_id)
            ->get();

        // Get pengumpulan tugas
        $pengumpulans = PengumpulanTugas::with(['praktikan.user'])
            ->where('tugas_praktikum_id', $tugasId)
            ->get()
            ->keyBy('praktikan_id');

        // Get existing nilai rubrik
        $nilaiRubriks = NilaiRubrik::with(['komponenRubrik'])
            ->whereIn('komponen_rubrik_id', $tugas->rubrikAktif->komponenRubriks->pluck('id'))
            ->get()
            ->groupBy(['praktikan_id', 'komponen_rubrik_id']);

        // Get nilai tambahan
        $nilaiTambahans = NilaiTambahan::where('tugas_praktikum_id', $tugasId)
            ->get()
            ->groupBy('praktikan_id');

        return Inertia::render('RubrikPenilaian/Grading', [
            'tugas' => $tugas,
            'praktikans' => $praktikans,
            'pengumpulans' => $pengumpulans,
            'nilaiRubriks' => $nilaiRubriks,
            'nilaiTambahans' => $nilaiTambahans
        ]);
    }

    /**
     * Store nilai rubrik
     */
    public function storeNilaiRubrik(Request $request)
    {
        $request->validate([
            'komponen_rubrik_id' => 'required|exists:komponen_rubriks,id',
            'praktikan_id' => 'required|exists:praktikan,id',
            'nilai' => 'required|numeric|min:0',
            'catatan' => 'nullable|string',
            'pengumpulan_tugas_id' => 'nullable|exists:pengumpulan_tugas,id'
        ]);

        // Validate nilai tidak melebihi nilai maksimal komponen
        $komponen = KomponenRubrik::findOrFail($request->komponen_rubrik_id);
        if ($request->nilai > $komponen->nilai_maksimal) {
            return response()->json([
                'success' => false,
                'message' => "Nilai tidak boleh melebihi {$komponen->nilai_maksimal}"
            ], 400);
        }

        // Update or create nilai rubrik
        $nilaiRubrik = NilaiRubrik::updateOrCreate(
            [
                'komponen_rubrik_id' => $request->komponen_rubrik_id,
                'praktikan_id' => $request->praktikan_id,
            ],
            [
                'pengumpulan_tugas_id' => $request->pengumpulan_tugas_id,
                'nilai' => $request->nilai,
                'catatan' => $request->catatan,
                'dinilai_oleh' => auth()->id(),
                'dinilai_at' => now()
            ]
        );

        // Update status pengumpulan tugas menjadi 'dinilai' jika ada pengumpulan
        if ($request->pengumpulan_tugas_id) {
            $pengumpulan = PengumpulanTugas::find($request->pengumpulan_tugas_id);
            if ($pengumpulan) {
                // Hitung total nilai dari semua komponen rubrik untuk praktikan ini
                $tugas = $pengumpulan->tugasPraktikum;
                $totalNilai = $this->hitungTotalNilaiRubrik($pengumpulan, $tugas);
                
                $pengumpulan->update([
                    'nilai' => $totalNilai,
                    'status' => 'dinilai',
                    'dinilai_at' => now()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Nilai berhasil disimpan',
            'data' => $nilaiRubrik
        ]);
    }

    /**
     * Hitung total nilai berdasarkan rubrik
     */
    private function hitungTotalNilaiRubrik($pengumpulan, $tugas)
    {
        $rubrik = $tugas->rubrikPenilaian;
        if (!$rubrik) {
            return 0;
        }

        $nilaiRubriks = NilaiRubrik::where('praktikan_id', $pengumpulan->praktikan_id)
            ->whereIn('komponen_rubrik_id', $rubrik->komponenRubriks->pluck('id'))
            ->get();

        $totalNilai = 0;
        foreach ($rubrik->komponenRubriks as $komponen) {
            $nilaiRubrik = $nilaiRubriks->where('komponen_rubrik_id', $komponen->id)->first();
            if ($nilaiRubrik) {
                // Normalisasi nilai ke skala 100 berdasarkan bobot
                $nilaiNormalisasi = ($nilaiRubrik->nilai / $komponen->nilai_maksimal) * 100;
                $totalNilai += ($nilaiNormalisasi * $komponen->bobot / 100);
            }
        }

        return round($totalNilai, 2);
    }

    /**
     * Store nilai tambahan
     */
    public function storeNilaiTambahan(Request $request)
    {
        $request->validate([
            'tugas_praktikum_id' => 'required|exists:tugas_praktikum,id',
            'praktikan_id' => 'required|exists:praktikan,id',
            'nilai' => 'required|numeric',
            'kategori' => 'required|string|max:50',
            'keterangan' => 'nullable|string'
        ]);

        $nilaiTambahan = NilaiTambahan::create([
            'tugas_praktikum_id' => $request->tugas_praktikum_id,
            'praktikan_id' => $request->praktikan_id,
            'nilai' => $request->nilai,
            'kategori' => $request->kategori,
            'keterangan' => $request->keterangan,
            'diberikan_oleh' => auth()->id(),
            'diberikan_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nilai tambahan berhasil ditambahkan',
            'data' => $nilaiTambahan
        ]);
    }

    /**
     * Delete nilai tambahan
     */
    public function deleteNilaiTambahan($id)
    {
        $nilaiTambahan = NilaiTambahan::findOrFail($id);
        $nilaiTambahan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Nilai tambahan berhasil dihapus'
        ]);
    }
}
