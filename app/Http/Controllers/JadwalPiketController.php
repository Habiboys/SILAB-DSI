<?php

namespace App\Http\Controllers;

use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\KepengurusanLab;
use App\Models\User;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class JadwalPiketController extends Controller
{
    /**
     * Show attendance schedule page (Jadwal Piket)
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
        
        $kepengurusanLab = null;
        $users = collect();
        
        if ($lab_id && $tahun_id) {
            // Cari kepengurusan lab berdasarkan lab_id dan tahun_id
            $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();
        }
        
        if (!$kepengurusanLab) {
            return Inertia::render('JadwalPiket', [
                'message' => 'Silakan pilih laboratorium dan tahun kepengurusan untuk melihat jadwal piket.',
                'jadwalPiket' => [],
                'kepengurusanLab' => null,
                'tahunKepengurusan' => $tahunKepengurusan,
                'laboratorium' => $laboratorium,
                'users' => [],
                'filters' => [
                    'lab_id' => $lab_id,
                    'tahun_id' => $tahun_id,
                ]
            ]);
        }
    
        // Move users query here, after we confirm kepengurusanLab exists
        $users = User::whereHas('struktur', function ($query) use ($kepengurusanLab) {
            $query->where('tipe_jabatan', 'asisten')
                  ->where('kepengurusan_lab_id', $kepengurusanLab->id);
        })->get();
    
        // Get daily schedule for the specific kepengurusan (lab and year)
        $jadwalPiket = JadwalPiket::with(['user.profile'])
            ->where('kepengurusan_lab_id', $kepengurusanLab->id)
            ->get();
        
        // Group by day
        $groupedJadwal = $jadwalPiket->groupBy('hari');
        
        // Available days
        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        
        // Ensure all days are present in the response
        foreach ($days as $day) {
            if (!isset($groupedJadwal[$day])) {
                $groupedJadwal[$day] = collect([]);
            }
        }
        
        // Convert to array with additional jadwalId field for frontend
        $formattedJadwal = [];
        foreach ($groupedJadwal as $day => $jadwals) {
            $formattedJadwal[$day] = $jadwals->map(function($jadwal) {
                return [
                    'id' => $jadwal->user->id,
                    'name' => $jadwal->user->name,
                    'jadwalId' => $jadwal->id,
                    'profile' => $jadwal->user->profile
                ];
            });
        }
        
        // Get eligible users who have a position (struktur) in this specific kepengurusan (lab+year)
        // Only these users should be selectable for the schedule
        $users = User::whereHas('profile')
            ->whereHas('struktur', function($query) use ($kepengurusanLab) {
                $query->where('kepengurusan_lab_id', $kepengurusanLab->id)
                      ->where('tipe_jabatan', 'asisten'); // Add filter for assistants only
            })
            ->with('profile')
            ->get();
        
        // Log for debugging
        Log::info('Filtered users for jadwal piket', [
            'lab_id' => $lab_id,
            'tahun_id' => $tahun_id,
            'kepengurusan_id' => $kepengurusanLab->id,
            'user_count' => $users->count(),
            'user_ids' => $users->pluck('id')
        ]);
        
        return Inertia::render('JadwalPiket', [
            'jadwalPiket' => $formattedJadwal,
            'kepengurusanLab' => $kepengurusanLab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'users' => $users,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ]
        ]);
    }
    
    /**
     * Store new schedule
     */
    // In store method
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'hari' => 'required|in:senin,selasa,rabu,kamis,jumat',
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            ]);
            
            // Verify user is an assistant in this kepengurusan_lab
            $user = User::whereHas('struktur', function($query) use ($validated) {
                $query->where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
                      ->where('tipe_jabatan', 'asisten');
            })->find($validated['user_id']);
    
            if (!$user) {
                return back()->with('error', 'Hanya asisten yang dapat ditambahkan ke jadwal piket.');
            }
            
            // Check if user already has a schedule for this day and kepengurusan
            $existing = JadwalPiket::where('user_id', $validated['user_id'])
                ->where('hari', $validated['hari'])
                ->where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
                ->first();
                
            if ($existing) {
                return back()->with('error', 'User sudah memiliki jadwal pada hari yang sama.');
            }
            
            // Verify user belongs to this kepengurusan_lab
            $user = User::with('struktur')->find($validated['user_id']);
            if (!$user || !$user->struktur || $user->struktur->kepengurusan_lab_id != $validated['kepengurusan_lab_id']) {
                return back()->with('error', 'User tidak terdaftar dalam kepengurusan lab yang dipilih.');
            }
            
            JadwalPiket::create($validated);
            
            return redirect()->route('piket.jadwal.index', [
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id'),
            ])->with('success', 'Jadwal piket berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Error creating jadwal piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan jadwal piket: ' . $e->getMessage());
        }
    }
    
    /**
     * Update schedule
     */
    public function update(Request $request, $id)
    {
        try {
            // Log request information
            Log::info('Update request received for jadwal piket', [
                'id' => $id,
                'request_data' => $request->all()
            ]);
            
            // Find the jadwal piket record
            $jadwalPiket = JadwalPiket::findOrFail($id);
            
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'hari' => 'required|in:senin,selasa,rabu,kamis,jumat',
            ]);
            
            // Check if user already has a schedule for this day and kepengurusan (except this one)
            $existing = JadwalPiket::where('user_id', $validated['user_id'])
                ->where('hari', $validated['hari'])
                ->where('kepengurusan_lab_id', $jadwalPiket->kepengurusan_lab_id)
                ->where('id', '!=', $jadwalPiket->id)
                ->first();
                
            if ($existing) {
                return response()->json(['message' => 'User sudah memiliki jadwal pada hari yang sama.'], 422);
            }
            
            // Verify user belongs to this kepengurusan_lab
            $user = User::with('struktur')->find($validated['user_id']);
            if (!$user || !$user->struktur || $user->struktur->kepengurusan_lab_id != $jadwalPiket->kepengurusan_lab_id) {
                return response()->json(['message' => 'User tidak terdaftar dalam kepengurusan lab yang dipilih.'], 422);
            }
            
            $jadwalPiket->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Jadwal piket berhasil diperbarui.',
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating jadwal piket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jadwal piket: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete schedule
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Log request information
            Log::info('Delete request received for jadwal piket', [
                'id' => $id,
                'request_data' => $request->all()
            ]);
            
            // Find the jadwal piket record
            $jadwalPiket = JadwalPiket::findOrFail($id);
            
            // Check if schedule has attendance records
            $hasAbsensi = $jadwalPiket->absensi()->exists();
            
            if ($hasAbsensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus jadwal yang memiliki data absensi.'
                ], 422);
            }
            
            $jadwalPiket->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Jadwal piket berhasil dihapus.',
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting jadwal piket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jadwal piket: ' . $e->getMessage()
            ], 500);
        }
    }
}