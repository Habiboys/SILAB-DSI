<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    /**
     * Show the attendance form page (Ambil Absen)
     */
    public function ambilAbsen()
    {
        $user = Auth::user();
        $periodePiket = PeriodePiket::where('isactive', true)->first();
        
        // Check if there is an active period
        if (!$periodePiket) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Tidak ada periode piket aktif saat ini.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
            ]);
        }
        
        // Get user's attendance schedule for today
        $jadwalPiket = JadwalPiket::where('user_id', $user->id)
            ->where('hari', strtolower(now()->locale('id')->dayName))
            ->first();
            
        return Inertia::render('Piket/AmbilAbsen', [
            'jadwal' => $jadwalPiket,
            'periode' => $periodePiket,
            'today' => now()->format('Y-m-d'),
        ]);
    }
    
    /**
     * Store attendance record
     */
    public function storeAbsen(Request $request)
    {
        $validated = $request->validate([
            'jam_masuk' => 'required',
            'jam_keluar' => 'nullable',
            'foto' => 'required|string', // This will be a base64 encoded image
            'kegiatan' => 'required|string',
            'periode_piket_id' => 'required|exists:periode_piket,id',
            'jadwal_piket' => 'nullable|exists:jadwal_piket,id',
        ]);
        
        // Process the base64 image
        $image = null;
        if (preg_match('/^data:image\/(\w+);base64,/', $request->foto)) {
            $image_data = substr($request->foto, strpos($request->foto, ',') + 1);
            $image_data = base64_decode($image_data);
            $filename = 'absensi/' . time() . '_' . Auth::id() . '.png';
            
            // Ensure directory exists
            Storage::disk('public')->makeDirectory('absensi');
            
            // Save the image
            Storage::disk('public')->put($filename, $image_data);
            $validated['foto'] = $filename;
        }
        
        // Create attendance record
        $absensi = Absensi::create([
            'tanggal' => now()->format('Y-m-d'),
            'jam_masuk' => $validated['jam_masuk'],
            'jam_keluar' => $validated['jam_keluar'],
            'foto' => $validated['foto'],
            'jadwal_piket' => $validated['jadwal_piket'],
            'kegiatan' => $validated['kegiatan'],
            'periode_piket_id' => $validated['periode_piket_id'],
        ]);
        
        return redirect('/piket/ambil-absen')->with('success', 'Absensi berhasil dicatat.');
    }

    /**
     * Show attendance history page (Riwayat Absen)
     */
    public function riwayatAbsen(Request $request)
    {
        $periodeId = $request->input('periode_id');
        $periode = null;
        $riwayatAbsensi = [];
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
        }
        
        if ($periode) {
            // Get attendance history
            $riwayatAbsensi = Absensi::with('jadwalPiket.user')
                ->where('periode_piket_id', $periode->id)
                ->orderBy('tanggal', 'desc')
                ->orderBy('jam_masuk', 'desc')
                ->get();
        }
                
        return Inertia::render('RiwayatAbsen', [
            'riwayatAbsensi' => $riwayatAbsensi,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
        ]);
    }
    
    /**
     * Show attendance recap page (Rekap Absen)
     */
    public function rekapAbsen(Request $request)
    {
        $periodeId = $request->input('periode_id');
        $periode = null;
        $rekapAbsensi = [];
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
        }
        
        if ($periode) {            
            // Get attendance summary by user
            $users = User::whereHas('jadwalPiket', function($query) use ($periode) {
                $query->where('periode_piket_id', $periode->id);
            })->get();
            
            foreach ($users as $user) {
                $totalJadwal = JadwalPiket::where('user_id', $user->id)
                    ->where('periode_piket_id', $periode->id)
                    ->count();
                    
                $hadir = Absensi::whereHas('jadwalPiket', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('periode_piket_id', $periode->id)
                ->count();
                
                $tidakHadir = max(0, $totalJadwal - $hadir);
                
                $rekapAbsensi[] = [
                    'user' => $user,
                    'total_jadwal' => $totalJadwal,
                    'hadir' => $hadir,
                    'tidak_hadir' => $tidakHadir,
                    'ganti' => 0, // This would need additional logic
                    'denda' => $tidakHadir * 5000, // Example calculation
                ];
            }
        }
        
        return Inertia::render('RekapAbsen', [
            'rekapAbsensi' => $rekapAbsensi,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
            'jadwalByDay' => $this->getJadwalByDay($periode ? $periode->id : null),
        ]);
    }
    
    /**
     * Export attendance summary
     */
    public function exportRekapAbsen(Request $request)
    {
        // Implementation for exporting attendance summary
        return back()->with('message', 'Fitur export akan segera tersedia.');
    }
    
    /**
     * Get schedule summary by day
     */
    private function getJadwalByDay($periodeId)
    {
        if (!$periodeId) return [];
        
        $jadwalByDay = [];
        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        
        foreach ($days as $day) {
            $petugas = JadwalPiket::with('user')
                ->where('periode_piket_id', $periodeId)
                ->where('hari', $day)
                ->get()
                ->map(function($jadwal) {
                    return [
                        'id' => $jadwal->user->id,
                        'name' => $jadwal->user->name,
                        'status' => $this->getUserAttendanceStatus($jadwal->id)
                    ];
                });
                
            $jadwalByDay[$day] = $petugas;
        }
        
        return $jadwalByDay;
    }
    
    /**
     * Get user's attendance status
     */
    private function getUserAttendanceStatus($jadwalId)
    {
        // Check if user has attended according to their schedule
        $absen = Absensi::where('jadwal_piket', $jadwalId)
            ->whereDate('tanggal', '>=', now()->startOfWeek())
            ->whereDate('tanggal', '<=', now()->endOfWeek())
            ->first();
            
        if ($absen) {
            return 'hadir';
        }
        
        // If day hasn't come yet, return 'pending'
        $jadwal = JadwalPiket::find($jadwalId);
        $dayMap = [
            'senin' => 1,
            'selasa' => 2,
            'rabu' => 3,
            'kamis' => 4,
            'jumat' => 5,
        ];
        
        $dayNumber = $dayMap[$jadwal->hari] ?? 0;
        $currentDay = now()->dayOfWeekIso;
        
        if ($dayNumber > $currentDay) {
            return 'pending';
        }
        
        return 'tidak hadir';
    }
}