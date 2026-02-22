<?php

namespace App\Http\Controllers;

use App\Models\Proker;
use App\Models\Struktur;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProkerController extends Controller
{
    // Note: Authorization is handled via route middleware in Laravel 11
    // See routes/web.php for policy-based authorization
    
    public function index(Request $request)
    {
        $user = auth()->user();
        $currentLab = $user->getCurrentLab();
        
        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
    
        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } elseif (isset($currentLab['laboratorium'])) {
            $lab_id = $currentLab['laboratorium']->id;
        } else {
            $lab_id = $user->access_lab_id; 
        }
    
        $tahun_id = $request->input('tahun_id');
        
        $kepengurusanlab = null;
        
        // Try to get kepengurusan_lab by ID first (most efficient)
        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);
            
            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }
        // Fallback: lookup by lab_id + tahun_id
        else {
            if (!$tahun_id) {
                $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
                $tahun_id = $tahunAktif ? $tahunAktif->id : null;
            }
            
            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }
    
        // Get TahunKepengurusan data for dropdown
        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }
    
        $prokerData = [];
        $strukturList = [];
    
        if ($kepengurusanlab) {
            $prokerData = Proker::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with(['struktur', 'kepengurusanLab'])
                ->orderBy('created_at', 'desc')
                ->get();
                
            $strukturList = Struktur::orderBy('struktur')->get();
        }
    
        $laboratorium = Laboratorium::all();
        
        return Inertia::render('Proker', [
            'prokerData' => $prokerData,
            'kepengurusanlab' => $kepengurusanlab,
            'strukturList' => $strukturList,
            'tahunKepengurusan' => $tahunKepengurusan,
            'selectedTahun' => $tahun_id,
            'laboratorium' => $laboratorium,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'kepengurusan_lab_id' => $kepengurusanlab ? $kepengurusanlab->id : null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'lab_id' => 'required|exists:laboratorium,id', // Tambahkan validasi lab_id
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'struktur_id' => 'required|exists:struktur,id',
            'deskripsi' => 'required|string',
            'status' => 'required|in:belum_mulai,sedang_berjalan,selesai,ditunda',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'nullable|string',
            'file_proker' => 'nullable|file|mimes:pdf,doc,docx|max:2048', // Tambahkan validasi file
        ]);

        $data = $request->all();
        
        // Handle file upload jika ada
        if ($request->hasFile('file_proker')) {
            $file = $request->file('file_proker');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('proker', $fileName, 'public');
            $data['file_proker'] = $filePath;
        }
        
        Proker::create($data);

        return redirect()->back()->with('message', 'Program kerja berhasil ditambahkan.');
    }

    public function update(Request $request, Proker $proker)
    {
        $request->validate([
            'struktur_id' => 'required|exists:struktur,id',
            'deskripsi' => 'required|string',
            'status' => 'required|in:belum_mulai,sedang_berjalan,selesai,ditunda',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'nullable|string',
            'file_proker' => 'nullable|file|mimes:pdf,doc,docx|max:2048', // Tambahkan validasi file
        ]);

        $data = $request->except('kepengurusan_lab_id');
        
        // Handle file upload jika ada
        if ($request->hasFile('file_proker')) {
            // Hapus file lama jika ada
            if ($proker->file_proker) {
                \Storage::disk('public')->delete($proker->file_proker);
            }
            
            $file = $request->file('file_proker');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('proker', $fileName, 'public');
            $data['file_proker'] = $filePath;
        }
        
        $proker->update($data);

        return redirect()->back()->with('message', 'Program kerja berhasil diperbarui.');
    }

    public function destroy(Proker $proker)
    {
        $proker->delete();

        return redirect()->back()->with('message', 'Program kerja berhasil dihapus.');
    }
}
