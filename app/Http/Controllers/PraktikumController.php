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
    /**
     * Display a listing of the resources.
     */
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        // Jika tidak ada tahun yang dipilih, gunakan tahun aktif
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();
        
        $praktikumData = [];
        $kepengurusanlab = null;

        if ($lab_id && $tahun_id) {
            // Cari kepengurusan lab berdasarkan lab_id dan tahun_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            // Jika kepengurusan lab ditemukan, ambil data praktikum
            if ($kepengurusanlab) {
                $praktikumData = Praktikum::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->with('jadwalPraktikum')
                    ->get();
            }
        }

        return Inertia::render('Praktikum', [
            'praktikumData' => $praktikumData,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ],
            'flash' => [
                'message' => session('message'),
                'error' => session('error')
            ],
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
            
            // Then create all jadwal records
            foreach ($validatedData['jadwal'] as $jadwal) {
                JadwalPraktikum::create([
                    'praktikum_id' => $praktikum->id,
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
            
            // Update or create jadwal records
            foreach ($validatedData['jadwal'] as $jadwal) {
                if (isset($jadwal['id']) && $jadwal['id']) {
                    // Update existing jadwal
                    $jadwalRecord = JadwalPraktikum::findOrFail($jadwal['id']);
                    $jadwalRecord->update([
                        'kelas' => $jadwal['kelas'],
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan']
                    ]);
                    $updatedJadwalIds[] = $jadwalRecord->id;
                } else {
                    // Create new jadwal
                    $newJadwal = JadwalPraktikum::create([
                        'praktikum_id' => $praktikum->id,
                        'kelas' => $jadwal['kelas'],
                        'hari' => $jadwal['hari'],
                        'jam_mulai' => $jadwal['jam_mulai'],
                        'jam_selesai' => $jadwal['jam_selesai'],
                        'ruangan' => $jadwal['ruangan']
                    ]);
                    $updatedJadwalIds[] = $newJadwal->id;
                }
            }
            
            // Delete jadwal records that were not updated/included
            $jadwalToDelete = array_diff($existingJadwalIds, $updatedJadwalIds);
            if (!empty($jadwalToDelete)) {
                JadwalPraktikum::whereIn('id', $jadwalToDelete)->delete();
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
            
            // 3. Delete related jadwal_praktikum records
            JadwalPraktikum::where('praktikum_id', $praktikum->id)->delete();
            
            // 4. Finally delete the praktikum record
            $praktikum->delete();
            
            // Commit transaction
            DB::commit();
        
            return back()->with('success', 'Praktikum, jadwal, dan modul berhasil dihapus');
        } catch (\Exception $e) {
            // Rollback on error
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus praktikum: ' . $e->getMessage());
        }
    }
}