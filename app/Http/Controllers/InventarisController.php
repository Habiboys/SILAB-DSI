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
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        
        // Get the current kepengurusan lab based on selected lab
        $kepengurusanlab = null;
        if ($lab_id) {
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->first(); // Assuming one kepengurusan per lab
        }
        
        // Query inventaris
        $query = Aset::with('detailAset')
            ->where('laboratorium_id', $lab_id);
        
        // Apply search filter if provided
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Get paginated results
        $inventaris = $query->paginate($perPage)
            ->withQueryString();
        
        return Inertia::render('Inventaris', [
            'kepengurusanlab' => $kepengurusanlab,
            'inventaris' => $inventaris,
            'filters' => [
                'lab_id' => $lab_id,
                'search' => $search,
                'perPage' => $perPage,
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