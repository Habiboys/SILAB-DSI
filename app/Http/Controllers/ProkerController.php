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
    public function index(Request $request)
    {
        $user = auth()->user();
        $currentLab = $user->getCurrentLab();
    
        // If user has all_access, they can see all labs or filter by lab_id
        if (isset($currentLab['all_access'])) {
            $lab_id = $request->input('lab_id');
        } else {
            // Regular users can only see their own lab
            $lab_id = $user->laboratory_id;
        }
    
        $tahun_id = $request->input('tahun_id');
    
        // Get TahunKepengurusan data
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        } else {
            $tahunKepengurusan = collect();
        }
    
        // If no tahun_id selected, use active year
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }
    
        $prokerData = [];
        $kepengurusanlab = null;
        $strukturList = [];
    
        if ($lab_id && $tahun_id) {
            // Find kepengurusan lab
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();
                
            if ($kepengurusanlab) {
                // Get proker data
                $prokerData = Proker::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->with(['struktur', 'kepengurusanLab'])
                    ->orderBy('created_at', 'desc')
                    ->get();
                    
                // Get all struktur for dropdown
                $strukturList = Struktur::orderBy('struktur')->get();
            }
        }
    
        // Get laboratorium data
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
