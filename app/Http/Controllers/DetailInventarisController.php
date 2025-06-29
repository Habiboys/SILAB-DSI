<?php

namespace App\Http\Controllers;

use App\Models\Aset;
use App\Models\DetailAset;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class DetailInventarisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $id)
    {
        $aset = Aset::findOrFail($id);
        
        $perPage = $request->input('perPage', 10);
        $searchTerm = $request->input('search', '');
        
        $detailAsets = DetailAset::where('aset_id', $id)
            ->when($searchTerm, function($query) use ($searchTerm) {
                return $query->where(function($q) use ($searchTerm) {
                    $q->where('kode_barang', 'like', "%{$searchTerm}%")
                      ->orWhere('keadaan', 'like', "%{$searchTerm}%")
                      ->orWhere('status', 'like', "%{$searchTerm}%");
                });
            })
            ->paginate($perPage)
            ->withQueryString();
        
        return Inertia::render('DetailInventaris', [
            'aset' => $aset,
            'detailAsets' => $detailAsets,
            'filters' => [
                'search' => $searchTerm,
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
            'aset_id' => 'required|exists:aset,id',
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang',
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam',
            'foto' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('foto')) {
            // Store the file in the public disk under detail-aset directory
            $path = $request->file('foto')->store('detail-aset', 'public');
            $validated['foto'] = $path;
        }

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
        
        // Log request data untuk debugging
        \Log::info('Update request data:', [
            'request_data' => $request->all(),
            'files' => $request->allFiles(),
            'headers' => $request->headers->all()
        ]);

        $validated = $request->validate([
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang,'.$id,
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam',
            'foto' => 'nullable|image|max:2048'
        ], [
            'kode_barang.required' => 'Kode barang harus diisi',
            'kode_barang.unique' => 'Kode barang sudah digunakan',
            'keadaan.required' => 'Keadaan barang harus dipilih',
            'keadaan.in' => 'Keadaan barang harus baik atau rusak',
            'status.required' => 'Status barang harus dipilih',
            'status.in' => 'Status barang harus tersedia atau dipinjam',
            'foto.image' => 'File harus berupa gambar',
            'foto.max' => 'Ukuran file tidak boleh lebih dari 2MB'
        ]);

        if ($request->hasFile('foto')) {
            // Delete old image if exists
            if ($detailAset->foto) {
                Storage::disk('public')->delete($detailAset->foto);
            }
            
            // Store the new file
            $path = $request->file('foto')->store('detail-aset', 'public');
            $validated['foto'] = $path;
        }

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
        
        // Delete the image file if exists
        if ($detailAset->foto) {
            Storage::disk('public')->delete($detailAset->foto);
        }
        
        $detailAset->delete();

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil dihapus');
    }
}
