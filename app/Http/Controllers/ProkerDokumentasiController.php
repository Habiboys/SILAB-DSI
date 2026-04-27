<?php

namespace App\Http\Controllers;

use App\Models\Proker;
use App\Models\ProkerDokumentasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProkerDokumentasiController extends Controller
{
    public function store(Request $request, Proker $proker)
    {
        $this->authorize('updateProgress', $proker);

        $request->validate([
            'files'   => 'required|array|min:1|max:20',
            'files.*' => 'file|mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp,zip,mp4|max:51200',
        ]);

        $count = 0;
        foreach ($request->file('files') as $idx => $file) {
            $fileName = time() . '_' . $idx . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('proker-dokumentasi', $fileName, 'public');

            ProkerDokumentasi::create([
                'proker_id'   => $proker->id,
                'judul'       => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'file_path'   => $filePath,
                'uploaded_by' => auth()->id(),
            ]);
            $count++;
        }

        return back()->with('message', "Berhasil mengunggah {$count} file.");
    }

    public function destroy(ProkerDokumentasi $dokumentasi)
    {
        $this->authorize('updateProgress', $dokumentasi->proker);

        Storage::disk('public')->delete($dokumentasi->file_path);
        $dokumentasi->delete();

        return back()->with('message', 'Dokumentasi berhasil dihapus.');
    }

    public function download(ProkerDokumentasi $dokumentasi)
    {
        $path = Storage::disk('public')->path($dokumentasi->file_path);

        if (! file_exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $ext       = pathinfo($dokumentasi->file_path, PATHINFO_EXTENSION);
        $cleanName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $dokumentasi->judul) . '.' . $ext;

        return response()->download($path, $cleanName);
    }
}
