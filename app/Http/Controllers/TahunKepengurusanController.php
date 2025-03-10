<?php

namespace App\Http\Controllers;

use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TahunKepengurusanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tahunKepengurusan = TahunKepengurusan::all();
        
        return Inertia::render('TahunKepengurusan', [
            'tahunKepengurusan' => $tahunKepengurusan
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validasi input tahun menggunakan regex
        $request->validate([
            'tahun' => ['required', 'string', 'regex:/^\d{4}\/\d{4}$/', 'unique:tahun_kepengurusan'],
            'mulai' => ['required', 'string'],
            'selesai' => ['required', 'string'],
            'isactive' => 'required|boolean',
        ]);
    
        // Pastikan hanya satu record aktif
        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->update(['isactive' => false]);
        }
    
        // Simpan data baru
        TahunKepengurusan::create($request->all());
    
        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil ditambahkan.');
    }
    
    public function update(Request $request, TahunKepengurusan $tahunKepengurusan)
    {
        // Validasi input tahun menggunakan regex
        $request->validate([
            'tahun' => ['required', 'string', 'regex:/^\d{4}\/\d{4}$/', 'unique:tahun_kepengurusan,tahun,' . $tahunKepengurusan->id],
            'mulai' => ['required', 'string'],
            'selesai' => ['required', 'string'],
            'isactive' => 'required|boolean',
        ]);
    
        // Pastikan hanya satu record aktif
        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->where('id', '!=', $tahunKepengurusan->id)->update(['isactive' => false]);
        }
    
        // Update data
        $tahunKepengurusan->update($request->all());
    
        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil diperbarui.');
    }
 

    /**
     * Update the specified resource in storage.
     */


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TahunKepengurusan $tahunKepengurusan)
    {
        $tahunKepengurusan->delete();

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil dihapus.');
    }
}