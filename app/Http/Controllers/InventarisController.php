<?php

namespace App\Http\Controllers;

use App\Models\KategoriAset;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Exports\InventarisExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InventarisController extends Controller
{
    // Note: Authorization handled via route middleware
    
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $search = $request->input('search', '');
        $kategori_id = $request->input('kategori_id');
        $perPage = $request->input('perPage', 10);
        
        // Get the current kepengurusan lab based on selected lab
        $kepengurusanlab = null;
        if ($lab_id) {
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->first(); 
        }

        // Query Detail Aset (Items)
        $query = \App\Models\DetailAset::with(['kategoriAset'])
            ->whereHas('kategoriAset', function($q) use ($lab_id) {
                if ($lab_id) {
                    $q->where('laboratorium_id', $lab_id);
                }
            });

        // Filter by Category
        if ($kategori_id) {
            $query->where('kategori_aset_id', $kategori_id);
        }
        
        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('kode_barang', 'like', "%{$search}%")
                  ->orWhereHas('kategoriAset', function($subQ) use ($search) {
                      $subQ->where('nama', 'like', "%{$search}%");
                  });
            });
        }

        // Get paginated results
        $inventaris = $query->latest()->paginate($perPage)->withQueryString();
        
        // Get categories for filter dropdown
        $categories = $lab_id ? KategoriAset::where('laboratorium_id', $lab_id)->get() : [];
        
        return Inertia::render('Inventaris/Index', [
            'kepengurusanlab' => $kepengurusanlab,
            'inventaris' => $inventaris,
            'categories' => $categories,
            'filters' => [
                'lab_id' => $lab_id,
                'search' => $search,
                'perPage' => $perPage,
                'kategori_id' => $kategori_id,
            ],
        ]);
    }

    /**
     * Export inventaris data to Excel.
     */
    public function exportExcel(Request $request)
    {
        $lab_id = $request->input('lab_id');

        $lab = $lab_id ? Laboratorium::find($lab_id) : null;
        $labName = $lab ? $lab->nama : 'Semua Lab';

        $kategoriAsets = KategoriAset::with('detailAset')
            ->when($lab_id, fn($q) => $q->where('laboratorium_id', $lab_id))
            ->get();

        return Excel::download(
            new InventarisExport($labName, $kategoriAsets),
            'Inventaris_' . str_replace(' ', '_', $labName) . '.xlsx'
        );
    }
}