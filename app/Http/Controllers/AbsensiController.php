<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $periodePiket = PeriodePiket::where('isactive', true)->first();
        
        if (!$periodePiket) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Tidak ada periode piket aktif saat ini.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
            ]);
        }
        
        $jadwalPiket = JadwalPiket::where('user_id', $user->id)
            ->where('periode_piket_id', $periodePiket->id)
            ->where('hari', strtolower(now()->locale('id')->dayName))
            ->first();
            
        $alreadySubmitted = false;
        if ($jadwalPiket) {
            $alreadySubmitted = Absensi::where('jadwal_piket', $jadwalPiket->id)
                ->whereDate('tanggal', now()->toDateString())
                ->exists();
        }
        
        return Inertia::render('AmbilAbsen', [
            'jadwal' => $jadwalPiket,
            'periode' => $periodePiket,
            'today' => now()->format('Y-m-d'),
            'alreadySubmitted' => $alreadySubmitted,
        ]);
    }
    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'jam_masuk' => 'required',
                'jam_keluar' => 'nullable',
                'foto' => 'required|string',
                'kegiatan' => 'required|string',
                'periode_piket_id' => 'required|exists:periode_piket,id',
                'jadwal_piket' => 'nullable|exists:jadwal_piket,id',
            ]);
            
            $user = Auth::user();
            
            if (empty($validated['jadwal_piket'])) {
                $jadwalPiket = JadwalPiket::where('user_id', $user->id)
                    ->where('periode_piket_id', $validated['periode_piket_id'])
                    ->where('hari', strtolower(now()->locale('id')->dayName))
                    ->first();
                
                if (!$jadwalPiket) {
                    return redirect()->back()->with('error', 'Anda tidak memiliki jadwal piket untuk hari ini.');
                }
                
                $validated['jadwal_piket'] = $jadwalPiket->id;
            }
            
            $alreadySubmitted = Absensi::where('jadwal_piket', $validated['jadwal_piket'])
                ->whereDate('tanggal', now()->toDateString())
                ->exists();
                
            if ($alreadySubmitted) {
                return redirect()->back()->with('error', 'Anda sudah mengisi absensi untuk hari ini.');
            }
            
            if (preg_match('/^data:image\/(\w+);base64,/', $request->foto)) {
                $image_data = substr($request->foto, strpos($request->foto, ',') + 1);
                $image_data = base64_decode($image_data);
                
                if ($image_data === false) {
                    return redirect()->back()->with('error', 'Format gambar tidak valid.');
                }
                
                $filename = 'absensi/' . time() . '_' . Auth::id() . '.png';
                
                Storage::disk('public')->makeDirectory('absensi');
                
                $saved = Storage::disk('public')->put($filename, $image_data);
                
                if (!$saved) {
                    return redirect()->back()->with('error', 'Gagal menyimpan foto.');
                }
                
                $validated['foto'] = $filename;
            } else {
                return redirect()->back()->with('error', 'Format foto tidak valid.');
            }
            
            $absensi = Absensi::create([
                'tanggal' => now()->format('Y-m-d'),
                'jam_masuk' => $validated['jam_masuk'],
                'jam_keluar' => $validated['jam_keluar'],
                'foto' => $validated['foto'],
                'jadwal_piket' => $validated['jadwal_piket'],
                'kegiatan' => $validated['kegiatan'],
                'periode_piket_id' => $validated['periode_piket_id'],
            ]);
            
            return redirect()->route('piket.ambil-absen')->with('success', 'Absensi berhasil dicatat.');
        } catch (\Exception $e) {
            Log::error('Error in storeAbsen: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan absensi: ' . $e->getMessage());
        }
    }

    public function show(Request $request)
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
            $query = Absensi::with(['jadwalPiket.user', 'periodePiket'])
                ->where('periode_piket_id', $periode->id);
                
            $userJadwalIds = JadwalPiket::where('user_id', Auth::id())->pluck('id');
            $query->whereIn('jadwal_piket', $userJadwalIds);
            
            $riwayatAbsensi = $query->orderBy('tanggal', 'desc')
                ->orderBy('jam_masuk', 'desc')
                ->get();
                
            $riwayatAbsensi = $riwayatAbsensi->map(function($item) {
                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal,
                    'jam_masuk' => $item->jam_masuk,
                    'jam_keluar' => $item->jam_keluar,
                    'kegiatan' => $item->kegiatan,
                    'foto' => $item->foto ? Storage::url($item->foto) : null,
                    'user' => $item->jadwalPiket->user ?? null,
                    'periode' => $item->periodePiket ? $item->periodePiket->nama : null,
                ];
            });
        }
                
        return Inertia::render('RiwayatAbsen', [
            'riwayatAbsensi' => $riwayatAbsensi,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
            'isAdmin' => false,
        ]);
    }
    
    public function rekapAbsen(Request $request)
    {
        $periodeId = $request->input('periode_id');
        $periode = null;
        $jadwalByDay = [];
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
        }
        
        if ($periode) {
            $jadwalByDay = $this->getJadwalByDay($periode->id);
            
            foreach ($jadwalByDay as $day => $jadwals) {
                foreach ($jadwals as $key => $jadwal) {
                    $attendance = $this->getUserAttendanceStatus($jadwal->id);
                    $jadwalByDay[$day][$key]->attendance = $attendance;
                }
            }
        }
        
        return Inertia::render('RekapAbsen', [
            'jadwalByDay' => $jadwalByDay,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
        ]);
    }
    
    public function exportRekapAbsen(Request $request)
    {
        $periodeId = $request->input('periode_id');
        
        if (!$periodeId) {
            $periodePiket = PeriodePiket::where('isactive', true)->first();
            if ($periodePiket) {
                $periodeId = $periodePiket->id;
            }
        }
    }
    
    private function getJadwalByDay($periodeId)
    {
        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        $jadwalByDay = [];
        
        foreach ($days as $day) {
            $jadwals = JadwalPiket::with('user')
                ->where('periode_piket_id', $periodeId)
                ->where('hari', $day)
                ->get();
                
            $jadwalByDay[$day] = $jadwals;
        }
        
        return $jadwalByDay;
    }
    
    private function getUserAttendanceStatus($jadwalId)
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        
        $attendanceRecords = Absensi::where('jadwal_piket', $jadwalId)
            ->whereBetween('tanggal', [$startOfWeek, $endOfWeek])
            ->orderBy('tanggal')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal,
                    'hari' => $item->tanggal->format('l'),
                    'jam_masuk' => $item->jam_masuk,
                    'jam_keluar' => $item->jam_keluar,
                    'foto' => $item->foto ? Storage::url($item->foto) : null,
                ];
            });
            
        return $attendanceRecords;
    }
}
