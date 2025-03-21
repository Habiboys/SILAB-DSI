<?php

namespace App\Http\Controllers;

use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalPiketController extends Controller
{
    /**
     * Show attendance schedule page (Jadwal Piket)
     */
    public function jadwalPiket(Request $request)
    {
        $periodeId = $request->input('periode_id');
        $periode = null;
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
        }
        
        if (!$periode) {
            return Inertia::render('JadwalPiket', [
                'message' => 'Tidak ada periode piket aktif saat ini.',
                'jadwalPiket' => [],
                'periode' => null,
                'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
                'users' => [],
            ]);
        }
        
        // Get daily schedule
        $jadwalPiket = JadwalPiket::with('user.profile')
            ->where('periode_piket_id', $periode->id)
            ->get()
            ->groupBy('hari');
        
        // Available days
        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        
        // Ensure all days are present in the response
        foreach ($days as $day) {
            if (!isset($jadwalPiket[$day])) {
                $jadwalPiket[$day] = [];
            }
        }
        
        // Get eligible users (with profile and assigned to structure)
        $users = User::whereHas('profile')
            ->whereNotNull('struktur_id')
            ->with('profile')
            ->get();
        
        return Inertia::render('Piket/JadwalPiket', [
            'jadwalPiket' => $jadwalPiket,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
            'users' => $users,
        ]);
    }
    
    /**
     * Store new schedule
     */
    public function storeJadwal(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'hari' => 'required|in:senin,selasa,rabu,kamis,jumat',
            'periode_piket_id' => 'required|exists:periode_piket,id',
        ]);
        
        // Check if user already has a schedule for this day and period
        $existing = JadwalPiket::where('user_id', $validated['user_id'])
            ->where('hari', $validated['hari'])
            ->where('periode_piket_id', $validated['periode_piket_id'])
            ->first();
            
        if ($existing) {
            return back()->with('error', 'User sudah memiliki jadwal pada hari yang sama.');
        }
        
        JadwalPiket::create($validated);
        
        return redirect('/piket/jadwal-piket')->with('success', 'Jadwal piket berhasil ditambahkan.');
    }
    
    /**
     * Update schedule
     */
    public function updateJadwal(Request $request, JadwalPiket $jadwal)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'hari' => 'required|in:senin,selasa,rabu,kamis,jumat',
        ]);
        
        // Check if user already has a schedule for this day and period (except this one)
        $existing = JadwalPiket::where('user_id', $validated['user_id'])
            ->where('hari', $validated['hari'])
            ->where('periode_piket_id', $jadwal->periode_piket_id)
            ->where('id', '!=', $jadwal->id)
            ->first();
            
        if ($existing) {
            return back()->with('error', 'User sudah memiliki jadwal pada hari yang sama.');
        }
        
        $jadwal->update($validated);
        
        return redirect('/piket/jadwal-piket')->with('success', 'Jadwal piket berhasil diperbarui.');
    }
    
    /**
     * Delete schedule
     */
    public function destroyJadwal(JadwalPiket $jadwal)
    {
        $jadwal->delete();
        
        return redirect('/piket/jadwal-piket')->with('success', 'Jadwal piket berhasil dihapus.');
    }
}