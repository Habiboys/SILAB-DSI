<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KepengurusanLabController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $kepengurusanLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                            ->where('laboratorium_id', $lab_id)
                            ->get();

        $tahunKepengurusan = TahunKepengurusan::all();
        
        return Inertia::render('KepengurusanLab', [
            'kepengurusanLab' => $kepengurusanLab,
            'tahunKepengurusan' => $tahunKepengurusan,

        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tahun_kepengurusan_id' => ['required', 'exists:tahun_kepengurusan,id'],
            'laboratorium_id' => ['required', 'exists:laboratorium,id'],
            'sk' => ['nullable', 'file', 'mimes:pdf', 'max:5120'], // 5MB maksimum
        ]);
    
        // Cek apakah sudah ada kepengurusan dengan tahun dan lab yang sama
        $existingKepengurusan = KepengurusanLab::where('tahun_kepengurusan_id', $validated['tahun_kepengurusan_id'])
            ->where('laboratorium_id', $validated['laboratorium_id'])
            ->first();
            
        if ($existingKepengurusan) {
            // Use Inertia's withErrors method for validation errors
            return redirect()->back()
                ->withErrors(['duplicate' => 'Periode kepengurusan untuk laboratorium dan tahun yang sama sudah ada.']);
        }
    
        $kepengurusanLab = new KepengurusanLab();
        $kepengurusanLab->tahun_kepengurusan_id = $validated['tahun_kepengurusan_id'];
        $kepengurusanLab->laboratorium_id = $validated['laboratorium_id'];
    
        // Cek apakah ada file SK yang diupload
        if ($request->hasFile('sk')) {
            $skFile = $request->file('sk');
            $skPath = $skFile->store('kepengurusan_lab/sk', 'public');
            $kepengurusanLab->sk = $skPath;
        }
    
        $kepengurusanLab->save();
    
        return redirect()->route('kepengurusan-lab.index')
            ->with('message', 'Kepengurusan Lab berhasil ditambahkan.');
    }
    
    /**
     * Update the specified resource in storage.
     */
    
     public function update(Request $request, $id)
     {
         // Validate the request
         $request->validate([
             'sk' => 'required|file|mimes:pdf|max:5120', // 5MB max
         ]);
     
         $kepengurusan = KepengurusanLab::findOrFail($id);
         
    
         $oldFilePath = $kepengurusan->sk;
         
         $filePath = $request->file('sk')->store('kepengurusan_lab/sk', 'public');
         
      
         $kepengurusan->sk = $filePath;
         $kepengurusan->save();
         
         // Delete the old file if it exists and is different from the new one
         if ($oldFilePath && $oldFilePath !== $filePath && Storage::disk('public')->exists($oldFilePath)) {
             Storage::disk('public')->delete($oldFilePath);
         }
         
         return redirect()->back()->with('message', 'SK Kepengurusan Lab berhasil diperbarui');
     }

    /**
     * Remove the specified resource from storage.
     */

    /**
     * Download SK file
     */
    public function downloadSk(KepengurusanLab $kepengurusanLab)
    {
        if (!$kepengurusanLab->sk) {
            return back()->with('error', 'File SK tidak ditemukan');
        }
        
        return response()->download(storage_path('app/public/' . $kepengurusanLab->sk));
    }
}