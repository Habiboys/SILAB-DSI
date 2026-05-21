<?php

namespace App\Http\Controllers;

use App\Models\DetailAset;
use App\Models\KategoriAset;
use App\Models\PermohonanAset;
use App\Models\RiwayatKondisiAset;
use App\Models\WishlistAset;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PermohonanAsetController extends Controller
{
    public function index(Request $request)
    {
        $lab_id  = $request->input('lab_id');
        $search  = $request->input('search');
        $status  = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = PermohonanAset::with(['userPemohon', 'laboratorium', 'wishlistAset'])
            ->when($lab_id,  fn($q) => $q->where('laboratorium_id', $lab_id))
            ->when($search,  fn($q) => $q->where('nomor_permohonan', 'like', "%{$search}%"))
            ->when($status,  fn($q) => $q->where('status_permohonan', $status))
            ->orderBy('created_at', 'desc');

        $permohonan = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Inventaris/Permohonan/Index', [
            'permohonan' => $permohonan,
            'filters'    => $request->only(['lab_id', 'search', 'status', 'perPage']),
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'laboratorium_id'       => 'required|exists:laboratorium,id',
            'alasan_umum_pengadaan' => 'required|string',
            'items'                 => 'required|array|min:1',
            'items.*.nama_barang'   => 'required|string',
            'items.*.jumlah_diminta'=> 'required|integer|min:1',
            'items.*.perkiraan_harga'=> 'nullable|numeric',
            'items.*.urgensi'       => 'required|in:rendah,sedang,tinggi,sangat_tinggi',
            'items.*.jenis_barang'  => 'nullable|string',
            'items.*.spesifikasi_teknis' => 'nullable|string',
            'items.*.satuan'        => 'nullable|string',
            'items.*.referensi_url' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($validated) {
            $nomor = 'REQ-' . date('YmdHis') . '-' . rand(100, 999);

            $permohonan = PermohonanAset::create([
                'user_pemohon_id'       => Auth::id(),
                'laboratorium_id'       => $validated['laboratorium_id'],
                'nomor_permohonan'      => $nomor,
                'tanggal_permohonan'    => now(),
                'alasan_umum_pengadaan' => $validated['alasan_umum_pengadaan'],
                'status_permohonan'     => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                WishlistAset::create([
                    'permohonan_aset_id'  => $permohonan->id,
                    'nama_barang'         => $item['nama_barang'],
                    'jenis_barang'        => $item['jenis_barang'] ?? null,
                    'spesifikasi_teknis'  => $item['spesifikasi_teknis'] ?? null,
                    'perkiraan_harga'     => $item['perkiraan_harga'] ?? null,
                    'jumlah_diminta'      => $item['jumlah_diminta'],
                    'satuan'              => $item['satuan'] ?? null,
                    'urgensi'             => $item['urgensi'],
                    'referensi_url'       => $item['referensi_url'] ?? null,
                    'status_item'         => 'draft',
                ]);
            }
        });

        return redirect()->back()->with('message', 'Draft permohonan berhasil disimpan');
    }

    public function show(PermohonanAset $permohonan)
    {
        $permohonan->load([
            'userPemohon',
            'laboratorium',
            'wishlistAset.detailAsets',
            'reviewer',
            'approver',
        ]);

        $kategoriAset = KategoriAset::orderBy('nama')->get(['id', 'nama']);

        return Inertia::render('Inventaris/Permohonan/Show', [
            'permohonan'  => $permohonan,
            'kategoriAset'=> $kategoriAset,
        ]);
    }


    public function submit(PermohonanAset $permohonan)
    {
        if ($permohonan->status_permohonan !== 'draft') {
            return redirect()->back()->with('error', 'Hanya permohonan berstatus draft yang dapat diajukan.');
        }

        if ($permohonan->user_pemohon_id !== Auth::id() && !Auth::user()->hasRole('superadmin')) {
            abort(403);
        }

        DB::transaction(function () use ($permohonan) {
            $permohonan->update(['status_permohonan' => 'diajukan']);
            $permohonan->wishlistAset()->update(['status_item' => 'diajukan']);
        });

        return redirect()->back()->with('message', 'Permohonan berhasil diajukan');
    }


    public function reviewKalab(Request $request, PermohonanAset $permohonan)
    {
        $this->authorize('reviewKalab', $permohonan);

        if ($permohonan->status_permohonan !== 'diajukan') {
            return redirect()->back()->with('error', 'Permohonan tidak dalam status yang dapat direview.');
        }

        $validated = $request->validate([
            'keputusan'       => 'required|in:disetujui_kalab,ditolak_kalab',
            'catatan_review'  => 'nullable|string',
            'items'           => 'nullable|array',
            'items.*.status'  => 'required|in:disetujui_kalab,ditolak_kalab',
            'items.*.jumlah_disetujui' => 'nullable|integer|min:1',
            'items.*.catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($permohonan, $validated) {
            $permohonan->update([
                'status_permohonan' => $validated['keputusan'],
                'catatan_review'    => $validated['catatan_review'] ?? null,
                'reviewed_by'       => Auth::id(),
                'reviewed_at'       => now(),
            ]);

            if ($validated['keputusan'] === 'ditolak_kalab') {
                $permohonan->wishlistAset()->update(['status_item' => 'ditolak_kalab']);
            } elseif (isset($validated['items'])) {
                foreach ($validated['items'] as $itemId => $itemData) {
                    WishlistAset::where('id', $itemId)->update([
                        'status_item'      => $itemData['status'],
                        'jumlah_disetujui' => $itemData['jumlah_disetujui'] ?? null,
                        'catatan_item'     => $itemData['catatan'] ?? null,
                    ]);
                }
            } else {
                $permohonan->wishlistAset()->update(['status_item' => 'disetujui_kalab']);
            }
        });

        return redirect()->back()->with('message', 'Review Kalab berhasil disimpan');
    }


    public function approveKadep(Request $request, PermohonanAset $permohonan)
    {
        $this->authorize('approveKadep', $permohonan);

        if ($permohonan->status_permohonan !== 'disetujui_kalab') {
            return redirect()->back()->with('error', 'Permohonan belum melalui review Kalab.');
        }

        $validated = $request->validate([
            'keputusan'        => 'required|in:disetujui_kadep,ditolak_kadep',
            'catatan_approval' => 'nullable|string',
        ]);

        DB::transaction(function () use ($permohonan, $validated) {
            $permohonan->update([
                'status_permohonan' => $validated['keputusan'],
                'catatan_approval'  => $validated['catatan_approval'] ?? null,
                'approved_by'       => Auth::id(),
                'approved_at'       => now(),
            ]);

            $itemStatus = $validated['keputusan'] === 'disetujui_kadep'
                ? 'disetujui_kadep'
                : 'ditolak_kadep';

            $permohonan->wishlistAset()
                ->where('status_item', 'disetujui_kalab')
                ->update(['status_item' => $itemStatus]);
        });

        return redirect()->back()->with('message', 'Keputusan Kadep berhasil disimpan');
    }


    public function convertToAset(Request $request, WishlistAset $wishlistItem)
    {
        $this->authorize('convertToAset', $wishlistItem->permohonanAset);

        if ($wishlistItem->status_item !== 'disetujui_kadep') {
            return redirect()->back()->with('error', 'Item belum mendapat persetujuan Kadep.');
        }

        $validated = $request->validate([
            'kategori_aset_id'  => 'required|exists:kategori_aset,id',
            'laboratorium_id'   => 'required|exists:laboratorium,id',
            'nama'              => 'nullable|string|max:255',
            'keadaan'           => 'required|in:baik,rusak',
            'tanggal_perolehan' => 'nullable|date',
            'harga_perolehan'   => 'nullable|numeric|min:0',
            'asal_barang'       => 'nullable|in:pengadaan,hibah,pembelian_mandiri,lainnya',
            'keterangan'        => 'nullable|string',
        ]);

        $qty = (int) ($wishlistItem->jumlah_disetujui ?? $wishlistItem->jumlah_diminta ?? 1);
        $qty = max(1, $qty);

        if ($qty === 1) {
            $request->validate([
                'kode_barang' => ['required', 'string', 'max:255', Rule::unique('aset', 'kode_barang')],
            ]);
            $kodeBarangList = [$request->input('kode_barang')];
        } else {
            $request->validate([
                'kode_barang_list' => ['required', 'array', 'size:' . $qty],
                'kode_barang_list.*' => ['required', 'string', 'max:255', 'distinct', Rule::unique('aset', 'kode_barang')],
            ]);
            $kodeBarangList = $request->input('kode_barang_list');
        }

        DB::transaction(function () use ($wishlistItem, $validated, $kodeBarangList) {
            foreach ($kodeBarangList as $kodeBarang) {
                $aset = DetailAset::create(array_merge($validated, [
                    'kode_barang'     => $kodeBarang,
                    'status'          => 'tersedia',
                    'wishlist_aset_id'=> $wishlistItem->id,
                ]));

                RiwayatKondisiAset::create([
                    'aset_id'         => $aset->id,
                    'kondisi_sebelum' => null,
                    'kondisi_sesudah' => $validated['keadaan'],
                    'catatan'         => 'Aset dicatat dari permohonan pengadaan.',
                    'dicatat_oleh'    => Auth::id(),
                ]);
            }

            $wishlistItem->update(['status_item' => 'diterima']);
        });

        return redirect()->back()->with('message', 'Aset berhasil ditambahkan dari permohonan pengadaan');
    }

    public function destroy(PermohonanAset $permohonan)
    {
        $this->authorize('delete', $permohonan);

        if (!in_array($permohonan->status_permohonan, ['draft', 'diajukan'])) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus permohonan yang sudah diproses.');
        }

        $permohonan->delete();

        return redirect()->route('inventaris.permohonan.index')
            ->with('message', 'Permohonan berhasil dihapus');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'string']);

        $count = PermohonanAset::whereIn('id', $request->ids)
            ->whereIn('status_permohonan', ['draft', 'diajukan'])
            ->delete();

        return redirect()->back()->with('message', $count . ' permohonan berhasil dihapus.');
    }
}
