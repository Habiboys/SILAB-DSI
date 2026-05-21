<?php

namespace App\Http\Controllers;

use App\Models\Praktikum;
use App\Models\Kelas;
use App\Models\MataKuliah;
use App\Models\ModulPraktikum;
use App\Models\Laboratorium;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PraktikumController extends Controller
{


    public function index(Request $request)
    {

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        $kepengurusanlab = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }

        else {
            if (!$tahun_id && $lab_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        $laboratorium = Laboratorium::all();

        $praktikumData = [];

        if ($kepengurusanlab) {
            $praktikumData = Praktikum::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with([
                    'jadwalPraktikum',
                    'parentKelas.subKelas',
                    'mataKuliah',
                ])
                ->withCount([
                    'praktikans as praktikans_count' => function ($query) {
                        $query->distinct('praktikan_id');
                    },
                ])
                ->get()
                ->map(function ($praktikum) {

                    $praktikum->setAttribute('mata_kuliah_rel', $praktikum->mataKuliah);
                    return $praktikum;
                });
        }

        $mataKuliah = MataKuliah::where('status', 'aktif')
            ->orderBy('kode_mata_kuliah')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Praktikum', [
            'praktikumData' => $praktikumData,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'mataKuliah' => $mataKuliah,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'kepengurusan_lab_id' => $kepengurusanlab ? $kepengurusanlab->id : null,
            ],
            'flash' => [
                'message' => session('message'),
                'error' => session('error')
            ],
        ]);
    }

    public function show(Praktikum $praktikum)
    {

        $praktikum->load([
            'kelas',
            'jadwalPraktikum',
            'kepengurusanLab.laboratorium',
            'kepengurusanLab.tahunKepengurusan',
        ]);

        $kelasIds = $praktikum->kelas()->pluck('id');

        $pertemuan = \App\Models\PertemuanPraktikum::whereIn('kelas_id', $kelasIds)
            ->with(['kelas', 'modul'])
            ->orderBy('tanggal', 'desc')
            ->get();

        $modul = ModulPraktikum::whereHas('pertemuan.kelas', function($q) use ($praktikum) {
            $q->where('praktikum_id', $praktikum->id);
        })->with('pertemuan.kelas')->get();

        $tugas = \App\Models\TugasPraktikum::whereHas('kelas', function($q) use ($praktikum) {
            $q->where('praktikum_id', $praktikum->id);
        })->with(['kelas'])->get();

        $praktikanCountByKelas = \App\Models\PraktikanPraktikum::where('praktikum_id', $praktikum->id)
            ->selectRaw('kelas_id, count(*) as cnt')
            ->groupBy('kelas_id')
            ->pluck('cnt', 'kelas_id');

        $pertemuanCountByKelas = \App\Models\PertemuanPraktikum::whereIn('kelas_id', $kelasIds)
            ->selectRaw('kelas_id, count(*) as cnt')
            ->groupBy('kelas_id')
            ->pluck('cnt', 'kelas_id');

        $tugasCountByKelas = \App\Models\TugasPraktikum::whereIn('kelas_id', $kelasIds)
            ->selectRaw('kelas_id, count(*) as cnt')
            ->groupBy('kelas_id')
            ->pluck('cnt', 'kelas_id');

        $mataKuliah = MataKuliah::where('status', 'aktif')
            ->orderBy('kode_mata_kuliah')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Praktikum/Show', [
            'praktikum'              => $praktikum,
            'pertemuanList'          => $pertemuan,
            'modulList'              => $modul,
            'tugasList'              => $tugas,
            'praktikanCountByKelas'  => $praktikanCountByKelas,
            'pertemuanCountByKelas'  => $pertemuanCountByKelas,
            'tugasCountByKelas'      => $tugasCountByKelas,
            'mataKuliah'             => $mataKuliah,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'jadwal' => 'nullable|array',
            'jadwal.*.kelas' => 'required_with:jadwal|string|max:50',
            'jadwal.*.hari' => 'required_with:jadwal|string|max:20',
            'jadwal.*.jam_mulai' => 'required_with:jadwal|string',
            'jadwal.*.jam_selesai' => 'required_with:jadwal|string',
            'jadwal.*.ruangan' => 'required_with:jadwal|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            $mataKuliah = MataKuliah::findOrFail($validatedData['mata_kuliah_id']);
            $kepengurusan = KepengurusanLab::findOrFail($validatedData['kepengurusan_lab_id']);
            $tahunId = $kepengurusan->tahun_kepengurusan_id;

            $exists = Praktikum::where('mata_kuliah_id', $mataKuliah->id)
                ->whereHas('kepengurusanLab', function ($q) use ($tahunId) {
                    $q->where('tahun_kepengurusan_id', $tahunId);
                })
                ->exists();

            if ($exists) {
                DB::rollBack();
                return back()->withInput()->with('error', 'Mata kuliah ini sudah digunakan sebagai praktikum di laboratorium lain pada tahun kepengurusan yang sama.');
            }

            $praktikum = Praktikum::create([
                'mata_kuliah' => $mataKuliah->nama,
                'mata_kuliah_id' => $mataKuliah->id,
                'kepengurusan_lab_id' => $validatedData['kepengurusan_lab_id'],
            ]);

            foreach (($validatedData['jadwal'] ?? []) as $jadwal) {
                $kelas = Kelas::create([
                    'nama_kelas' => $jadwal['kelas'],
                    'praktikum_id' => $praktikum->id,
                    'status' => 'aktif',
                    'hari' => $jadwal['hari'],
                    'jam_mulai' => $jadwal['jam_mulai'],
                    'jam_selesai' => $jadwal['jam_selesai'],
                    'ruangan' => $jadwal['ruangan'],
                ]);
            }

            DB::commit();
            return back()->with('message', 'Praktikum berhasil ditambahkan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function updateInfo(Request $request, Praktikum $praktikum)
    {
        $validatedData = $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliah,id',
        ]);

        $mataKuliah = MataKuliah::findOrFail($validatedData['mata_kuliah_id']);

        $praktikum->load('kepengurusanLab');
        $tahunId = $praktikum->kepengurusanLab->tahun_kepengurusan_id;

        $exists = Praktikum::where('mata_kuliah_id', $mataKuliah->id)
            ->where('id', '!=', $praktikum->id)
            ->whereHas('kepengurusanLab', function ($q) use ($tahunId) {
                $q->where('tahun_kepengurusan_id', $tahunId);
            })
            ->exists();

        if ($exists) {
            return back()->withInput()->with('error', 'Mata kuliah ini sudah digunakan sebagai praktikum di laboratorium lain pada tahun kepengurusan yang sama.');
        }

        $praktikum->update([
            'mata_kuliah' => $mataKuliah->nama,
            'mata_kuliah_id' => $mataKuliah->id,
        ]);

        return back()->with('message', 'Info praktikum berhasil diperbarui');
    }

    public function addKelas(Request $request, Praktikum $praktikum)
    {
        $validatedData = $request->validate([
            'nama_kelas' => 'required|string|max:50',
            'hari' => 'required|string|max:20',
            'jam_mulai' => 'required|string',
            'jam_selesai' => 'required|string',
            'ruangan' => 'required|string|max:50',
        ]);

        $kelas = Kelas::create([
            'nama_kelas' => $validatedData['nama_kelas'],
            'praktikum_id' => $praktikum->id,
            'status' => 'aktif',
            'hari' => $validatedData['hari'],
            'jam_mulai' => $validatedData['jam_mulai'],
            'jam_selesai' => $validatedData['jam_selesai'],
            'ruangan' => $validatedData['ruangan'],
        ]);

        return back()->with('message', 'Kelas dan jadwal berhasil ditambahkan');
    }

    public function updateKelas(Request $request, Praktikum $praktikum, Kelas $kelas)
    {
        if ($kelas->praktikum_id !== $praktikum->id) {
            abort(404);
        }

        $validatedData = $request->validate([
            'nama_kelas' => 'required|string|max:50',
            'hari' => 'required|string|max:20',
            'jam_mulai' => 'required|string',
            'jam_selesai' => 'required|string',
            'ruangan' => 'required|string|max:50',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $kelas->update([
            'nama_kelas' => $validatedData['nama_kelas'],
            'hari' => $validatedData['hari'],
            'jam_mulai' => $validatedData['jam_mulai'],
            'jam_selesai' => $validatedData['jam_selesai'],
            'ruangan' => $validatedData['ruangan'],
            'status' => $validatedData['status'] ?? $kelas->status,
        ]);

        return back()->with('message', 'Kelas berhasil diperbarui');
    }

    public function destroyKelas(Praktikum $praktikum, Kelas $kelas)
    {
        if ($kelas->praktikum_id !== $praktikum->id) {
            abort(404);
        }

        $namaKelas = $kelas->nama_kelas;
        $isParent = is_null($kelas->parent_kelas_id);

        $kelas->delete();

        return back()->with(
            'message',
            $isParent
                ? "Kelas {$namaKelas} berhasil dihapus"
                : "Sub-kelas {$namaKelas} berhasil dihapus"
        );
    }

    public function storeMataKuliah(Request $request)
    {
        if (!\Illuminate\Support\Facades\Auth::user()->can('matakuliah.create') && !\Illuminate\Support\Facades\Auth::user()->hasRole('superadmin')) {
            abort(403, 'Anda tidak memiliki izin untuk menambahkan mata kuliah.');
        }

        $validatedData = $request->validate([
            'kode_mata_kuliah' => 'required|string|max:30|unique:mata_kuliah,kode_mata_kuliah',
            'nama' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|min:1|max:14',
        ]);

        MataKuliah::create([
            'kode_mata_kuliah' => strtoupper(trim($validatedData['kode_mata_kuliah'])),
            'nama' => trim($validatedData['nama']),
            'sks' => $validatedData['sks'],
            'semester' => $validatedData['semester'],
            'status' => 'aktif',
        ]);

        return back()->with('message', 'Mata kuliah berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {

        $validatedData = $request->validate([
            'mata_kuliah_id' => 'nullable|exists:mata_kuliah,id|required_without:mata_kuliah',
            'mata_kuliah' => 'nullable|string|max:255|required_without:mata_kuliah_id',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'jadwal' => 'required|array|min:1',
            'jadwal.*.id' => 'nullable|exists:kelas,id',
            'jadwal.*.kelas' => 'required|string|max:50',
            'jadwal.*.hari' => 'required|string|max:20',
            'jadwal.*.jam_mulai' => 'required|string',
            'jadwal.*.jam_selesai' => 'required|string',
            'jadwal.*.ruangan' => 'required|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            $praktikum = Praktikum::findOrFail($id);

            $mataKuliahId = $validatedData['mata_kuliah_id'] ?? null;
            $mataKuliahNama = $validatedData['mata_kuliah'];

            if ($mataKuliahId) {
                $mataKuliah = MataKuliah::findOrFail($mataKuliahId);
                $mataKuliahNama = $mataKuliah->nama;

                $kepengurusan = KepengurusanLab::findOrFail($validatedData['kepengurusan_lab_id']);
                $tahunId = $kepengurusan->tahun_kepengurusan_id;

                $exists = Praktikum::where('mata_kuliah_id', $mataKuliahId)
                    ->where('id', '!=', $praktikum->id)
                    ->whereHas('kepengurusanLab', function ($q) use ($tahunId) {
                        $q->where('tahun_kepengurusan_id', $tahunId);
                    })
                    ->exists();

                if ($exists) {
                    DB::rollBack();
                    return back()->withInput()->with('error', 'Mata kuliah ini sudah digunakan sebagai praktikum di laboratorium lain pada tahun kepengurusan yang sama.');
                }
            }

            $praktikum->update([
                'mata_kuliah' => $mataKuliahNama,
                'mata_kuliah_id' => $mataKuliahId,
                'kepengurusan_lab_id' => $validatedData['kepengurusan_lab_id'],
            ]);

            $existingKelasIds = $praktikum->kelas()->pluck('id')->toArray();
            $updatedKelasIds = [];

            foreach ($validatedData['jadwal'] as $jadwal) {
                if (isset($jadwal['id']) && $jadwal['id']) {
                    $kelas = Kelas::where('praktikum_id', $praktikum->id)
                        ->findOrFail($jadwal['id']);

                    $kelas->update([
                        'nama_kelas' => $jadwal['kelas'],
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan'],
                    ]);
                    $updatedKelasIds[] = $kelas->id;
                } else {
                    $kelas = Kelas::create([
                        'nama_kelas' => $jadwal['kelas'],
                        'praktikum_id' => $praktikum->id,
                        'status' => 'aktif',
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan'],
                    ]);
                    $updatedKelasIds[] = $kelas->id;
                }
            }

            $kelasToDelete = array_diff($existingKelasIds, $updatedKelasIds);
            if (!empty($kelasToDelete)) {
                Kelas::whereIn('id', $kelasToDelete)->delete();
            }

            DB::commit();
            return back()->with('message', 'Praktikum berhasil diperbarui');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function destroy(Praktikum $praktikum)
    {
        try {

            DB::beginTransaction();

            $kelasIds = \App\Models\Kelas::where('praktikum_id', $praktikum->id)->pluck('id');
            $pertemuanIds = \App\Models\PertemuanPraktikum::whereIn('kelas_id', $kelasIds)->pluck('id');
            $moduls = ModulPraktikum::whereIn('pertemuan_id', $pertemuanIds)->get();
            foreach ($moduls as $modul) {
                if ($modul->modul && Storage::disk('public')->exists($modul->modul)) {
                    Storage::disk('public')->delete($modul->modul);
                }
            }

            ModulPraktikum::whereIn('pertemuan_id', $pertemuanIds)->delete();

            \App\Models\Kelas::where('praktikum_id', $praktikum->id)->delete();

            $praktikum->delete();

            DB::commit();

            return back()->with('message', 'Praktikum berhasil dihapus');
        } catch (\Exception $e) {

            DB::rollBack();
            return back()->with('error', 'Gagal menghapus praktikum: ' . $e->getMessage());
        }
    }
}
