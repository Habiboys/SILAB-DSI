<?php

namespace App\Http\Controllers;

use App\Models\LaporanKegiatan;
use App\Models\Kegiatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class LaporanKegiatanController extends Controller
{

    public function store(Request $request, Kegiatan $kegiatan)
    {


        $request->validate([
            'jenis_laporan' => 'required|string|max:255',
            'periode_bulan' => 'nullable|integer',
            'periode_tahun' => 'nullable|integer',
            'deskripsi_capaian' => 'nullable|string',
            'file_lpj' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $path = $request->file('file_lpj')->store('lpj', 'public');

        LaporanKegiatan::create([
            'kegiatan_id' => $kegiatan->id,
            'jenis_laporan' => $request->jenis_laporan,
            'periode_bulan' => $request->periode_bulan,
            'periode_tahun' => $request->periode_tahun,
            'deskripsi_capaian' => $request->deskripsi_capaian,
            'file_lpj' => $path,
        ]);

        return redirect()->back()->with('message', 'Laporan berhasil diunggah.');
    }


    public function destroy(LaporanKegiatan $laporan)
    {


        if ($laporan->file_lpj) {
            Storage::disk('public')->delete($laporan->file_lpj);
        }

        $laporan->delete();

        return redirect()->back()->with('message', 'Laporan berhasil dihapus.');
    }

    public function download(LaporanKegiatan $laporan)
    {
        if (!Storage::disk('public')->exists($laporan->file_lpj)) {
            abort(404, 'File not found');
        }
        return Storage::disk('public')->download($laporan->file_lpj);
    }
}
