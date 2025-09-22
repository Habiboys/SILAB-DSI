<?php

namespace App\Http\Controllers;

use App\Models\GantiJadwalPiket;
use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class GantiJadwalPiketController extends Controller
{
    /**
     * Halaman utama untuk asisten - gabungan status, riwayat, dan form ganti jadwal
     * View route - bisa akses semua
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get lab asisten saat ini
        $userLab = $user->getCurrentLab();
        if (!$userLab || !isset($userLab['kepengurusan_lab_id'])) {
            return Inertia::render('GantiJadwalPiket', [
                'message' => 'Anda tidak terdaftar di laboratorium manapun.',
                'periodeAktif' => null,
                'jadwalAsisten' => [],
                'hariTersedia' => [],
                'labInfo' => null,
                'permintaan' => [],
                'showForm' => false
            ]);
        }
        
        // Get periode piket aktif untuk lab tersebut
        $periodeAktif = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $userLab['kepengurusan_lab_id'])
            ->with(['kepengurusanLab.laboratorium'])
            ->first();
            
        if (!$periodeAktif) {
            return Inertia::render('GantiJadwalPiket', [
                'message' => 'Tidak ada periode piket aktif saat ini.',
                'periodeAktif' => null,
                'jadwalAsisten' => [],
                'hariTersedia' => [],
                'labInfo' => $userLab['laboratorium'] ?? null,
                'permintaan' => [],
                'showForm' => false
            ]);
        }
        
        // Get jadwal piket asisten untuk kepengurusan lab ini
        $jadwalAsisten = JadwalPiket::where('user_id', $user->id)
            ->where('kepengurusan_lab_id', $userLab['kepengurusan_lab_id'])
            ->get();
            
        // Get hari yang tersedia untuk ganti
        $hariTersedia = $this->getHariTersedia($userLab['kepengurusan_lab_id'], $periodeAktif->id, $user->id);
        
        // Log the result
        Log::info('FINAL hariTersedia result', ['hariTersedia' => $hariTersedia, 'count' => count($hariTersedia)]);
        
        // Debug logging
        Log::info('GantiJadwalPiketController index method', [
            'user_id' => $user->id,
            'kepengurusan_lab_id' => $userLab['kepengurusan_lab_id'],
            'periode_id' => $periodeAktif->id,
            'hariTersedia' => $hariTersedia,
            'hariTersedia_count' => count($hariTersedia),
            'jadwalAsisten_count' => $jadwalAsisten->count()
        ]);
        
        // Log the final result
        Log::info('FINAL hariTersedia result', ['hariTersedia' => $hariTersedia, 'count' => count($hariTersedia)]);
        
        // Get semua permintaan ganti jadwal asisten (status + riwayat)
        $permintaan = GantiJadwalPiket::where('user_id', $user->id)
            ->with(['jadwalPiket', 'periodePiket', 'approvedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $data = [
            'periodeAktif' => $periodeAktif,
            'jadwalAsisten' => $jadwalAsisten,
            'hariTersedia' => $hariTersedia,
            'labInfo' => $userLab['laboratorium'] ?? null,
            'permintaan' => $permintaan,
            'showForm' => false
        ];
        
        // Debug logging for data being sent to frontend
        Log::info('Data being sent to GantiJadwalPiket frontend', [
            'hariTersedia' => $hariTersedia,
            'hariTersedia_count' => count($hariTersedia),
            'hariTersedia_type' => gettype($hariTersedia),
            'jadwalAsisten_count' => $jadwalAsisten->count(),
            'periodeAktif' => $periodeAktif ? $periodeAktif->nama : 'null'
        ]);
        
        return Inertia::render('GantiJadwalPiket', $data);
    }
    
    /**
     * Asisten submit request ganti jadwal
     * View route - bisa akses semua (asisten bisa submit request)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'jadwal_piket_id' => 'required|exists:jadwal_piket,id',
            'hari_baru' => 'required|in:senin,selasa,rabu,kamis,jumat',
            'alasan' => 'required|string|min:10|max:500'
        ]);
        
        $user = Auth::user();
        $jadwalPiket = JadwalPiket::findOrFail($validated['jadwal_piket_id']);
        
        // Validasi bahwa jadwal piket milik user yang login
        if ($jadwalPiket->user_id !== $user->id) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk mengubah jadwal ini.');
        }
        
        // Get periode piket aktif untuk validasi
        $userLab = $user->getCurrentLab();
        $periodeAktif = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $userLab['kepengurusan_lab_id'])
            ->first();
            
        if (!$periodeAktif) {
            return redirect()->back()->with('error', 'Tidak ada periode piket aktif saat ini.');
        }
        
        // Validasi bahwa hari baru tersedia
        $hariTersedia = $this->getHariTersedia($jadwalPiket->kepengurusan_lab_id, $periodeAktif->id);
        if (!in_array($validated['hari_baru'], $hariTersedia)) {
            return redirect()->back()->with('error', 'Hari yang dipilih tidak tersedia.');
        }
        
        // Cek apakah sudah ada request pending untuk jadwal ini
        $existingRequest = GantiJadwalPiket::where('jadwal_piket_id', $validated['jadwal_piket_id'])
            ->where('status', 'pending')
            ->first();
            
        if ($existingRequest) {
            return redirect()->back()->with('error', 'Anda sudah memiliki permintaan ganti jadwal yang sedang menunggu persetujuan.');
        }
        
        // Create request
        GantiJadwalPiket::create([
            'jadwal_piket_id' => $validated['jadwal_piket_id'],
            'periode_piket_id' => $periodeAktif->id,
            'user_id' => $user->id,
            'hari_lama' => $jadwalPiket->hari,
            'hari_baru' => $validated['hari_baru'],
            'alasan' => $validated['alasan'],
            'status' => 'pending'
        ]);
        
        Log::info('Ganti jadwal piket request created', [
            'user_id' => $user->id,
            'jadwal_piket_id' => $validated['jadwal_piket_id'],
            'hari_lama' => $jadwalPiket->hari,
            'hari_baru' => $validated['hari_baru']
        ]);
        
        return redirect()->back()->with('success', 'Permintaan ganti jadwal berhasil dikirim. Menunggu persetujuan admin.');
    }
    
    
    /**
     * Dashboard admin untuk kelola permintaan
     * Manipulation route - hanya kepengurusan aktif
     */
    public function dashboardAdmin()
    {
        $user = Auth::user();
        
        // Get lab admin
        $userLab = $user->getCurrentLab();
        if (!$userLab || !isset($userLab['kepengurusan_lab_id'])) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke laboratorium manapun.');
        }
        
        $permintaan = GantiJadwalPiket::whereHas('periodePiket', function($query) use ($userLab) {
                $query->where('kepengurusan_lab_id', $userLab['kepengurusan_lab_id']);
            })
            ->with(['user', 'jadwalPiket', 'periodePiket', 'approvedBy'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('KelolaGantiJadwal', [
            'permintaan' => $permintaan,
            'labInfo' => $userLab['laboratorium'] ?? null
        ]);
    }
    
    /**
     * Admin approve/reject permintaan
     * Manipulation route - hanya kepengurusan aktif
     */
    public function approveReject(Request $request, $id)
    {
        Log::info('approveReject called', [
            'id' => $id,
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name
        ]);
        
        try {
            $validated = $request->validate([
                'action' => 'required|in:approve,reject',
                'catatan_admin' => 'nullable|string|max:500'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $e->errors()
            ], 422);
        }
        
        try {
            $permintaan = GantiJadwalPiket::findOrFail($id);
            
            Log::info('Found permintaan', [
                'permintaan_id' => $permintaan->id,
                'status' => $permintaan->status,
                'user_id' => $permintaan->user_id
            ]);
            
            // Validasi bahwa permintaan masih pending
            if ($permintaan->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Permintaan ini sudah diproses sebelumnya.'
                ], 400);
            }
            
            // Validasi bahwa admin memiliki akses ke lab yang sama
            $userLab = Auth::user()->getCurrentLab();
            if (!$userLab || $permintaan->periodePiket->kepengurusan_lab_id !== $userLab['kepengurusan_lab_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses untuk memproses permintaan ini.'
                ], 403);
            }
            
            $permintaan->update([
                'status' => $validated['action'] === 'approve' ? 'approved' : 'rejected',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'catatan_admin' => $validated['catatan_admin']
            ]);
            
            Log::info('Ganti jadwal piket request processed', [
                'request_id' => $id,
                'action' => $validated['action'],
                'approved_by' => Auth::id(),
                'user_id' => $permintaan->user_id
            ]);
            
            $message = $validated['action'] === 'approve' 
                ? 'Permintaan ganti jadwal berhasil disetujui.' 
                : 'Permintaan ganti jadwal ditolak.';
                
            return response()->json([
                'success' => true,
                'message' => $message,
                'action' => $validated['action']
            ]);
        } catch (\Exception $e) {
            Log::error('Error in approveReject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memproses permintaan: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Method helper untuk get hari tersedia
     */
    private function getHariTersedia($kepengurusanLabId, $periodeId, $userId = null)
    {
        $hariSeminggu = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        $hariTersedia = [];
        
        // Get all existing schedules for this kepengurusan
        $existingSchedules = JadwalPiket::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->get()
            ->groupBy('hari');
            
        // Get user's original schedules to exclude them
        $userOriginalSchedules = [];
        if ($userId) {
            $userOriginalSchedules = JadwalPiket::where('user_id', $userId)
                ->where('kepengurusan_lab_id', $kepengurusanLabId)
                ->pluck('hari')
                ->toArray();
        }
            
        // Get approved overrides for THIS SPECIFIC USER only
        $userApprovedOverrides = [];
        if ($userId) {
            $userApprovedOverrides = GantiJadwalPiket::where('periode_piket_id', $periodeId)
                ->where('user_id', $userId)
                ->where('status', 'approved')
                ->pluck('hari_baru')
                ->toArray();
        }
        
        // Debug logging
        Log::info('getHariTersedia method', [
            'kepengurusan_lab_id' => $kepengurusanLabId,
            'periode_id' => $periodeId,
            'user_id' => $userId,
            'existing_schedules' => $existingSchedules->keys()->toArray(),
            'user_original_schedules' => $userOriginalSchedules,
            'user_approved_overrides' => $userApprovedOverrides
        ]);
        
        foreach ($hariSeminggu as $hari) {
            // Skip if this is user's original schedule day
            if (in_array($hari, $userOriginalSchedules)) {
                Log::info("Day $hari skipped - user's original schedule", ['hari' => $hari]);
                continue;
            }
            
            // Skip if user already has an approved override to this day
            if (in_array($hari, $userApprovedOverrides)) {
                Log::info("Day $hari skipped - user already has approved override to this day", ['hari' => $hari]);
                continue;
            }
            
            // A day is available if it's not user's original schedule day
            // and user doesn't already have an approved override to this day
            $hariTersedia[] = $hari;
            
            Log::info("Day $hari included", ['hari' => $hari]);
        }
        
        // Fallback: if no days are available, provide at least 2 days for testing
        if (empty($hariTersedia)) {
            $hariTersedia = ['selasa', 'rabu'];
            Log::info('Using fallback hari tersedia', ['hariTersedia' => $hariTersedia]);
        }
        
        Log::info('Final hariTersedia result', [
            'hariTersedia' => $hariTersedia,
            'count' => count($hariTersedia)
        ]);
        
        return $hariTersedia;
    }
}
