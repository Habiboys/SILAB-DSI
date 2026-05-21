<?php

namespace App\Http\Controllers;

use App\Models\DetailAset;
use App\Models\PeminjamanAset;
use App\Models\PeminjamanAsetItem;
use App\Models\RiwayatKondisiAset;
use App\Models\TemplateSuratPeminjaman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PeminjamanAsetController extends Controller
{

    public function index(Request $request)
    {
        $lab_id  = $request->input('lab_id');
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');
        $perPage = $request->input('perPage', 10);

        $query = PeminjamanAset::with([
            'items.detailAset.kategoriAset',
            'items.detailAset.laboratorium',
            'peminjam:id,name',
            'diprosesoleh:id,name',
        ]);

        if ($lab_id) {
            $query->whereHas('items.detailAset', fn($q) => $q->where('laboratorium_id', $lab_id));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_peminjam', 'like', "%{$search}%")
                  ->orWhere('institusi', 'like', "%{$search}%")
                  ->orWhereHas('items.detailAset', fn($dq) =>
                      $dq->where('kode_barang', 'like', "%{$search}%")
                         ->orWhere('nama', 'like', "%{$search}%")
                  );
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $peminjaman = $query->latest()->paginate($perPage)->withQueryString();

        $asetTersedia = DetailAset::with(['kategoriAset:id,nama', 'laboratorium:id,nama'])
            ->where('status', 'tersedia')
            ->where('keadaan', '!=', 'hilang')
            ->when($lab_id, fn($q) => $q->where('laboratorium_id', $lab_id))
            ->orderBy('kode_barang')
            ->get(['id', 'kode_barang', 'nama', 'kategori_aset_id', 'laboratorium_id', 'keadaan', 'status']);

        $templates = TemplateSuratPeminjaman::when($lab_id, fn($q) =>
            $q->where(fn($sq) => $sq->where('laboratorium_id', $lab_id)->orWhereNull('laboratorium_id'))
        )->get(['id', 'nama_template', 'deskripsi']);

        return Inertia::render('Inventaris/Peminjaman/Index', [
            'peminjaman'   => $peminjaman,
            'templates'    => $templates,
            'asetTersedia' => $asetTersedia,
            'filters'      => $request->only(['lab_id', 'search', 'status', 'perPage']),
        ]);
    }


    public function store(Request $request)
    {

        if ($request->filled('aset_id') && !$request->has('aset_ids')) {
            $request->merge(['aset_ids' => [$request->input('aset_id')]]);
        }

        $validated = $request->validate([
            'aset_ids'                => 'required|array|min:1',
            'aset_ids.*'              => 'required|exists:aset,id',
            'nama_peminjam'           => 'required|string|max:255',
            'institusi'               => 'nullable|string|max:255',
            'keperluan'               => 'required|string',
            'tanggal_pinjam'          => 'required|date',
            'tanggal_kembali_rencana' => 'required|date|after_or_equal:tanggal_pinjam',
            'catatan'                 => 'nullable|string',
            'surat_peminjaman'        => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
        ]);

        $asetIds = array_values(array_unique($validated['aset_ids']));
        $asets   = DetailAset::whereIn('id', $asetIds)->get();

        if ($asets->count() !== count($asetIds)) {
            return redirect()->back()->withErrors(['aset_ids' => 'Sebagian aset tidak ditemukan.']);
        }

        foreach ($asets as $aset) {
            if ($aset->status === 'dipinjam') {
                return redirect()->back()->withErrors([
                    'aset_ids' => "Aset {$aset->kode_barang} sedang dipinjam oleh pihak lain.",
                ]);
            }
            if ($aset->keadaan === 'hilang') {
                return redirect()->back()->withErrors([
                    'aset_ids' => "Aset {$aset->kode_barang} berstatus hilang dan tidak dapat dipinjam.",
                ]);
            }
        }

        $suratPath = null;
        if ($request->hasFile('surat_peminjaman')) {
            $suratPath = $request->file('surat_peminjaman')->store('surat-peminjaman', 'public');
        }

        DB::transaction(function () use ($validated, $asets, $asetIds, $suratPath) {

            $peminjaman = PeminjamanAset::create([
                'aset_id'                 => $asetIds[0],
                'peminjam_id'             => Auth::id(),
                'nama_peminjam'           => $validated['nama_peminjam'],
                'institusi'               => $validated['institusi'] ?? null,
                'keperluan'               => $validated['keperluan'],
                'tanggal_pinjam'          => $validated['tanggal_pinjam'],
                'tanggal_kembali_rencana' => $validated['tanggal_kembali_rencana'],
                'status'                  => 'dipinjam',
                'surat_peminjaman_path'   => $suratPath,
                'catatan'                 => $validated['catatan'] ?? null,
                'diproses_oleh'           => Auth::id(),
            ]);

            foreach ($asetIds as $asetId) {
                PeminjamanAsetItem::create([
                    'peminjaman_aset_id' => $peminjaman->id,
                    'aset_id'            => $asetId,
                ]);
            }

            DetailAset::whereIn('id', $asetIds)->update(['status' => 'dipinjam']);
        });

        return redirect()->back()->with('message', 'Peminjaman berhasil dicatat. Status aset diperbarui.');
    }


    public function kembalikan(Request $request, $id)
    {
        $peminjaman = PeminjamanAset::with('items.detailAset')->findOrFail($id);

        $request->validate([
            'tanggal_kembali_aktual'  => 'required|date',
            'catatan_kembali'         => 'nullable|string',
            'kondisi_setelah_kembali' => 'nullable|in:baik,rusak',
        ]);

        $tanggal = $request->tanggal_kembali_aktual;
        $kondisi = $request->kondisi_setelah_kembali;
        $catatan = $request->catatan_kembali;

        DB::transaction(function () use ($peminjaman, $tanggal, $kondisi, $catatan) {
            foreach ($peminjaman->items as $item) {
                if ($item->tanggal_kembali_aktual) {
                    continue;
                }
                $this->kembalikanItemInternal($item, $tanggal, $kondisi, $catatan);
            }

            $peminjaman->update([
                'status'                 => 'dikembalikan',
                'tanggal_kembali_aktual' => $tanggal,
                'catatan'                => $catatan ?? $peminjaman->catatan,
            ]);
        });

        return redirect()->back()->with('message', 'Seluruh aset dalam transaksi berhasil dikembalikan.');
    }


    public function kembalikanItem(Request $request, $itemId)
    {
        $item = PeminjamanAsetItem::with(['peminjaman', 'detailAset'])->findOrFail($itemId);

        if ($item->tanggal_kembali_aktual) {
            return redirect()->back()->withErrors(['item' => 'Item ini sudah dikembalikan.']);
        }

        $request->validate([
            'tanggal_kembali_aktual'  => 'required|date',
            'catatan_kembali'         => 'nullable|string',
            'kondisi_setelah_kembali' => 'nullable|in:baik,rusak',
        ]);

        DB::transaction(function () use ($item, $request) {
            $this->kembalikanItemInternal(
                $item,
                $request->tanggal_kembali_aktual,
                $request->kondisi_setelah_kembali,
                $request->catatan_kembali
            );

            $peminjaman = $item->peminjaman()->with('items')->first();
            $masihAda = $peminjaman->items->whereNull('tanggal_kembali_aktual')->count() > 0;
            if (!$masihAda && $peminjaman->status === 'dipinjam') {
                $peminjaman->update([
                    'status'                 => 'dikembalikan',
                    'tanggal_kembali_aktual' => $request->tanggal_kembali_aktual,
                ]);
            }
        });

        return redirect()->back()->with('message', 'Item berhasil ditandai sebagai dikembalikan.');
    }


    private function kembalikanItemInternal(PeminjamanAsetItem $item, string $tanggal, ?string $kondisiBaru, ?string $catatan): void
    {
        $item->update([
            'tanggal_kembali_aktual'  => $tanggal,
            'kondisi_setelah_kembali' => $kondisiBaru,
            'catatan_item'            => $catatan,
        ]);

        $aset = $item->detailAset;
        if (!$aset) {
            return;
        }

        $kondisiLama = $aset->keadaan;
        $kondisiFinal = $kondisiBaru ?? $kondisiLama;

        $masihDipinjam = PeminjamanAsetItem::where('aset_id', $aset->id)
            ->where('id', '!=', $item->id)
            ->whereNull('tanggal_kembali_aktual')
            ->whereHas('peminjaman', fn($q) => $q->where('status', 'dipinjam'))
            ->exists();

        $statusBaru = $masihDipinjam ? 'dipinjam' : 'tersedia';
        $aset->update(['status' => $statusBaru, 'keadaan' => $kondisiFinal]);

        if ($kondisiBaru && $kondisiBaru !== $kondisiLama) {
            RiwayatKondisiAset::create([
                'aset_id'         => $aset->id,
                'kondisi_sebelum' => $kondisiLama,
                'kondisi_sesudah' => $kondisiBaru,
                'catatan'         => 'Kondisi setelah dikembalikan dari peminjaman.',
                'dicatat_oleh'    => Auth::id(),
            ]);
        }
    }


    public function destroy($id)
    {
        $peminjaman = PeminjamanAset::with('items')->findOrFail($id);

        if ($peminjaman->surat_peminjaman_path) {
            Storage::disk('public')->delete($peminjaman->surat_peminjaman_path);
        }

        DB::transaction(function () use ($peminjaman) {

            foreach ($peminjaman->items as $item) {
                if ($item->tanggal_kembali_aktual) {
                    continue;
                }
                $masihDipinjam = PeminjamanAsetItem::where('aset_id', $item->aset_id)
                    ->where('id', '!=', $item->id)
                    ->whereNull('tanggal_kembali_aktual')
                    ->whereHas('peminjaman', fn($q) => $q->where('status', 'dipinjam'))
                    ->exists();
                if (!$masihDipinjam) {
                    DetailAset::where('id', $item->aset_id)->update(['status' => 'tersedia']);
                }
            }

            $peminjaman->delete();
        });

        return redirect()->back()->with('message', 'Data peminjaman berhasil dihapus.');
    }


    public function indexTemplate(Request $request)
    {
        $lab_id    = $request->input('lab_id');
        $templates = TemplateSuratPeminjaman::with('laboratorium:id,nama')
            ->when($lab_id, fn($q) =>
                $q->where(fn($sq) => $sq->where('laboratorium_id', $lab_id)->orWhereNull('laboratorium_id'))
            )
            ->orderBy('nama_template')
            ->get();

        return response()->json($templates);
    }


    public function storeTemplate(Request $request)
    {
        $request->validate([
            'nama_template'  => 'required|string|max:255',
            'deskripsi'      => 'nullable|string',
            'laboratorium_id' => 'nullable|exists:laboratorium,id',
            'file'           => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $filePath = $request->file('file')->store('template-surat', 'public');

        $template = TemplateSuratPeminjaman::create([
            'nama_template'  => $request->nama_template,
            'deskripsi'      => $request->deskripsi,
            'laboratorium_id' => $request->laboratorium_id,
            'file_path'      => $filePath,
        ]);

        return redirect()->back()->with('message', 'Template surat berhasil diupload.');
    }


    public function downloadTemplate($id)
    {
        $template = TemplateSuratPeminjaman::findOrFail($id);

        if (!Storage::disk('public')->exists($template->file_path)) {
            return redirect()->back()->withErrors(['file' => 'File tidak ditemukan.']);
        }

        return response()->download(
            Storage::disk('public')->path($template->file_path),
            $template->nama_template . '.' . pathinfo($template->file_path, PATHINFO_EXTENSION)
        );
    }


    public function destroyTemplate($id)
    {
        $template = TemplateSuratPeminjaman::findOrFail($id);

        if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
            Storage::disk('public')->delete($template->file_path);
        }

        $template->delete();

        return redirect()->back()->with('message', 'Template surat berhasil dihapus.');
    }
}
