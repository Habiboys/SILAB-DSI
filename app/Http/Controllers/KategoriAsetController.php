<?php

namespace App\Http\Controllers;

use App\Models\KategoriAset;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KategoriAsetController extends Controller
{

    public function index(Request $request)
    {
        $search  = $request->input('search', '');
        $perPage = $request->input('perPage', 10);

        $query = KategoriAset::withCount('detailAset');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $inventaris = $query->orderBy('nama')->paginate($perPage)->withQueryString();

        return Inertia::render('DataMaster/KategoriAset/Index', [
            'inventaris' => $inventaris,
            'filters' => [
                'search'  => $search,
                'perPage' => $perPage,
            ],
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        KategoriAset::create($validated);

        return redirect()->back()->with('message', 'Kategori aset berhasil ditambahkan');
    }


    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        KategoriAset::findOrFail($id)->update($validated);

        return redirect()->back()->with('message', 'Kategori aset berhasil diperbarui');
    }


    public function destroy($id)
    {
        KategoriAset::findOrFail($id)->delete();

        return redirect()->back()->with('message', 'Kategori aset berhasil dihapus');
    }


    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'string']);
        $count = KategoriAset::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('message', $count . ' kategori aset berhasil dihapus.');
    }
}
