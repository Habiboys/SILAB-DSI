<?php

namespace App\Http\Controllers;

use App\Models\Aset;
use App\Models\DetailAset;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DetailInventarisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index($id)
    {
        $aset = Aset::with('detailAset')->findOrFail($id);
        
        return Inertia::render('DetailInventaris', [
            'aset' => $aset
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'aset_id' => 'required|exists:aset,id',
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang',
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam'
        ]);

        DetailAset::create($validated);

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil ditambahkan');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $detailAset = DetailAset::findOrFail($id);

        $validated = $request->validate([
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang,'.$id,
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam'
        ]);

        $detailAset->update($validated);

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $detailAset = DetailAset::findOrFail($id);
        $detailAset->delete();

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil dihapus');
    }
}
