<?php

namespace App\Http\Controllers;

use App\Models\TugasPraktikum;
use App\Models\KomponenRubrik;
use App\Models\NilaiTambahan;
use App\Models\Praktikan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KomponenRubrikController extends Controller
{
    public function index(TugasPraktikum $tugas)
    {
        $tugas->load([
            'praktikum.praktikans.user', // Load praktikan dengan user data (many-to-many)
            'komponenRubriks' => function($query) {
                $query->orderBy('urutan');
            },
            'nilaiTambahans.praktikan.user' // Load nilai tambahan yang sudah ada
        ]);

        return Inertia::render('KomponenRubrik/Index', [
            'tugas' => $tugas
        ]);
    }

    public function store(Request $request, TugasPraktikum $tugas)
    {
        $request->validate([
            'nama_komponen' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'bobot' => 'required|numeric|min:0|max:100',
            'nilai_maksimal' => 'required|numeric|min:0|max:100',
        ]);

        // Validasi total bobot tidak boleh melebihi 100%
        $currentTotal = (float) $tugas->komponenRubriks()->sum('bobot');
        $newTotal = $currentTotal + (float) $request->bobot;
        if ($newTotal > 100) {
            return redirect()->back()->withErrors([
                'bobot' => 'Total bobot komponen tidak boleh melebihi 100% (saat ini: ' . $currentTotal . '%, tambah: ' . $request->bobot . '%)'
            ])->withInput();
        }

        // Get the next urutan
        $nextUrutan = $tugas->komponenRubriks()->max('urutan') + 1;

        KomponenRubrik::create([
            'tugas_praktikum_id' => $tugas->id,
            'nama_komponen' => $request->nama_komponen,
            'deskripsi' => $request->deskripsi,
            'bobot' => $request->bobot,
            'nilai_maksimal' => $request->nilai_maksimal,
            'urutan' => $nextUrutan,
        ]);

        return redirect()->back()->with('success', 'Komponen rubrik berhasil ditambahkan');
    }

    public function update(Request $request, TugasPraktikum $tugas, KomponenRubrik $komponen)
    {
        $request->validate([
            'nama_komponen' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'bobot' => 'required|numeric|min:0|max:100',
            'nilai_maksimal' => 'required|numeric|min:0|max:100',
        ]);

        // Validasi total bobot tidak boleh melebihi 100% saat update
        $currentTotalWithoutThis = (float) $tugas->komponenRubriks()
            ->where('id', '!=', $komponen->id)
            ->sum('bobot');
        $newTotal = $currentTotalWithoutThis + (float) $request->bobot;
        if ($newTotal > 100) {
            return redirect()->back()->withErrors([
                'bobot' => 'Total bobot komponen tidak boleh melebihi 100% (tanpa komponen ini: ' . $currentTotalWithoutThis . '%, nilai baru: ' . $request->bobot . '%)'
            ])->withInput();
        }

        $komponen->update([
            'nama_komponen' => $request->nama_komponen,
            'deskripsi' => $request->deskripsi,
            'bobot' => $request->bobot,
            'nilai_maksimal' => $request->nilai_maksimal,
        ]);

        return redirect()->back()->with('success', 'Komponen rubrik berhasil diperbarui');
    }

    public function destroy(TugasPraktikum $tugas, KomponenRubrik $komponen)
    {
        $komponen->delete();
        return redirect()->back()->with('success', 'Komponen rubrik berhasil dihapus');
    }

    public function updateUrutan(Request $request, TugasPraktikum $tugas)
    {
        $request->validate([
            'komponen_ids' => 'required|array',
            'komponen_ids.*' => 'required|exists:komponen_rubrik,id'
        ]);

        foreach ($request->komponen_ids as $index => $komponenId) {
            KomponenRubrik::where('id', $komponenId)
                ->where('tugas_praktikum_id', $tugas->id)
                ->update(['urutan' => $index + 1]);
        }

        return redirect()->back()->with('success', 'Urutan komponen berhasil diperbarui');
    }

    // Method untuk nilai tambahan
    public function storeNilaiTambahan(Request $request, TugasPraktikum $tugas)
    {
        $request->validate([
            'praktikan_id' => 'required|exists:praktikan,id',
            'nilai' => 'required|numeric|min:0',
            'kategori' => 'required|string|max:50',
            'keterangan' => 'nullable|string'
        ]);

        try {
            $nilaiTambahan = NilaiTambahan::create([
                'tugas_praktikum_id' => $tugas->id,
                'praktikan_id' => $request->praktikan_id,
                'nilai' => $request->nilai,
                'kategori' => $request->kategori,
                'keterangan' => $request->keterangan,
                'diberikan_oleh' => auth()->id(),
                'diberikan_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Nilai tambahan berhasil diberikan',
                'data' => $nilaiTambahan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan nilai tambahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteNilaiTambahan(TugasPraktikum $tugas, NilaiTambahan $nilai)
    {
        try {
            $nilai->delete();
            return response()->json([
                'success' => true,
                'message' => 'Nilai tambahan berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus nilai tambahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getNilaiTambahan(TugasPraktikum $tugas, Praktikan $praktikan)
    {
        try {
            $nilaiTambahans = NilaiTambahan::where('tugas_praktikum_id', $tugas->id)
                ->where('praktikan_id', $praktikan->id)
                ->with(['praktikan.user', 'diberikanOleh'])
                ->orderBy('diberikan_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $nilaiTambahans
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data nilai tambahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateNilaiTambahan(Request $request, TugasPraktikum $tugas, NilaiTambahan $nilai)
    {
        $request->validate([
            'nilai' => 'required|numeric|min:0',
            'kategori' => 'required|string|max:50',
            'keterangan' => 'nullable|string'
        ]);

        try {
            $nilai->update([
                'nilai' => $request->nilai,
                'kategori' => $request->kategori,
                'keterangan' => $request->keterangan,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Nilai tambahan berhasil diperbarui',
                'data' => $nilai
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui nilai tambahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
