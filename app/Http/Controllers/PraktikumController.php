<?php

namespace App\Http\Controllers;

use App\Models\Praktikum;
use App\Models\JadwalPraktikum;
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
    // Note: Authorization handled via route middleware in Laravel 11

    /**
     * Display a listing of the resources.
     */
    public function index(Request $request)
    {
        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        $kepengurusanlab = null;

        // Try to get kepengurusan_lab by ID first (most efficient)
        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }
        // Fallback: lookup by lab_id + tahun_id
        else {
            if (!$tahun_id) {
                $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
                $tahun_id = $tahunAktif ? $tahunAktif->id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();

        $praktikumData = [];

        if ($kepengurusanlab) {
            $praktikumData = Praktikum::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with('jadwalPraktikum')
                ->get();
        }

        return Inertia::render('Praktikum', [
            'praktikumData' => $praktikumData,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
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
        // Eager load relationships needed for the view
        $praktikum->load([
            'kelas',                                    // semua kelas (parent + sub), parent_kelas_id ada di tiap record
            'jadwalPraktikum',                          // hasManyThrough: jadwal untuk semua kelas (incl. sub)
            'kepengurusanLab.laboratorium',
            'kepengurusanLab.tahunKepengurusan',
        ]);

        // Load specific relations needed for tabs
        // Pertemuan
        $pertemuan = \App\Models\PertemuanPraktikum::where('praktikum_id', $praktikum->id)
            ->with(['kelas', 'modul'])
            ->orderBy('tanggal', 'desc')
            ->get();

        // Modul (All modules in this praktikum)
        $modul = ModulPraktikum::whereHas('pertemuan', function($q) use ($praktikum) {
            $q->where('praktikum_id', $praktikum->id);
        })->with('pertemuan.kelas')->get();

        // Tugas (All assignments via Pertemuan)
        $tugas = \App\Models\TugasPraktikum::whereHas('pertemuan', function($q) use ($praktikum) {
            $q->where('praktikum_id', $praktikum->id);
        })->with(['pertemuan.kelas'])->get();

        // Peserta via Kelas -> Praktikan
        // Or directly from praktikan_praktikum pivot if we have it?
        // Let's get generic participants for now.
        // We might need a better way to get all praktikans.
        // Usually, praktikans are attached to kelas.

        // For now let's reuse existing logic if any or just pass empty for now and fetch via API if needed.
        // Actually, let's just pass the praktikum and let the view handle specific data fetching or pass basics.

        return Inertia::render('Praktikum/Show', [
            'praktikum' => $praktikum,
            'pertemuanList' => $pertemuan,
            'modulList' => $modul,
            'tugasList' => $tugas,
        ]);
    }

    public function store(Request $request)
    {
        // Validation stays the same
        $validatedData = $request->validate([
            'mata_kuliah' => 'required|string|max:255',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'jadwal' => 'required|array|min:1',
            'jadwal.*.kelas' => 'required|string|max:50',
            'jadwal.*.hari' => 'required|string|max:20',
            'jadwal.*.jam_mulai' => 'required|string',
            'jadwal.*.jam_selesai' => 'required|string',
            'jadwal.*.ruangan' => 'required|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            // Create praktikum first
            $praktikum = Praktikum::create([
                'mata_kuliah' => $validatedData['mata_kuliah'],
                'kepengurusan_lab_id' => $validatedData['kepengurusan_lab_id'],
            ]);

            // Then create all jadwal records and corresponding kelas records
            foreach ($validatedData['jadwal'] as $jadwal) {
                // Create kelas record first
                $kelas = \App\Models\Kelas::create([
                    'nama_kelas' => $jadwal['kelas'],
                    'praktikum_id' => $praktikum->id,
                    'status' => 'aktif'
                ]);

                // Create jadwal record with kelas_id reference
                JadwalPraktikum::create([
                    'kelas_id' => $kelas->id,
                    'kelas' => $jadwal['kelas'],
                    'hari' => $jadwal['hari'],
                    'jam_mulai' => $jadwal['jam_mulai'],
                    'jam_selesai' => $jadwal['jam_selesai'],
                    'ruangan' => $jadwal['ruangan']
                ]);
            }

            DB::commit();
            return back()->with('message', 'Praktikum berhasil ditambahkan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        // Validate the incoming request
        $validatedData = $request->validate([
            'mata_kuliah' => 'required|string|max:255',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'jadwal' => 'required|array|min:1',
            'jadwal.*.id' => 'nullable|exists:jadwal_praktikum,id',
            'jadwal.*.kelas' => 'required|string|max:50',
            'jadwal.*.hari' => 'required|string|max:20',
            'jadwal.*.jam_mulai' => 'required|string',
            'jadwal.*.jam_selesai' => 'required|string',
            'jadwal.*.ruangan' => 'required|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            // Find the praktikum to update
            $praktikum = Praktikum::findOrFail($id);

            // Update praktikum data
            $praktikum->update([
                'mata_kuliah' => $validatedData['mata_kuliah'],
                'kepengurusan_lab_id' => $validatedData['kepengurusan_lab_id'],
            ]);

            // Get existing jadwal IDs for this praktikum
            $existingJadwalIds = $praktikum->jadwalPraktikum->pluck('id')->toArray();
            $updatedJadwalIds = [];

            // Update or create jadwal records and corresponding kelas records
            foreach ($validatedData['jadwal'] as $jadwal) {
                if (isset($jadwal['id']) && $jadwal['id']) {
                    // Update existing jadwal
                    $jadwalRecord = JadwalPraktikum::findOrFail($jadwal['id']);

                    // Update or create corresponding kelas record
                    $kelas = null;
                    if ($jadwalRecord->kelas_id) {
                        // Update existing kelas
                        $kelas = \App\Models\Kelas::find($jadwalRecord->kelas_id);
                        if ($kelas) {
                            $kelas->update([
                                'nama_kelas' => $jadwal['kelas']
                            ]);
                        }
                    }

                    // If no kelas exists, create new one
                    if (!$kelas) {
                        $kelas = \App\Models\Kelas::create([
                            'nama_kelas' => $jadwal['kelas'],
                            'praktikum_id' => $praktikum->id,
                            'status' => 'aktif'
                        ]);
                    }

                    $jadwalRecord->update([
                        'kelas_id' => $kelas->id,
                        'kelas' => $jadwal['kelas'],
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan']
                    ]);
                    $updatedJadwalIds[] = $jadwalRecord->id;
                } else {
                    // Create new kelas record
                    $kelas = \App\Models\Kelas::create([
                        'nama_kelas' => $jadwal['kelas'],
                        'praktikum_id' => $praktikum->id,
                        'status' => 'aktif'
                    ]);

                    // Create new jadwal
                    $newJadwal = JadwalPraktikum::create([
                        'kelas_id' => $kelas->id,
                        'kelas' => $jadwal['kelas'],
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan']
                    ]);
                    $updatedJadwalIds[] = $newJadwal->id;
                }
            }

            // Delete jadwal records that were not updated/included and their corresponding kelas
            $jadwalToDelete = array_diff($existingJadwalIds, $updatedJadwalIds);
            if (!empty($jadwalToDelete)) {
                // Get kelas_ids from jadwal records to be deleted
                $kelasToDelete = JadwalPraktikum::whereIn('id', $jadwalToDelete)
                    ->whereNotNull('kelas_id')
                    ->pluck('kelas_id');

                // Delete jadwal records first
                JadwalPraktikum::whereIn('id', $jadwalToDelete)->delete();

                // Delete corresponding kelas records
                if (!$kelasToDelete->isEmpty()) {
                    \App\Models\Kelas::whereIn('id', $kelasToDelete)->delete();
                }
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
            // Begin transaction for safe deletion
            DB::beginTransaction();

            // 1. Delete files from storage for all related modul_praktikum records
            $moduls = ModulPraktikum::where('praktikum_id', $praktikum->id)->get();
            foreach ($moduls as $modul) {
                if ($modul->modul && Storage::disk('public')->exists($modul->modul)) {
                    Storage::disk('public')->delete($modul->modul);
                }
            }

            // 2. Delete related modul_praktikum records first
            ModulPraktikum::where('praktikum_id', $praktikum->id)->delete();

            // 4. Delete related jadwal_praktikum records (via Kelas)
            // Get all kelas IDs for this praktikum
            $kelasIds = \App\Models\Kelas::where('praktikum_id', $praktikum->id)->pluck('id');
            JadwalPraktikum::whereIn('kelas_id', $kelasIds)->delete();

            // 3. Delete related kelas records (Moved down)
            \App\Models\Kelas::where('praktikum_id', $praktikum->id)->delete();

            // 5. Finally delete the praktikum record
            $praktikum->delete();

            // Commit transaction
            DB::commit();

            return back()->with('message', 'Praktikum, jadwal, dan modul berhasil dihapus');
        } catch (\Exception $e) {
            // Rollback on error
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus praktikum: ' . $e->getMessage());
        }
    }
}
