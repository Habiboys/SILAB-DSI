<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Praktikum;
use App\Models\JadwalPraktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KelasController extends Controller
{
    /**
     * Tambah sub-kelas dari sebuah kelas parent.
     *
     * POST /praktikum/{praktikum}/kelas/{kelas}/sub-kelas
     *
     * Sub-kelas punya jadwal & tugas sendiri (karena sudah relasi ke kelas_id),
     * tapi secara akademis tetap di bawah kelas asli (parent) untuk penilaian akhir.
     *
     * Aturan: hanya boleh 1 level — sub-kelas tidak bisa punya sub-kelas lagi.
     */
    public function storeSubKelas(Request $request, Praktikum $praktikum, Kelas $kelas)
    {
        // Guard: hanya parent kelas yang boleh dipecah
        if ($kelas->parent_kelas_id !== null) {
            return back()->with('error', 'Sub-kelas tidak bisa dipecah lagi. Hanya kelas asli yang boleh dipecah.');
        }

        $validated = $request->validate([
            'nama_kelas'  => 'required|string|max:50',
            'hari'        => 'nullable|string|max:20',
            'jam_mulai'   => 'nullable|required_with:hari|string',
            'jam_selesai' => 'nullable|required_with:hari|string',
            'ruangan'     => 'nullable|string|max:50',
        ]);

        try {
            DB::beginTransaction();

            $subKelas = Kelas::create([
                'nama_kelas'      => $validated['nama_kelas'],
                'praktikum_id'    => $kelas->praktikum_id,
                'parent_kelas_id' => $kelas->id,
                'status'          => 'aktif',
            ]);

            // Buat jadwal untuk sub-kelas jika detail jadwal diisi
            if (!empty($validated['hari'])) {
                JadwalPraktikum::create([
                    'kelas_id'    => $subKelas->id,
                    'kelas'       => $validated['nama_kelas'],
                    'hari'        => $validated['hari'],
                    'jam_mulai'   => $validated['jam_mulai'],
                    'jam_selesai' => $validated['jam_selesai'],
                    'ruangan'     => $validated['ruangan'] ?? '-',
                    'praktikum_id'=> $kelas->praktikum_id,
                ]);
            }

            DB::commit();

            return back()->with('message', 'Sub-kelas ' . $subKelas->nama_kelas . ' berhasil dibuat dari kelas ' . $kelas->nama_kelas . '.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat sub-kelas: ' . $e->getMessage());
        }
    }

    /**
     * Update nama sub-kelas.
     *
     * PUT /praktikum/kelas/sub-kelas/{subKelas}
     */
    public function updateSubKelas(Request $request, Kelas $subKelas)
    {
        $validated = $request->validate([
            'nama_kelas' => 'required|string|max:50',
        ]);

        $subKelas->update(['nama_kelas' => $validated['nama_kelas']]);

        // Sinkron nama di jadwal_praktikum jika ada
        JadwalPraktikum::where('kelas_id', $subKelas->id)
            ->update(['kelas' => $validated['nama_kelas']]);

        return back()->with('message', 'Sub-kelas berhasil diperbarui.');
    }

    /**
     * Hapus sub-kelas. Semua data terkait (jadwal, pertemuan, tugas, absensi)
     * ikut terhapus via ON DELETE CASCADE pada FK kelas_id.
     *
     * DELETE /praktikum/kelas/sub-kelas/{subKelas}
     */
    public function destroySubKelas(Kelas $subKelas)
    {
        if ($subKelas->parent_kelas_id === null) {
            return back()->with('error', 'Ini bukan sub-kelas. Gunakan hapus kelas biasa.');
        }

        $nama = $subKelas->nama_kelas;
        $subKelas->delete();

        return back()->with('message', 'Sub-kelas ' . $nama . ' berhasil dihapus beserta semua data terkait.');
    }

    /**
     * Pindahkan praktikan dari parent kelas ke salah satu sub-kelas.
     *
     * POST /praktikum/kelas/{kelas}/pindah-praktikan
     * Body: { praktikan_ids: [uuid, ...], target_kelas_id: uuid }
     */
    public function pindahkanPraktikan(Request $request, Kelas $kelas)
    {
        if ($kelas->parent_kelas_id !== null) {
            return back()->with('error', 'Hanya parent kelas yang bisa menjadi sumber redistribusi.');
        }

        $validated = $request->validate([
            'praktikan_ids'  => 'required|array|min:1',
            'praktikan_ids.*' => 'exists:praktikan_praktikum,id',
            'target_kelas_id' => 'required|exists:kelas,id',
        ]);

        $targetKelas = Kelas::where('id', $validated['target_kelas_id'])
            ->where('parent_kelas_id', $kelas->id)
            ->firstOrFail();

        $updated = \App\Models\PraktikanPraktikum::whereIn('id', $validated['praktikan_ids'])
            ->where('kelas_id', $kelas->id)
            ->update(['kelas_id' => $targetKelas->id]);

        return back()->with('message', $updated . ' praktikan berhasil dipindahkan ke sub-kelas ' . $targetKelas->nama_kelas . '.');
    }

    /**
     * Pindahkan pertemuan dari parent kelas ke salah satu sub-kelas.
     *
     * POST /praktikum/kelas/{kelas}/pindah-pertemuan
     * Body: { pertemuan_ids: [uuid, ...], target_kelas_id: uuid }
     */
    public function pindahkanPertemuan(Request $request, Kelas $kelas)
    {
        if ($kelas->parent_kelas_id !== null) {
            return back()->with('error', 'Hanya parent kelas yang bisa menjadi sumber redistribusi.');
        }

        $validated = $request->validate([
            'pertemuan_ids'  => 'required|array|min:1',
            'pertemuan_ids.*' => 'exists:pertemuan_praktikum,id',
            'target_kelas_id' => 'required|exists:kelas,id',
        ]);

        $targetKelas = Kelas::where('id', $validated['target_kelas_id'])
            ->where('parent_kelas_id', $kelas->id)
            ->firstOrFail();

        $updated = \App\Models\PertemuanPraktikum::whereIn('id', $validated['pertemuan_ids'])
            ->where('kelas_id', $kelas->id)
            ->update(['kelas_id' => $targetKelas->id]);

        return back()->with('message', $updated . ' pertemuan berhasil dipindahkan ke sub-kelas ' . $targetKelas->nama_kelas . '.');
    }

    /**
     * Pindahkan tugas dari parent kelas ke salah satu sub-kelas.
     *
     * POST /praktikum/kelas/{kelas}/pindah-tugas
     * Body: { tugas_ids: [uuid, ...], target_kelas_id: uuid }
     */
    public function pindahkanTugas(Request $request, Kelas $kelas)
    {
        if ($kelas->parent_kelas_id !== null) {
            return back()->with('error', 'Hanya parent kelas yang bisa menjadi sumber redistribusi.');
        }

        $validated = $request->validate([
            'tugas_ids'      => 'required|array|min:1',
            'tugas_ids.*'    => 'exists:tugas_praktikum,id',
            'target_kelas_id' => 'required|exists:kelas,id',
        ]);

        $targetKelas = Kelas::where('id', $validated['target_kelas_id'])
            ->where('parent_kelas_id', $kelas->id)
            ->firstOrFail();

        $updated = \App\Models\TugasPraktikum::whereIn('id', $validated['tugas_ids'])
            ->where('kelas_id', $kelas->id)
            ->update(['kelas_id' => $targetKelas->id]);

        return back()->with('message', $updated . ' tugas berhasil dipindahkan ke sub-kelas ' . $targetKelas->nama_kelas . '.');
    }
}
