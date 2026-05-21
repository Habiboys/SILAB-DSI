<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KepengurusanLabController extends Controller
{

    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');

        $kepengurusanLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                    ->where('laboratorium_id', $lab_id)
                    ->orderBy('created_at', 'desc')
                    ->get();

        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();

        return Inertia::render('KepengurusanLab', [
            'kepengurusanLab' => $kepengurusanLab,
            'tahunKepengurusan' => $tahunKepengurusan,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tahun_kepengurusan_id' => ['required', 'exists:tahun_kepengurusan,id'],
            'laboratorium_id' => ['required', 'exists:laboratorium,id'],
            'sk' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $existingKepengurusan = KepengurusanLab::where('tahun_kepengurusan_id', $validated['tahun_kepengurusan_id'])
            ->where('laboratorium_id', $validated['laboratorium_id'])
            ->first();

        if ($existingKepengurusan) {

            return redirect()->back()
                ->withErrors(['duplicate' => 'Periode kepengurusan untuk laboratorium dan tahun yang sama sudah ada.']);
        }

        $kepengurusanLab = new KepengurusanLab();
        $kepengurusanLab->tahun_kepengurusan_id = $validated['tahun_kepengurusan_id'];
        $kepengurusanLab->laboratorium_id = $validated['laboratorium_id'];

        if ($request->hasFile('sk')) {
            $skFile = $request->file('sk');
            $skPath = $skFile->store('kepengurusan_lab/sk', 'public');
            $kepengurusanLab->sk = $skPath;
        }

        $kepengurusanLab->save();

        return redirect()->back()->with('message', 'SK Kepengurusan Lab berhasil ditambahkan');
    }

     public function update(Request $request, $id)
     {

         $request->validate([
             'sk' => 'required|file|mimes:pdf|max:5120',
         ]);

         $kepengurusan = KepengurusanLab::findOrFail($id);

         $oldFilePath = $kepengurusan->sk;

         $filePath = $request->file('sk')->store('kepengurusan_lab/sk', 'public');

         $kepengurusan->sk = $filePath;
         $kepengurusan->save();

         if ($oldFilePath && $oldFilePath !== $filePath && Storage::disk('public')->exists($oldFilePath)) {
             Storage::disk('public')->delete($oldFilePath);
         }

         return redirect()->back()->with('message', 'SK Kepengurusan Lab berhasil diperbarui');
     }

    public function toggleActive(KepengurusanLab $kepengurusanLab)
    {
        $labId = $kepengurusanLab->laboratorium_id;

        DB::transaction(function () use ($kepengurusanLab, $labId) {
            if ($kepengurusanLab->is_active) {

                $kepengurusanLab->update(['is_active' => false]);

                KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->update(['is_active' => false]);
            } else {

                KepengurusanLab::where('laboratorium_id', $labId)
                    ->where('id', '!=', $kepengurusanLab->id)
                    ->update(['is_active' => false]);

                KepengurusanUser::whereHas('kepengurusanLab', function ($q) use ($labId, $kepengurusanLab) {
                    $q->where('laboratorium_id', $labId)
                      ->where('id', '!=', $kepengurusanLab->id);
                })->update(['is_active' => false]);

                $kepengurusanLab->update(['is_active' => true]);

                KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->update(['is_active' => true]);
            }
        });

        return redirect()->back()->with('message', 'Status aktif kepengurusan berhasil diperbarui.');
    }

    public function downloadSk(KepengurusanLab $kepengurusanLab)
    {
        if (!$kepengurusanLab->sk) {
            return back()->with('error', 'File SK tidak ditemukan');
        }

        $filePath = storage_path('app/public/' . $kepengurusanLab->sk);

        if (!file_exists($filePath)) {
            return back()->with('error', 'File SK tidak ditemukan di sistem');
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="SK-Kepengurusan.pdf"'
        ]);
    }
}
