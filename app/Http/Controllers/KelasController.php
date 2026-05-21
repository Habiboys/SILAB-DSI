<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KelasController extends Controller
{

    public function storeSubKelas(Request $request, Praktikum $praktikum, Kelas $kelas)
    {

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
                'hari'            => $validated['hari'] ?? null,
                'jam_mulai'       => $validated['jam_mulai'] ?? null,
                'jam_selesai'     => $validated['jam_selesai'] ?? null,
                'ruangan'         => $validated['ruangan'] ?? null,
            ]);

            DB::commit();

            return back()->with('message', 'Sub-kelas ' . $subKelas->nama_kelas . ' berhasil dibuat dari kelas ' . $kelas->nama_kelas . '.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal membuat sub-kelas: ' . $e->getMessage());
        }
    }


    public function updateSubKelas(Request $request, Kelas $subKelas)
    {
        $validated = $request->validate([
            'nama_kelas' => 'required|string|max:50',
        ]);

        $subKelas->update(['nama_kelas' => $validated['nama_kelas']]);

        return back()->with('message', 'Sub-kelas berhasil diperbarui.');
    }


    public function destroySubKelas(Kelas $subKelas)
    {
        if ($subKelas->parent_kelas_id === null) {
            return back()->with('error', 'Ini bukan sub-kelas. Gunakan hapus kelas biasa.');
        }

        $nama = $subKelas->nama_kelas;
        $subKelas->delete();

        return back()->with('message', 'Sub-kelas ' . $nama . ' berhasil dihapus beserta semua data terkait.');
    }


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
