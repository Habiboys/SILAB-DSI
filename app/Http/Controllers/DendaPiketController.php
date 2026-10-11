<?php

namespace App\Http\Controllers;

use App\Models\DendaPiket;
use App\Models\JadwalPiket;
use App\Models\PemasukanKeuangan;
use App\Models\PengaturanPiket;
use App\Models\PeriodePiket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class DendaPiketController extends Controller
{
    public function sync($periodePiketId)
    {
        Gate::authorize('create', PemasukanKeuangan::class);
        $periode = PeriodePiket::findOrFail($periodePiketId);
        $pengaturan = PengaturanPiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)->first();
        $nominalDenda = ($pengaturan && $pengaturan->ada_denda) ? $pengaturan->nominal_denda : 0;

        $userIds = JadwalPiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
            ->withTrashed()
            ->with('kepengurusanUser')
            ->get()
            ->pluck('kepengurusanUser.user_id')
            ->unique()
            ->values();

        foreach ($userIds as $userId) {
            if (!$userId) continue;
            $summary = \App\Services\PiketAttendanceSummary::forUser($periode, $userId);
            $totalDenda = $summary['tidak_hadir'] * $nominalDenda;

            $existing = DendaPiket::where('user_id', $userId)
                ->where('periode_piket_id', $periode->id)
                ->first();

            DendaPiket::updateOrCreate(
                ['user_id' => $userId, 'periode_piket_id' => $periode->id],
                [
                    'kepengurusan_lab_id' => $periode->kepengurusan_lab_id,
                    'total_denda' => $totalDenda,
                    'sudah_dibayar' => $existing ? $existing->sudah_dibayar : 0,
                    'status' => ($existing?->sudah_dibayar ?? 0) >= $totalDenda ? 'lunas' : 'belum_lunas',
                ]
            );
        }

        return response()->json(['success' => true]);
    }

    public function bayar(Request $request)
    {
        Gate::authorize('create', PemasukanKeuangan::class);
        $validated = $request->validate([
            'denda_piket_id' => 'required|exists:denda_piket,id',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string|max:255',
            'bukti' => 'nullable|image|max:2048',
        ]);

        $dendaPiket = DendaPiket::findOrFail($validated['denda_piket_id']);
        $sisa = $dendaPiket->total_denda - $dendaPiket->sudah_dibayar;

        if ($validated['nominal'] > $sisa) {
            return back()->with('error', 'Nominal melebihi sisa denda.');
        }

        $buktiPath = null;

        DB::transaction(function () use ($request, $validated, $dendaPiket, &$buktiPath) {
            $dendaPiket = DendaPiket::whereKey($dendaPiket->id)->lockForUpdate()->firstOrFail();
            if ($validated['nominal'] > $dendaPiket->total_denda - $dendaPiket->sudah_dibayar) {
                throw ValidationException::withMessages(['nominal' => 'Nominal melebihi sisa denda.']);
            }
            if ($request->hasFile('bukti')) {
                $buktiPath = $request->file('bukti')->store('bukti-denda-piket', 'public');
            }
            PemasukanKeuangan::create([
                'tanggal' => $validated['tanggal'],
                'nominal' => $validated['nominal'],
                'deskripsi' => $validated['keterangan'] ?? 'Pembayaran denda tidak hadir piket',
                'bukti' => $buktiPath,
                'user_id' => Auth::id(),
                'kepengurusan_lab_id' => $dendaPiket->kepengurusan_lab_id,
                'nominal_kas_id' => null,
                'is_uang_kas' => false,
                'denda_piket_id' => $dendaPiket->id,
                'tagihan_kas_id' => null,
            ]);

            $dendaPiket->increment('sudah_dibayar', $validated['nominal']);
            if ($dendaPiket->fresh()->sudah_dibayar >= $dendaPiket->total_denda) {
                $dendaPiket->update(['status' => 'lunas']);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran denda piket berhasil.');
    }
}
