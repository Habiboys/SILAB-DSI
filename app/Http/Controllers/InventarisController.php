<?php

namespace App\Http\Controllers;

use App\Models\Aset;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventarisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        
        // Get the current kepengurusan lab based on selected lab
        $kepengurusanlab = null;
        if ($lab_id) {
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->first(); // Assuming one kepengurusan per lab
        }
        
       

        $inventaris = Aset::with('detailAset')
        ->where('laboratorium_id', $request->lab_id)
        ->get();
        
        return Inertia::render('Inventaris', [
            'kepengurusanlab' => $kepengurusanlab,
            'inventaris' => $inventaris,
            'filters' => [
                'lab_id' => $lab_id,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);
        
        $kepengurusan = KepengurusanLab::findOrFail($request->kepengurusan_lab_id);
        
        $aset = new Aset();
        $aset->nama = $validated['nama'];
        $aset->deskripsi = $validated['deskripsi'] ?? null;
        $aset->jumlah = 0; // Set initial count to 0
        $aset->laboratorium_id = $kepengurusan->laboratorium_id;
        $aset->save();
        
        return redirect()->back()->with('message', 'Data inventaris berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);
        
        $aset = Aset::findOrFail($id);
        $aset->nama = $validated['nama'];
        $aset->deskripsi = $validated['deskripsi'] ?? null;
        $aset->save();
        
        return redirect()->back()->with('message', 'Data inventaris berhasil diperbarui');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $aset = Aset::findOrFail($id);
        $aset->delete();
        
        return redirect()->back()->with('message', 'Data inventaris berhasil dihapus');
    }
}