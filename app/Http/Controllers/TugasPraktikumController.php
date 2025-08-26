<?php

namespace App\Http\Controllers;

use App\Models\TugasPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TugasPraktikumController extends Controller
{
    /**
     * Display a listing of tugas for a specific praktikum
     */
    public function index(Request $request, $praktikumId)
    {
        $praktikum = Praktikum::with([
            'kepengurusanLab.laboratorium',
            'kelas' => function($query) {
                $query->where('status', 'aktif')->orderBy('nama_kelas');
            }
        ])->findOrFail($praktikumId);
        
        // Get all tugas for this praktikum
        $allTugas = TugasPraktikum::with(['komponenRubriks', 'kelas'])
            ->where('praktikum_id', $praktikumId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Group tugas by kelas
        $tugasByKelas = [];
        foreach ($praktikum->kelas as $kelas) {
            $tugasByKelas[$kelas->id] = $allTugas->where('kelas_id', $kelas->id)->values();
        }

        // Tugas for all kelas (kelas_id is null)
        $tugasUmum = $allTugas->whereNull('kelas_id')->values();

        return Inertia::render('TugasPraktikum/Index', [
            'praktikum' => $praktikum,
            'tugas' => $allTugas, // For backward compatibility
            'tugasByKelas' => $tugasByKelas,
            'tugasUmum' => $tugasUmum,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium
        ]);
    }

    /**
     * Store a newly created tugas
     */
    public function store(Request $request, $praktikumId)
    {
        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
            'deadline' => 'required|date|after:today',
            'kelas_id' => 'nullable|exists:kelas,id', // Optional: if null, tugas for all kelas
        ]);

        $data = [
            'praktikum_id' => $praktikumId,
            'kelas_id' => $request->kelas_id,
            'judul_tugas' => $request->judul_tugas,
            'deskripsi' => $request->deskripsi,
            'deadline' => $request->deadline,
            'status' => 'aktif'
        ];

        if ($request->hasFile('file_tugas')) {
            $file = $request->file('file_tugas');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('public/tugas_praktikum', $filename);
            $data['file_tugas'] = $path;
        }

        TugasPraktikum::create($data);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil ditambahkan');
    }

    /**
     * Update tugas
     */
    public function update(Request $request, $id)
    {
        $tugas = TugasPraktikum::findOrFail($id);

        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'deadline' => 'required|date',
            'kelas_id' => 'nullable|exists:kelas,id',
            'status' => 'required|in:aktif,nonaktif'
        ]);

        $data = [
            'judul_tugas' => $request->judul_tugas,
            'deskripsi' => $request->deskripsi,
            'deadline' => $request->deadline,
            'kelas_id' => $request->kelas_id,
            'status' => $request->status
        ];

        if ($request->hasFile('file_tugas')) {
            // Delete old file
            if ($tugas->file_tugas) {
                Storage::delete($tugas->file_tugas);
            }
            
            $file = $request->file('file_tugas');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('public/tugas_praktikum', $filename);
            $data['file_tugas'] = $path;
        }

        $tugas->update($data);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil diubah');
    }

    /**
     * Remove tugas
     */
    public function destroy($id)
    {
        $tugas = TugasPraktikum::findOrFail($id);
        
        // Delete file if exists
        if ($tugas->file_tugas) {
            Storage::delete($tugas->file_tugas);
        }
        
        $tugas->delete();

        return redirect()->back()->with('success', 'Tugas praktikum berhasil dihapus');
    }

    /**
     * Download file tugas
     */
    public function downloadFile($id)
    {
        $tugas = TugasPraktikum::findOrFail($id);
        
        if (!$tugas->file_tugas || !Storage::exists($tugas->file_tugas)) {
            abort(404);
        }

        return Storage::download($tugas->file_tugas);
    }

    /**
     * Get tugas data for API
     */
    public function getTugas($praktikumId)
    {
        $tugas = TugasPraktikum::where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->orderBy('deadline')
            ->get();

        return response()->json($tugas);
    }
}
