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
        $lab_id     = $request->input('lab_id');
        $search     = $request->input('search', '');
        $kategori_id = $request->input('kategori_id');
        $perPage    = $request->input('perPage', 10);

        // Get the current kepengurusan lab based on selected lab
        $kepengurusanlab = null;
        if ($lab_id) {
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)->first();
        }

        // Query Detail Aset – filter langsung pada detail_aset.laboratorium_id
        $query = \App\Models\DetailAset::with(['kategoriAset', 'peminjamanAktif', 'wishlistAset.permohonanAset']);

        if ($lab_id) {
            $query->where('laboratorium_id', $lab_id);
        }

        // Filter by Category
        if ($kategori_id) {
            $query->where('kategori_aset_id', $kategori_id);
        }

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode_barang', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%")
                  ->orWhereHas('kategoriAset', function ($subQ) use ($search) {
                      $subQ->where('nama', 'like', "%{$search}%");
                  });
            });
        }

        $inventaris = $query->latest()->paginate($perPage)->withQueryString();

        // Kategori sekarang global (tidak per-lab)
        $categories = KategoriAset::orderBy('nama')->get(['id', 'nama']);

        // Approved wishlist items (for linking when registering new asset)
        $approvedWishlist = \App\Models\WishlistAset::with('permohonanAset:id,nomor_permohonan')
            ->whereIn('status_item', ['disetujui_kadep', 'dipesan'])
            ->when($lab_id, function ($q) use ($lab_id) {
                $q->whereHas('permohonanAset', fn($pq) => $pq->where('laboratorium_id', $lab_id));
            })
            ->get(['id', 'permohonan_aset_id', 'nama_barang', 'jenis_barang', 'spesifikasi_teknis',
                   'perkiraan_harga', 'jumlah_diminta', 'jumlah_disetujui', 'satuan', 'status_item', 'catatan_item']);

        return Inertia::render('Inventaris/Index', [
            'kepengurusanlab' => $kepengurusanlab,
            'inventaris'      => $inventaris,
            'categories'      => $categories,
            'approvedWishlist' => $approvedWishlist,
            'filters' => [
                'lab_id'      => $lab_id,
                'search'      => $search,
                'perPage'     => $perPage,
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

        $lab     = $lab_id ? Laboratorium::find($lab_id) : null;
        $labName = $lab ? $lab->nama : 'Semua Lab';

        // Fetch categories that have detail_aset in this lab
        $kategoriAsets = KategoriAset::with(['detailAset' => function ($q) use ($lab_id) {
            if ($lab_id) {
                $q->where('laboratorium_id', $lab_id);
            }
        }])->get();

        return Excel::download(
            new InventarisExport($labName, $kategoriAsets),
            'Inventaris_' . str_replace(' ', '_', $labName) . '.xlsx'
        );
    }
}
