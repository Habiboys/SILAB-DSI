<?php

namespace App\Http\Controllers;

use App\Models\DetailAset;
use App\Models\PeminjamanAset;
use App\Models\RiwayatKondisiAset;
use App\Models\TemplateSuratPeminjaman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PeminjamanAsetController extends Controller
{
    /**
     * Daftar semua peminjaman aset.
     */
    public function index(Request $request)
    {
        $lab_id  = $request->input('lab_id');
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');
        $perPage = $request->input('perPage', 10);

        $query = PeminjamanAset::with([
            'detailAset.kategoriAset',
            'detailAset.laboratorium',
            'peminjam:id,name',
            'diprosesoleh:id,name',
        ]);

        if ($lab_id) {
            $query->whereHas('detailAset', fn($q) => $q->where('laboratorium_id', $lab_id));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_peminjam', 'like', "%{$search}%")
                  ->orWhere('institusi', 'like', "%{$search}%")
                  ->orWhereHas('detailAset', fn($dq) =>
                      $dq->where('kode_barang', 'like', "%{$search}%")
                         ->orWhere('nama', 'like', "%{$search}%")
                  );
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        $peminjaman = $query->latest()->paginate($perPage)->withQueryString();

        // Template surat peminjaman (untuk download oleh user)
        $templates = TemplateSuratPeminjaman::when($lab_id, fn($q) =>
            $q->where(fn($sq) => $sq->where('laboratorium_id', $lab_id)->orWhereNull('laboratorium_id'))
        )->get(['id', 'nama_template', 'deskripsi']);

        return Inertia::render('Inventaris/Peminjaman/Index', [
            'peminjaman' => $peminjaman,
            'templates'  => $templates,
            'filters'    => $request->only(['lab_id', 'search', 'status', 'perPage']),
        ]);
    }

    /**
     * Tambah peminjaman baru – otomatis ubah status aset ke "dipinjam".
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'aset_id'                 => 'required|exists:aset,id',
            'nama_peminjam'           => 'required|string|max:255',
            'institusi'               => 'nullable|string|max:255',
            'keperluan'               => 'required|string',
            'tanggal_pinjam'          => 'required|date',
            'tanggal_kembali_rencana' => 'required|date|after_or_equal:tanggal_pinjam',
            'catatan'                 => 'nullable|string',
            'surat_peminjaman'        => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
        ]);

        $aset = DetailAset::findOrFail($validated['aset_id']);

        if ($aset->status === 'dipinjam') {
            return redirect()->back()->withErrors(['aset_id' => 'Aset sedang dipinjam oleh pihak lain.']);
        }

        if ($aset->keadaan === 'hilang') {
            return redirect()->back()->withErrors(['aset_id' => 'Aset tidak dapat dipinjam karena berstatus hilang.']);
        }

        // Upload surat peminjaman jika ada
        $suratPath = null;
        if ($request->hasFile('surat_peminjaman')) {
            $suratPath = $request->file('surat_peminjaman')->store('surat-peminjaman', 'public');
        }

        $peminjaman = PeminjamanAset::create([
            'aset_id'                 => $validated['aset_id'],
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

        // Otomatis ubah status aset menjadi dipinjam
        $aset->update(['status' => 'dipinjam']);

        return redirect()->back()->with('message', 'Peminjaman berhasil dicatat. Status aset diperbarui.');
    }

    /**
     * Proses pengembalian aset – ubah status kembali ke "tersedia".
     */
    public function kembalikan(Request $request, $id)
    {
        $peminjaman = PeminjamanAset::with('detailAset')->findOrFail($id);

        $request->validate([
            'tanggal_kembali_aktual' => 'required|date',
            'catatan_kembali'        => 'nullable|string',
            'kondisi_setelah_kembali' => 'nullable|in:baik,rusak',
        ]);

        $peminjaman->update([
            'status'                  => 'dikembalikan',
            'tanggal_kembali_aktual'  => $request->tanggal_kembali_aktual,
            'catatan'                 => $request->catatan_kembali ?? $peminjaman->catatan,
        ]);

        // Ubah status aset kembali tersedia
        $aset = $peminjaman->detailAset;
        $kondisiBaru = $request->kondisi_setelah_kembali ?? $aset->keadaan;
        $aset->update(['status' => 'tersedia', 'keadaan' => $kondisiBaru]);

        // Catat riwayat kondisi jika kondisi berubah
        if ($kondisiBaru !== $aset->getOriginal('keadaan')) {
            RiwayatKondisiAset::create([
                'aset_id'         => $aset->id,
                'kondisi_sebelum' => $aset->getOriginal('keadaan'),
                'kondisi_sesudah' => $kondisiBaru,
                'catatan'         => 'Kondisi setelah dikembalikan dari peminjaman.',
                'dicatat_oleh'    => Auth::id(),
            ]);
        }

        return redirect()->back()->with('message', 'Aset berhasil dicatat sebagai dikembalikan.');
    }

    /**
     * Hapus peminjaman (hanya yang masih dipinjam / yang belum selesai).
     */
    public function destroy($id)
    {
        $peminjaman = PeminjamanAset::findOrFail($id);

        if ($peminjaman->surat_peminjaman_path) {
            Storage::disk('public')->delete($peminjaman->surat_peminjaman_path);
        }

        // Jika masih dipinjam, kembalikan status aset
        if ($peminjaman->status === 'dipinjam') {
            $peminjaman->detailAset?->update(['status' => 'tersedia']);
        }

        $peminjaman->delete();

        return redirect()->back()->with('message', 'Data peminjaman berhasil dihapus.');
    }

    // ─── Template Surat Peminjaman ────────────────────────────────────────────

    /**
     * Daftar template surat peminjaman.
     */
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

    /**
     * Upload template surat peminjaman (Admin only).
     */
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

    /**
     * Download template surat.
     */
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

    /**
     * Hapus template surat.
     */
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
