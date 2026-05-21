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

    private function syncActiveKepengurusanByYear(string $tahunKepengurusanId): void
    {
        $kepengurusanAktifPerLab = KepengurusanLab::where('tahun_kepengurusan_id', $tahunKepengurusanId)
            ->get(['id', 'laboratorium_id'])
            ->groupBy('laboratorium_id');

        foreach ($kepengurusanAktifPerLab as $labId => $rows) {
            $activeKepIds = $rows->pluck('id')->toArray();

            KepengurusanLab::where('laboratorium_id', $labId)
                ->whereNotIn('id', $activeKepIds)
                ->update(['is_active' => false]);

            KepengurusanLab::whereIn('id', $activeKepIds)
                ->update(['is_active' => true]);
        }
    }


    private function syncActiveMembershipByYear(string $tahunKepengurusanId): void
    {
        $kepengurusanAktifPerLab = KepengurusanLab::where('tahun_kepengurusan_id', $tahunKepengurusanId)
            ->get(['id', 'laboratorium_id'])
            ->groupBy('laboratorium_id');

        foreach ($kepengurusanAktifPerLab as $labId => $rows) {
            $activeKepIds = $rows->pluck('id')->toArray();

            KepengurusanUser::whereHas('kepengurusanLab', function ($q) use ($labId, $activeKepIds) {
                    $q->where('laboratorium_id', $labId)
                      ->whereNotIn('id', $activeKepIds);
                })
                ->update(['is_active' => false]);

            KepengurusanUser::whereIn('kepengurusan_lab_id', $activeKepIds)
                ->update(['is_active' => true]);
        }
    }


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

        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->update(['isactive' => false]);
        }

        DB::transaction(function () use ($request) {

            $tahun = TahunKepengurusan::create($request->all());

            if ((bool) $request->isactive) {
                $this->syncActiveKepengurusanByYear($tahun->id);
                $this->syncActiveMembershipByYear($tahun->id);
            }
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil ditambahkan.');
    }

    public function update(Request $request, TahunKepengurusan $tahunKepengurusan)
    {

        $request->validate([
            'tahun' => ['required', 'string', 'unique:tahun_kepengurusan,tahun,' . $tahunKepengurusan->id],
            'mulai' => ['required', 'date'],
            'selesai' => ['required', 'date'],
            'isactive' => 'required|boolean',
        ]);

        if ($request->isactive) {
            TahunKepengurusan::where('isactive', true)->where('id', '!=', $tahunKepengurusan->id)->update(['isactive' => false]);
        }

        DB::transaction(function () use ($request, $tahunKepengurusan) {

            $tahunKepengurusan->update($request->all());

            if ((bool) $request->isactive) {
                $this->syncActiveKepengurusanByYear($tahunKepengurusan->id);
                $this->syncActiveMembershipByYear($tahunKepengurusan->id);
            }
        });

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil diperbarui.');
    }




    public function destroy(TahunKepengurusan $tahunKepengurusan)
    {
        $tahunKepengurusan->delete();

        return redirect()->route('tahun-kepengurusan.index')
            ->with('message', 'Tahun Kepengurusan berhasil dihapus.');
    }
}
