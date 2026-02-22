<?php

namespace App\Http\Controllers;

use App\Models\PertemuanPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AbsensiPraktikanExport;
use App\Exports\AbsensiAslabExport;

class PertemuanPraktikumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Praktikum $praktikum)
    {
        $praktikum->load(['pertemuan.modul', 'pertemuan.absensiPraktikan', 'pertemuan.absensiAslab', 'pertemuan.kelas']);
        $praktikum->load('kelas'); // Load available classes for dropdown
        
        return Inertia::render('Pertemuan/Index', [
            'praktikum' => $praktikum,
            'pertemuan' => $praktikum->pertemuan,
            'kelas' => $praktikum->kelas // Pass available classes
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tanggal' => 'required|date',
            'kelas_id' => 'required|exists:kelas,id' // Validate kelas_id
        ]);

        PertemuanPraktikum::create([
            'praktikum_id' => $praktikum->id,
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'kelas_id' => $request->kelas_id, // Save kelas_id
        ]);

        return redirect()->back()->with('message', 'Pertemuan berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PertemuanPraktikum $pertemuan)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tanggal' => 'required|date',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        $pertemuan->update([
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'kelas_id' => $request->kelas_id,
        ]);

        return redirect()->back()->with('message', 'Pertemuan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PertemuanPraktikum $pertemuan)
    {
        // Check dependencies (modul, absensi) if needed, but for now cascade delete or soft delete logic inside model is assumed or just force delete.
        // Assuming database cascade or simple delete.
        
        $pertemuan->delete();

        return redirect()->back()->with('message', 'Pertemuan berhasil dihapus.');
    }

    public function exportPraktikan(Request $request, Praktikum $praktikum, $kelasId)
    {
        return Excel::download(new AbsensiPraktikanExport($praktikum->id, $kelasId), 'absensi_praktikan.xlsx');
    }

    public function exportAslab(Request $request, Praktikum $praktikum, $kelasId)
    {
        return Excel::download(new AbsensiAslabExport($praktikum->id, $kelasId), 'absensi_aslab.xlsx');
    }
}
