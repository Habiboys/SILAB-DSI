<?php

namespace App\Http\Controllers;

use App\Models\TahunKepengurusan;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TahunKepengurusanController extends Controller
{



    public function index()
    {
        $tahunKepengurusan = TahunKepengurusan::all();

        return Inertia::render('TahunKepengurusan', [
            'tahunKepengurusan' => $tahunKepengurusan
        ]);
    }


    public function store(Request $request)
    {

        $request->validate([
            'tahun' => ['required', 'string', 'unique:tahun_kepengurusan'],
            'mulai' => ['required', 'date'],
            'selesai' => ['required', 'date'],
            'isactive' => 'required|boolean',
        ]);

        DB::transaction(function () use ($request) {
            if ($request->isactive) {
                TahunKepengurusan::where('isactive', true)->update(['isactive' => false]);
            }
            TahunKepengurusan::create($request->only(['tahun', 'mulai', 'selesai', 'isactive']));
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil ditambahkan.');
    }

    public function update(Request $request, TahunKepengurusan $tahunKepengurusan)
    {
        abort_if(KepengurusanLab::where('tahun_kepengurusan_id', $tahunKepengurusan->id)->where('is_active', false)->exists(), 403, 'Tahun yang digunakan kepengurusan arsip tidak dapat diubah.');

        $request->validate([
            'tahun' => ['required', 'string', 'unique:tahun_kepengurusan,tahun,' . $tahunKepengurusan->id],
            'mulai' => ['required', 'date'],
            'selesai' => ['required', 'date'],
            'isactive' => 'required|boolean',
        ]);

        DB::transaction(function () use ($request, $tahunKepengurusan) {
            if ($request->isactive) {
                TahunKepengurusan::where('isactive', true)->where('id', '!=', $tahunKepengurusan->id)->update(['isactive' => false]);
            }
            $tahunKepengurusan->update($request->only(['tahun', 'mulai', 'selesai', 'isactive']));
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil diperbarui.');
    }




    public function destroy(TahunKepengurusan $tahunKepengurusan)
    {
        abort_if(KepengurusanLab::where('tahun_kepengurusan_id', $tahunKepengurusan->id)->exists(), 403, 'Tahun yang digunakan kepengurusan tidak dapat dihapus.');
        $tahunKepengurusan->delete();

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil dihapus.');
    }
}
