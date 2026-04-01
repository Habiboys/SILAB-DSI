<?php

namespace App\Http\Controllers;

use App\Models\TahunKepengurusan;
use App\Models\KepengurusanLab;
use App\Models\KepengurusanUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TahunKepengurusanController extends Controller
{
    /**
     * Sinkronisasi status anggota aktif per laboratorium untuk tahun kepengurusan aktif.
     * - Kepengurusan pada tahun aktif => is_active = true
     * - Kepengurusan tahun lain (lab yang sama) => is_active = false
     */
    private function syncActiveMembershipByYear(string $tahunKepengurusanId): void
    {
        $kepengurusanAktifPerLab = KepengurusanLab::where('tahun_kepengurusan_id', $tahunKepengurusanId)
            ->get(['id', 'laboratorium_id'])
            ->groupBy('laboratorium_id');

        foreach ($kepengurusanAktifPerLab as $labId => $rows) {
            $activeKepIds = $rows->pluck('id')->toArray();

            // Nonaktifkan semua keanggotaan pada lab yang sama selain periode aktif
            KepengurusanUser::whereHas('kepengurusanLab', function ($q) use ($labId, $activeKepIds) {
                    $q->where('laboratorium_id', $labId)
                      ->whereNotIn('id', $activeKepIds);
                })
                ->update(['is_active' => false]);

            // Aktifkan keanggotaan pada periode aktif
            KepengurusanUser::whereIn('kepengurusan_lab_id', $activeKepIds)
                ->update(['is_active' => true]);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tahunKepengurusan = TahunKepengurusan::all();

        return Inertia::render('TahunKepengurusan', [
            'tahunKepengurusan' => $tahunKepengurusan
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validasi input tahun
        $request->validate([
            'tahun' => ['required', 'string', 'unique:tahun_kepengurusan'],
            'mulai' => ['required', 'date'],
            'selesai' => ['required', 'date'],
            'isactive' => 'required|boolean',
        ]);

        // Pastikan hanya satu record aktif
        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->update(['isactive' => false]);
        }

        DB::transaction(function () use ($request) {
            // Simpan data baru
            $tahun = TahunKepengurusan::create($request->all());

            // Sinkronisasi status is_active anggota bila tahun ini aktif
            if ((bool) $request->isactive) {
                $this->syncActiveMembershipByYear($tahun->id);
            }
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil ditambahkan.');
    }

    public function update(Request $request, TahunKepengurusan $tahunKepengurusan)
    {
        // Validasi input tahun
        $request->validate([
            'tahun' => ['required', 'string', 'unique:tahun_kepengurusan,tahun,' . $tahunKepengurusan->id],
            'mulai' => ['required', 'date'],
            'selesai' => ['required', 'date'],
            'isactive' => 'required|boolean',
        ]);

        // Pastikan hanya satu record aktif
        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->where('id', '!=', $tahunKepengurusan->id)->update(['isactive' => false]);
        }

        DB::transaction(function () use ($request, $tahunKepengurusan) {
            // Update data
            $tahunKepengurusan->update($request->all());

            // Sinkronisasi status is_active anggota bila tahun ini aktif
            if ((bool) $request->isactive) {
                $this->syncActiveMembershipByYear($tahunKepengurusan->id);
            }
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil diperbarui.');
    }


    /**
     * Update the specified resource in storage.
     */


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TahunKepengurusan $tahunKepengurusan)
    {
        $tahunKepengurusan->delete();

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil dihapus.');
    }
}
