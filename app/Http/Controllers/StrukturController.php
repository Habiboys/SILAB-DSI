<?php

namespace App\Http\Controllers;

use App\Models\Struktur;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class StrukturController extends Controller
{
    
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        // Jika tidak ada tahun yang dipilih, gunakan tahun aktif
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();
        
        $struktur = [];
        $kepengurusanlab = null;

        if ($lab_id && $tahun_id) {
            // Cari kepengurusan lab berdasarkan lab_id dan tahun_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            // Jika kepengurusan lab ditemukan, ambil strukturnya
            if ($kepengurusanlab) {
                $struktur = Struktur::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->with('users')
                    ->get();
                
                // Add file path URL to each struktur item
                foreach ($struktur as $item) {
                    $item->proker_path = $item->proker ? Storage::url($item->proker) : null;
                }
            }
        }

        return Inertia::render('Struktur', [
            'struktur' => $struktur,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ]
        ]);
    }
    
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'struktur' => 'required|string|max:255',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'proker' => 'nullable|file|mimes:pdf|max:5120',
            'tipe_jabatan' => 'required|in:dosen,asisten', // Add this line
        ]);
    
        $data = [
            'struktur' => $validatedData['struktur'],
            'kepengurusan_lab_id' => $validatedData['kepengurusan_lab_id'],
            'tipe_jabatan' => $validatedData['tipe_jabatan'], // Add this line
        ];
    
        if ($request->hasFile('proker')) {
            $path = $request->file('proker')->store('proker', 'public');
            $data['proker'] = $path;
        }
    
        Struktur::create($data);
        return back()->with('message', 'Struktur berhasil ditambahkan');
    }
    
    public function update(Request $request, Struktur $struktur)
    {
        $validatedData = $request->validate([
            'struktur' => 'required|string|max:255',
            'proker' => 'nullable|file|mimes:pdf|max:5120',
            'tipe_jabatan' => 'required|in:dosen,asisten', // Add this line
        ]);
    
        $data = [
            'struktur' => $validatedData['struktur'],
            'tipe_jabatan' => $validatedData['tipe_jabatan'], // Add this line
        ];
    
        if ($request->hasFile('proker')) {
            if ($struktur->proker) {
                Storage::disk('public')->delete($struktur->proker);
            }
            $path = $request->file('proker')->store('proker', 'public');
            $data['proker'] = $path;
        }
    
        $struktur->update($data);
        return back()->with('message', 'Struktur berhasil diperbarui');
    }
    
    public function destroy(Struktur $struktur)
    {
        // Delete associated file if exists
        if ($struktur->proker) {
            Storage::disk('public')->delete($struktur->proker);
        }
        
        $struktur->delete();

        return back()->with('message', 'Struktur berhasil dihapus');
    }
}