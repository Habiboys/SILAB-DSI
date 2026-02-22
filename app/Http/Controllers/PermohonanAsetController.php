<?php

namespace App\Http\Controllers;

use App\Models\PermohonanAset;
use App\Models\WishlistAset;
use App\Models\Laboratorium;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PermohonanAsetController extends Controller
{
    // Note: Authorization handled via route middleware in Laravel 11

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = PermohonanAset::with(['userPemohon', 'laboratorium', 'wishlistAset'])
            ->when($lab_id, function($q) use ($lab_id) {
                return $q->where('laboratorium_id', $lab_id);
            })
            ->when($search, function($q) use ($search) {
                return $q->where('nomor_permohonan', 'like', "%{$search}%");
            })
            ->when($status, function($q) use ($status) {
                return $q->where('status_permohonan', $status);
            })
            ->orderBy('created_at', 'desc');

        $permohonan = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Inventaris/Permohonan/Index', [
            'permohonan' => $permohonan,
            'filters' => $request->only(['lab_id', 'search', 'status', 'perPage']),
        ]);
    }



    /**
     * Store a newly created resource in storage.
     * Authorization: Checked automatically via authorizeResource (create policy)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'laboratorium_id' => 'required|exists:laboratorium,id',
            'alasan_umum_pengadaan' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.nama_barang' => 'required|string',
            'items.*.jumlah_diminta' => 'required|integer|min:1',
            'items.*.perkiraan_harga' => 'nullable|numeric',
            'items.*.urgensi' => 'required|in:rendah,sedang,tinggi,sangat_tinggi',
        ]);

        DB::transaction(function () use ($validated) {
            $nomorPermohonan = 'REQ-' . date('YmdHis') . '-' . rand(100, 999);
            
            $permohonan = PermohonanAset::create([
                'user_pemohon_id' => Auth::id(),
                'laboratorium_id' => $validated['laboratorium_id'],
                'nomor_permohonan' => $nomorPermohonan,
                'tanggal_permohonan' => now(),
                'alasan_umum_pengadaan' => $validated['alasan_umum_pengadaan'],
                'status_permohonan' => 'diajukan',
            ]);

            foreach ($validated['items'] as $item) {
                WishlistAset::create([
                    'permohonan_aset_id' => $permohonan->id,
                    'nama_barang' => $item['nama_barang'],
                    'jenis_barang' => $item['jenis_barang'] ?? null,
                    'spesifikasi_teknis' => $item['spesifikasi_teknis'] ?? null,
                    'perkiraan_harga' => $item['perkiraan_harga'] ?? null,
                    'jumlah_diminta' => $item['jumlah_diminta'],
                    'satuan' => $item['satuan'] ?? null,
                    'urgensi' => $item['urgensi'],
                    'referensi_url' => $item['referensi_url'] ?? null,
                    'status_item' => 'diajukan',
                ]);
            }
        });

        return redirect()->back()->with('message', 'Permohonan aset berhasil diajukan');
    }

    /**
     * Display the specified resource.
     * Authorization: Checked automatically via authorizeResource (view policy)
     */
    public function show(PermohonanAset $permohonan)
    {
        $permohonan->load(['userPemohon', 'laboratorium', 'wishlistAset', 'approver']);

        return Inertia::render('Inventaris/Permohonan/Show', [
            'permohonan' => $permohonan
        ]);
    }

    /**
     * Update the specified resource in storage.
     * Authorization: Checked automatically via authorizeResource (update policy)
     */
    public function update(Request $request, PermohonanAset $permohonan)
    {        
        $validated = $request->validate([
            'status_permohonan' => 'required|in:disetujui,ditolak',
            'catatan_approval' => 'nullable|string',
            'items' => 'nullable|array', // For approving specific items
        ]);

        DB::transaction(function () use ($permohonan, $validated) {
            $permohonan->update([
                'status_permohonan' => $validated['status_permohonan'],
                'catatan_approval' => $validated['catatan_approval'] ?? null,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // If approved, update items status if provided, otherwise bulk update
            if ($validated['status_permohonan'] === 'disetujui' && isset($validated['items'])) {
                foreach ($validated['items'] as $itemId => $itemData) {
                    WishlistAset::where('id', $itemId)->update([
                        'status_item' => $itemData['status'] ?? 'disetujui',
                        'jumlah_disetujui' => $itemData['jumlah_disetujui'] ?? null,
                        'catatan_item' => $itemData['catatan'] ?? null,
                    ]);
                }
            } elseif ($validated['status_permohonan'] === 'ditolak') {
                $permohonan->wishlistAset()->update(['status_item' => 'ditolak']);
            }
        });

        return redirect()->back()->with('message', 'Status permohonan diperbarui');
    }
    
    /**
     * Approve a permohonan aset (Kalab only).
     * Authorization: Custom policy check for approve action
     */
    public function approve(Request $request, PermohonanAset $permohonan)
    {
        // Check approve permission (Kalab/Superadmin only)
        $this->authorize('approve', $permohonan);
        
        $validated = $request->validate([
            'catatan_approval' => 'nullable|string',
            'items' => 'nullable|array',
        ]);

        DB::transaction(function () use ($permohonan, $validated) {
            $permohonan->update([
                'status_permohonan' => 'disetujui',
                'catatan_approval' => $validated['catatan_approval'] ?? null,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            if (isset($validated['items'])) {
                foreach ($validated['items'] as $itemId => $itemData) {
                    WishlistAset::where('id', $itemId)->update([
                        'status_item' => $itemData['status'] ?? 'disetujui',
                        'jumlah_disetujui' => $itemData['jumlah_disetujui'] ?? null,
                        'catatan_item' => $itemData['catatan'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->back()->with('message', 'Permohonan berhasil disetujui');
    }
    
    /**
     * Reject a permohonan aset (Kalab only).
     * Authorization: Custom policy check for approve action
     */
    public function reject(Request $request, PermohonanAset $permohonan)
    {
        // Check approve permission (Kalab/Superadmin only)
        $this->authorize('approve', $permohonan);
        
        $validated = $request->validate([
            'catatan_approval' => 'nullable|string',
        ]);

        DB::transaction(function () use ($permohonan, $validated) {
            $permohonan->update([
                'status_permohonan' => 'ditolak',
                'catatan_approval' => $validated['catatan_approval'] ?? null,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);
            
            $permohonan->wishlistAset()->update(['status_item' => 'ditolak']);
        });

        return redirect()->back()->with('message', 'Permohonan ditolak');
    }
    
    /**
     * Remove the specified resource from storage.
     * Authorization: Checked automatically via authorizeResource (delete policy)
     */
    public function destroy(PermohonanAset $permohonan)
    {
        // Only allow delete if still pending
        if ($permohonan->status_permohonan !== 'diajukan') {
            return redirect()->back()->with('error', 'Cannot delete approved/rejected permohonan');
        }
            
        $permohonan->delete();
        
        return redirect()->route('inventaris.permohonan.index')
            ->with('message', 'Permohonan berhasil dihapus');
    }

    /**
     * Bulk delete multiple permohonan.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'string']);
        $count = PermohonanAset::whereIn('id', $request->ids)
            ->where('status_permohonan', 'diajukan') // Only delete pending ones
            ->delete();
        return redirect()->back()->with('message', $count . ' permohonan berhasil dihapus.');
    }
}
