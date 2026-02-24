<?php

namespace App\Http\Controllers;

use App\Models\DokumentasiKegiatan;
use App\Models\Kegiatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DokumentasiKegiatanController extends Controller
{
    /**
     * Upload a new documentation file for an activity.
     */
    public function store(Request $request, Kegiatan $kegiatan)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png,zip,mp4|max:51200', // 50 MB
        ]);

        $path = $request->file('file')->store('dokumentasi-kegiatan', 'public');

        DokumentasiKegiatan::create([
            'kegiatan_id' => $kegiatan->id,
            'judul'       => $request->judul,
            'file_path'   => $path,
            'uploaded_by' => Auth::id(),
        ]);

        return redirect()->back()->with('message', 'Dokumentasi berhasil diunggah.');
    }

    /**
     * Delete a documentation file.
     */
    public function destroy(DokumentasiKegiatan $dokumentasi)
    {
        if ($dokumentasi->file_path) {
            Storage::disk('public')->delete($dokumentasi->file_path);
        }

        $dokumentasi->delete();

        return redirect()->back()->with('message', 'Dokumentasi berhasil dihapus.');
    }

    /**
     * Download a documentation file.
     */
    public function download(DokumentasiKegiatan $dokumentasi)
    {
        if (!Storage::disk('public')->exists($dokumentasi->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $ext      = pathinfo($dokumentasi->file_path, PATHINFO_EXTENSION);
        $filename = $dokumentasi->judul . ($ext ? '.' . $ext : '');

        return Storage::disk('public')->download($dokumentasi->file_path, $filename);
    }
}
