<?php

namespace App\Http\Controllers;

use App\Models\PertemuanPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AbsensiPraktikanExport;
use App\Exports\AbsensiAslabExport;
use App\Support\KelasScopeResolver;

class PertemuanPraktikumController extends Controller
{

    public function index(Request $request, Praktikum $praktikum)
    {
        $praktikum->load(['pertemuan.modul', 'pertemuan.absensiPraktikan', 'pertemuan.absensiAslab', 'pertemuan.kelas.parent']);
        $praktikum->load('kelas');

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        $pertemuanQuery = PertemuanPraktikum::query()
            ->with(['modul', 'absensiPraktikan', 'absensiAslab', 'kelas.parent'])
            ->whereHas('kelas', function ($q) use ($praktikum) {
                $q->where('praktikum_id', $praktikum->id);
            });

        if (!empty($kelasScopeIds)) {
            $pertemuanQuery->whereIn('kelas_id', $kelasScopeIds);
        }

        $pertemuan = $pertemuanQuery->get();

        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $praktikum->kelas->firstWhere('id', $requestedKelasId);
        }

        return Inertia::render('Pertemuan/Index', [
            'praktikum' => $praktikum,
            'pertemuan' => $pertemuan,
            'kelas' => $praktikum->kelas,
            'filters' => $request->only(['kelas_id', 'context_kelas_id']),
            'classContext' => $classContext,
        ]);
    }


    private function validateEnrollmentKelas(string $kelasId): ?string
    {
        $hasSubKelas = \App\Models\Kelas::where('parent_kelas_id', $kelasId)->exists();
        if ($hasSubKelas) {
            return 'Kelas ini memiliki sub-kelas. Buat pertemuan untuk sub-kelas yang sesuai.';
        }
        return null;
    }


    public function store(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tanggal' => 'required|date',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        PertemuanPraktikum::create([
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'kelas_id' => $request->kelas_id,
        ]);

        return redirect()->back()->with('message', 'Pertemuan berhasil ditambahkan.');
    }


    public function update(Request $request, PertemuanPraktikum $pertemuan)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tanggal' => 'required|date',
            'kelas_id' => 'required|exists:kelas,id'
        ]);

        if ($error = $this->validateEnrollmentKelas($request->kelas_id)) {
            return back()->withErrors(['kelas_id' => $error])->withInput();
        }

        $pertemuan->update([
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'kelas_id' => $request->kelas_id,
        ]);

        return redirect()->back()->with('message', 'Pertemuan berhasil diperbarui.');
    }


    public function destroy(PertemuanPraktikum $pertemuan)
    {

        $pertemuan->delete();

        return redirect()->back()->with('message', 'Pertemuan berhasil dihapus.');
    }

    public function exportPraktikan(Request $request, Praktikum $praktikum, $kelasId)
    {
        return Excel::download(new AbsensiPraktikanExport($praktikum->id, $kelasId), 'absensi_praktikan.xlsx');
    }

    public function exportAslab(Request $request, Praktikum $praktikum, $kelasId)
    {
        return Excel::download(new AbsensiAslabExport($praktikum->id, $kelasId), 'absensi_aslab.xlsx');
    }
}
