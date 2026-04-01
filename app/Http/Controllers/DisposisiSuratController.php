<?php

namespace App\Http\Controllers;

use App\Models\DisposisiSurat;
use App\Models\SuratMasuk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DisposisiSuratController extends Controller
{
    /**
     * Create a new disposisi for a surat masuk.
     * POST /surat-menyurat/surat-masuk/{suratMasukId}/disposisi
     */
    public function store(Request $request, string $suratMasukId)
    {
        $user = Auth::user();
        if (! $user->can('disposisi.create')) {
            abort(403);
        }

        $surat = SuratMasuk::findOrFail($suratMasukId);

        $validated = $request->validate([
            'kepada_user_id' => ['required', 'uuid', 'exists:users,id'],
            'catatan'        => ['nullable', 'string', 'max:1000'],
        ]);

        DisposisiSurat::create([
            'surat_masuk_id' => $surat->id,
            'dari_user_id'   => $user->id,
            'kepada_user_id' => $validated['kepada_user_id'],
            'catatan'        => $validated['catatan'] ?? null,
            'status'         => 'belum_dibaca',
        ]);

        return redirect()->back()->with('success', 'Disposisi berhasil ditambahkan.');
    }

    /**
     * Update status of a disposisi (sudah_dibaca / selesai).
     * PATCH /surat-menyurat/disposisi/{id}/status
     */
    public function updateStatus(Request $request, string $id)
    {
        $user      = Auth::user();
        $disposisi = DisposisiSurat::findOrFail($id);

        // Only the recipient can update status
        if ($disposisi->kepada_user_id !== $user->id) {
            abort(403, 'Hanya penerima yang dapat mengubah status disposisi.');
        }

        if (! $user->can('disposisi.update-status')) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:sudah_dibaca,selesai'],
        ]);

        $data = ['status' => $validated['status']];

        if ($validated['status'] === 'sudah_dibaca' && ! $disposisi->dibaca_at) {
            $data['dibaca_at'] = now();
        }
        if ($validated['status'] === 'selesai' && ! $disposisi->diselesaikan_at) {
            $data['diselesaikan_at'] = now();
        }

        $disposisi->update($data);

        return redirect()->back()->with('success', 'Status disposisi berhasil diperbarui.');
    }
}
