<?php

namespace App\Http\Controllers;

use App\Models\KategoriAset;
use App\Models\DetailAset;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class DetailInventarisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $id)
    {
        $aset = KategoriAset::findOrFail($id);
        
        $perPage = $request->input('perPage', 10);
        $searchTerm = $request->input('search', '');
        
        $detailAsets = DetailAset::where('kategori_aset_id', $id)
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
     * Generate QR Code for a detail aset item and save to storage.
     */
    private function generateQrCode(DetailAset $detailAset): string
    {
        $detailAset->load('kategoriAset.laboratorium');

        // QR encodes the public detail URL
        $url = route('aset.public-detail', $detailAset->id);

        // Generate QR as SVG (no imagick required)
        $qrSvg = QrCode::format('svg')
            ->size(300)
            ->margin(1)
            ->errorCorrection('H')
            ->generate($url);

        $filename = 'qrcodes/' . $detailAset->id . '.svg';
        Storage::disk('public')->put($filename, $qrSvg);

        return $filename;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategori_aset_id' => 'required|exists:kategori_aset,id',
            'nama' => 'nullable|string|max:255', // Added nama
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang',
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam',
            'foto' => 'required|image|max:2048'
        ], [
            'kategori_aset_id.required' => 'ID kategori aset harus diisi',
            'kategori_aset_id.exists' => 'Kategori Aset tidak ditemukan',
            'nama.max' => 'Nama barang maksimal 255 karakter',
            'kode_barang.required' => 'Kode barang harus diisi',
            'kode_barang.unique' => 'Kode barang sudah digunakan',
            'keadaan.required' => 'Keadaan barang harus dipilih',
            'keadaan.in' => 'Keadaan barang harus baik atau rusak',
            'status.required' => 'Status barang harus dipilih',
            'status.in' => 'Status barang harus tersedia atau dipinjam',
            'foto.required' => 'Foto barang wajib diupload',
            'foto.image' => 'File harus berupa gambar',
            'foto.max' => 'Ukuran file tidak boleh lebih dari 2MB'
        ]);

        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('detail-aset', 'public');
            $validated['foto'] = $path;
        }

        $detailAset = DetailAset::create($validated);

        // Auto-generate QR Code
        try {
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        } catch (\Exception $e) {
            \Log::error('QR Code generation failed: ' . $e->getMessage());
        }

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
            'nama' => 'nullable|string|max:255', // Added nama
            'kode_barang' => 'required|string|max:255|unique:detail_aset,kode_barang,'.$id,
            'keadaan' => 'required|in:baik,rusak',
            'status' => 'required|in:tersedia,dipinjam',
            'foto' => 'nullable|image|max:2048'
        ], [
            'nama.max' => 'Nama barang maksimal 255 karakter',
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
            if ($detailAset->foto) {
                Storage::disk('public')->delete($detailAset->foto);
            }
            $path = $request->file('foto')->store('detail-aset', 'public');
            $validated['foto'] = $path;
        } else {
            $validated['foto'] = $detailAset->foto;
        }

        $detailAset->update($validated);

        // Regenerate QR Code
        try {
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        } catch (\Exception $e) {
            \Log::error('QR Code regeneration failed: ' . $e->getMessage());
        }

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $detailAset = DetailAset::findOrFail($id);
        
        // Delete the image file
        if ($detailAset->foto) {
            Storage::disk('public')->delete($detailAset->foto);
        }
        
        // Delete the QR Code file
        if ($detailAset->qr_code_path) {
            Storage::disk('public')->delete($detailAset->qr_code_path);
        }
        
        $detailAset->delete();

        return redirect()->back()
                ->with('message', 'Detail inventaris berhasil dihapus');
    }

    /**
     * Download QR Code as SVG.
     */
    public function downloadQr($id)
    {
        $detailAset = DetailAset::with('kategoriAset')->findOrFail($id);

        if (!$detailAset->qr_code_path || !Storage::disk('public')->exists($detailAset->qr_code_path)) {
            // Generate if not exists
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        }

        $filename = 'QR_' . $detailAset->kode_barang . '.svg';
        return Storage::disk('public')->download($detailAset->qr_code_path, $filename);
    }

    /**
     * Download QR Label as PDF (QR + asset info for printing/sticking).
     */
    public function downloadLabel($id)
    {
        $detailAset = DetailAset::with('kategoriAset.laboratorium')->findOrFail($id);

        // Ensure QR code exists
        if (!$detailAset->qr_code_path || !Storage::disk('public')->exists($detailAset->qr_code_path)) {
            $qrPath = $this->generateQrCode($detailAset);
            $detailAset->update(['qr_code_path' => $qrPath]);
        }

        // For the label PDF, embed SVG as base64 data URI in img tag
        $qrSvgContent = Storage::disk('public')->get($detailAset->qr_code_path);
        $qrDataUri = 'data:image/svg+xml;base64,' . base64_encode($qrSvgContent);

        $pdf = Pdf::loadView('exports.label-aset', [
            'aset' => $detailAset,
            'qrDataUri' => $qrDataUri,
        ])->setPaper([0, 0, 283.46, 70.87], 'portrait'); // 100mm x 25mm strip

        $filename = 'Label_' . $detailAset->kode_barang . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Regenerate QR Code for a specific asset.
     */
    public function regenerateQr($id)
    {
        $detailAset = DetailAset::findOrFail($id);

        // Delete old QR if exists
        if ($detailAset->qr_code_path) {
            Storage::disk('public')->delete($detailAset->qr_code_path);
        }

        $qrPath = $this->generateQrCode($detailAset);
        $detailAset->update(['qr_code_path' => $qrPath]);

        return redirect()->back()
                ->with('message', 'QR Code berhasil di-regenerate');
    }

    /**
     * Public detail page for scanned QR code.
     */
    public function publicDetail($id)
    {
        $detailAset = DetailAset::with('kategoriAset.laboratorium')->findOrFail($id);

        return Inertia::render('Inventaris/PublicDetail', [
            'aset' => $detailAset,
            'kategori' => $detailAset->kategoriAset,
            'laboratorium' => $detailAset->kategoriAset->laboratorium ?? null,
        ]);
    }

    /**
     * Bulk delete multiple assets.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'string']);

        $items = DetailAset::whereIn('id', $request->ids)->get();

        foreach ($items as $item) {
            // Delete photo
            if ($item->foto && Storage::disk('public')->exists($item->foto)) {
                Storage::disk('public')->delete($item->foto);
            }
            // Delete QR
            if ($item->qr_code_path && Storage::disk('public')->exists($item->qr_code_path)) {
                Storage::disk('public')->delete($item->qr_code_path);
            }
            $item->delete();
        }

        return redirect()->back()->with('message', count($items) . ' aset berhasil dihapus.');
    }

    /**
     * Download batch labels as A4 PDF (multiple labels per page).
     */
    public function batchLabels(Request $request)
    {
        // Increase limits for large batch generation
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        try {
            $request->validate([
                'scope' => 'nullable|in:selected,all',
                'ids' => 'required_if:scope,selected|array', 
                'ids.*' => 'string',
                'layout' => 'nullable|string|in:standard,medium,small,mini',
                'show_qr' => 'nullable',
                // Filters validation
                'search' => 'nullable|string',
                'kategori_id' => 'nullable|exists:kategori_aset,id',
                'lab_id' => 'nullable|exists:laboratorium,id',
            ]);

            $layout = $request->input('layout', 'standard');
            $showQr = $request->boolean('show_qr', true);
            $scope = $request->input('scope', 'selected');

            $query = DetailAset::with('kategoriAset.laboratorium');

            if ($scope === 'all') {
                // Apply filters similar to index
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function ($q) use ($search) {
                        $q->where('kode_barang', 'like', "%{$search}%")
                          ->orWhere('nama', 'like', "%{$search}%")
                          ->orWhereHas('kategoriAset', function ($q) use ($search) {
                              $q->where('nama', 'like', "%{$search}%");
                          });
                    });
                }
                if ($request->filled('kategori_id')) {
                    $query->where('kategori_aset_id', $request->kategori_id);
                }
                if ($request->filled('lab_id')) {
                    $query->whereHas('kategoriAset', function ($q) use ($request) {
                        $q->where('laboratorium_id', $request->lab_id);
                    });
                }
            } else {
                // Selected IDs
                $query->whereIn('id', $request->ids);
            }

            // Limit to prevent crashing if too many (e.g. 1000 max for now?) 
            // Or just let it run with higher limits. 
            // Let's add reasonable limit or chunking if needed, but PDF gen is memory heavy.
            // For now, let's limit to say 500 to be safe, or just let it rip.
            // Given "Download Semua", user implies ALL. 
            $detailAsets = $query->get();
            
            if ($detailAsets->isEmpty()) {
                return redirect()->back()->with('error', 'Tidak ada data aset yang ditemukan.');
            }
            
            // Check if too many items for PDF
            if ($detailAsets->count() > 1000) {
                 return redirect()->back()->with('error', 'Terlalu banyak data (' . $detailAsets->count() . '). Mohon filter data terlebih dahulu (maksimal 1000).');
            }

            $items = [];
            foreach ($detailAsets as $aset) {
                try {
                    // Ensure QR exists only if we need to show it, or always generate?
                    // Better to always generate in case they change their mind, but for performance we could skip.
                    // Let's keep generating it for consistency, or maybe skip if showQr is false to save time?
                    // User might want to verify QR exists even if not printing it now.
                    // But if speed is issue, skipping is better. 
                    // Let's keep logic simple: generate if missing.
                    if (!$aset->qr_code_path || !Storage::disk('public')->exists($aset->qr_code_path)) {
                        $qrPath = $this->generateQrCode($aset);
                        $aset->update(['qr_code_path' => $qrPath]);
                    }

                    // Use absolute path for faster rendering (no base64 overhead)
                    $qrAbsolutePath = Storage::disk('public')->path($aset->qr_code_path);
                    
                    // If showing QR, check file exists
                    if ($showQr && !file_exists($qrAbsolutePath)) {
                        continue; 
                    }

                    $items[] = [
                        'qrPath' => $qrAbsolutePath, 
                        'nama' => $aset->nama ?? $aset->kategoriAset->nama, // Use specific name or fallback to category
                        'kategori' => $aset->kategoriAset->nama ?? '-',
                        'kode_barang' => $aset->kode_barang ?? '-',
                        'lab' => $aset->kategoriAset->laboratorium->nama ?? '-',
                        'tanggal' => $aset->created_at ? $aset->created_at->format('d/m/Y') : '-',
                    ];
                } catch (\Exception $e) {
                    \Log::error("Error processing asset ID {$aset->id} for label: " . $e->getMessage());
                    continue;
                }
            }

            if (empty($items)) {
                return redirect()->back()->with('error', 'Gagal memproses label. Pastikan data valid.');
            }

            $pdf = Pdf::loadView('exports.label-aset-batch', [
                'items' => collect($items),
                'layout' => $layout,
                'showQr' => $showQr
            ])->setPaper('a4', 'portrait');

            return $pdf->download('Label_Batch_' . count($items) . '_items.pdf');

        } catch (\Exception $e) {
            \Log::error('Batch Label Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengunduh label: ' . $e->getMessage());
        }
    }
}
