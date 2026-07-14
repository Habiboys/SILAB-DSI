<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanUser;
use App\Models\NominalKas;
use App\Models\PemasukanKeuangan;
use App\Models\TagihanKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TagihanKasController extends Controller
{
    public function sync($nominalKasId)
    {
        $nominalKas = NominalKas::findOrFail($nominalKasId);

        $userIds = KepengurusanUser::where('kepengurusan_lab_id', $nominalKas->kepengurusan_lab_id)
            ->where('is_active', true)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $existing = TagihanKas::where('user_id', $userId)
                ->where('nominal_kas_id', $nominalKas->id)
                ->first();

            TagihanKas::updateOrCreate(
                ['user_id' => $userId, 'nominal_kas_id' => $nominalKas->id],
                [
                    'kepengurusan_lab_id' => $nominalKas->kepengurusan_lab_id,
                    'total_tagihan' => $nominalKas->nominal,
                    'sudah_dibayar' => $existing ? $existing->sudah_dibayar : 0,
                    'status' => ($existing && $existing->sudah_dibayar >= $nominalKas->nominal) ? 'lunas' : 'belum_lunas',
                ]
            );
        }

        return response()->json(['success' => true]);
    }

    public function bayar(Request $request)
    {
        $validated = $request->validate([
            'tagihan_kas_id' => 'required|exists:tagihan_kas,id',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string|max:255',
            'bukti' => 'nullable|image|max:2048',
        ]);

        $tagihanKas = TagihanKas::findOrFail($validated['tagihan_kas_id']);
        $sisa = $tagihanKas->total_tagihan - $tagihanKas->sudah_dibayar;

        if ($validated['nominal'] > $sisa) {
            return back()->with('error', 'Nominal melebihi sisa tagihan kas.');
        }

        $buktiPath = null;
        if ($request->hasFile('bukti')) {
            $buktiPath = $request->file('bukti')->store('bukti-tagihan-kas', 'public');
        }

        DB::transaction(function () use ($validated, $tagihanKas, $buktiPath) {
            PemasukanKeuangan::create([
                'tanggal' => $validated['tanggal'],
                'nominal' => $validated['nominal'],
                'deskripsi' => $validated['keterangan'] ?? 'Pembayaran iuran kas',
                'bukti' => $buktiPath,
                'user_id' => Auth::id(),
                'kepengurusan_lab_id' => $tagihanKas->kepengurusan_lab_id,
                'nominal_kas_id' => $tagihanKas->nominal_kas_id,
                'is_uang_kas' => true,
                'denda_piket_id' => null,
                'tagihan_kas_id' => $tagihanKas->id,
            ]);

            $tagihanKas->increment('sudah_dibayar', $validated['nominal']);
            if ($tagihanKas->fresh()->sudah_dibayar >= $tagihanKas->total_tagihan) {
                $tagihanKas->update(['status' => 'lunas']);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran iuran kas berhasil.');
    }
}
