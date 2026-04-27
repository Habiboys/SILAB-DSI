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
     * Note: This controller uses approve-ganti-jadwal gate for admin actions
     * Manual authorization checks in approveReject method
     */

    /**
     * Halaman utama untuk asisten - gabungan status, riwayat, dan form ganti jadwal
     * View route - bisa akses semua
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Prioritas: tahun kepengurusan dari URL/navbar (request atau session)
        $requestKepLabId = $request->input('kepengurusan_lab_id') ?? session('active_kepengurusan_lab_id');
        $userLab = $user->getCurrentLab();

        $kepLabId = null;
        $labInfo = null;

        if ($requestKepLabId) {
            // Pastikan user punya akses ke kepengurusan ini (anggota kepengurusan atau punya jadwal di situ)
            $userDalamKepengurusan = $user->kepengurusan()->where('kepengurusan_lab_id', $requestKepLabId)->exists();
            $userPunyaJadwalDiKep = JadwalPiket::where('user_id', $user->id)->where('kepengurusan_lab_id', $requestKepLabId)->exists();
            if ($userDalamKepengurusan || $userPunyaJadwalDiKep) {
                $kepLab = \App\Models\KepengurusanLab::with('laboratorium')->find($requestKepLabId);
                if ($kepLab) {
                    $kepLabId = $kepLab->id;
                    $labInfo = $kepLab->laboratorium;
                }
            }
        }

        if (!$kepLabId && $userLab && isset($userLab['kepengurusan_lab_id'])) {
            $kepLabId = $userLab['kepengurusan_lab_id'];
            $labInfo = $userLab['laboratorium'] ?? null;
        }

        if (!$kepLabId) {
            return Inertia::render('GantiJadwalPiket', [
                'message'      => 'Silakan pilih tahun kepengurusan di navbar, atau Anda tidak terdaftar di laboratorium.',
                'periodeAktif' => null,
                'jadwalAsisten'=> [],
                'hariTersedia' => [],
                'labInfo'      => $labInfo,
                'permintaan'   => [],
                'allPeriode'   => [],
                'filters'      => [],
                'showForm'     => false,
            ]);
        }

        // Get periode piket aktif untuk lab tersebut
        $periodeAktif = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $kepLabId)
            ->with(['kepengurusanLab.laboratorium'])
            ->first();

        // All periode for this kepengurusan (for filter dropdown)
        $allPeriode = PeriodePiket::where('kepengurusan_lab_id', $kepLabId)
            ->orderBy('tanggal_mulai', 'desc')
            ->get(['id', 'nama', 'tanggal_mulai', 'tanggal_selesai', 'isactive']);

        if (!$periodeAktif) {
            return Inertia::render('GantiJadwalPiket', [
                'message'      => 'Tidak ada periode piket aktif untuk tahun kepengurusan ini.',
                'periodeAktif' => null,
                'jadwalAsisten'=> [],
                'hariTersedia' => [],
                'labInfo'      => $labInfo,
                'permintaan'   => [],
                'allPeriode'   => $allPeriode,
                'filters'      => [],
                'showForm'     => false,
            ]);
        }

        // Get jadwal piket asisten untuk kepengurusan lab ini
        $jadwalAsisten = JadwalPiket::where('user_id', $user->id)
            ->where('kepengurusan_lab_id', $kepLabId)
            ->get();

        // Get hari yang tersedia untuk ganti
        $hariTersedia = $this->getHariTersedia($kepLabId, $periodeAktif->id, $user->id);

        // Filters
        $filterPeriodeId = $request->input('periode_piket_id');
        $perPage         = min((int) $request->input('perPage', 10), 100);

        // Get permintaan ganti jadwal asisten hanya untuk kepengurusan ini (tahun yang dipilih)
        $permintaanQuery = GantiJadwalPiket::where('user_id', $user->id)
            ->whereHas('jadwalPiket', fn ($q) => $q->where('kepengurusan_lab_id', $kepLabId))
            ->with(['jadwalPiket', 'periodePiket', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        if ($filterPeriodeId) {
            $permintaanQuery->where('periode_piket_id', $filterPeriodeId);
        }

        $permintaan = $permintaanQuery->paginate($perPage)->withQueryString();

        return Inertia::render('GantiJadwalPiket', [
            'periodeAktif'  => $periodeAktif,
            'jadwalAsisten' => $jadwalAsisten,
            'hariTersedia'  => $hariTersedia,
            'labInfo'       => $labInfo,
            'permintaan'    => $permintaan,
            'allPeriode'    => $allPeriode,
            'filters'       => [
                'periode_piket_id'   => $filterPeriodeId,
                'perPage'            => $perPage,
                'kepengurusan_lab_id' => $kepLabId,
            ],
            'showForm' => false,
        ]);
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
    public function dashboardAdmin(Request $request)
    {
        $user = Auth::user();

        // Get lab context
        $userLab = $user->getCurrentLab();

        $kepengurusanLabId = null;
        $labInfo = null;

        if (isset($userLab['all_access'])) {
            // Superadmin / Kadep: get kepengurusan_lab_id from request or session
            $kepengurusanLabId = $request->input('kepengurusan_lab_id')
                ?? session('active_kepengurusan_lab_id');

            if ($kepengurusanLabId) {
                $kepengurusanLab = \App\Models\KepengurusanLab::with('laboratorium')
                    ->find($kepengurusanLabId);
                $labInfo = $kepengurusanLab?->laboratorium;
            }
        } elseif (isset($userLab['kepengurusan_lab_id']) && $userLab['kepengurusan_lab_id']) {
            // Regular admin / asisten with active kepengurusan
            $kepengurusanLabId = $userLab['kepengurusan_lab_id'];
            $labInfo = $userLab['laboratorium'] ?? null;
        } elseif (isset($userLab['laboratorium'])) {
            // Admin with access_lab_id but no active kepengurusan
            $labInfo = $userLab['laboratorium'];
            $labId = is_object($labInfo) ? $labInfo->id : ($labInfo['id'] ?? null);
            if ($labId) {
                $kepLab = \App\Models\KepengurusanLab::where('laboratorium_id', $labId)
                    ->where('is_active', true)
                    ->first();
                $kepengurusanLabId = $kepLab?->id;
            }
            // Also try session fallback
            if (!$kepengurusanLabId) {
                $kepengurusanLabId = session('active_kepengurusan_lab_id');
            }
        } else {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses ke laboratorium manapun.');
        }

        $permintaanQuery = GantiJadwalPiket::with(['user', 'jadwalPiket', 'periodePiket', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        if ($kepengurusanLabId) {
            $permintaanQuery->whereHas('periodePiket', function ($query) use ($kepengurusanLabId) {
                $query->where('kepengurusan_lab_id', $kepengurusanLabId);
            });
        }

        return Inertia::render('KelolaGantiJadwal', [
            'permintaan' => $permintaanQuery->get(),
            'labInfo'    => $labInfo,
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
            $adminKepLabId = $userLab['kepengurusan_lab_id'] ?? null;

            // Fallback: resolve kepengurusan_lab_id for admin with access_lab_id
            if (!$adminKepLabId && isset($userLab['laboratorium'])) {
                $labId = is_object($userLab['laboratorium']) ? $userLab['laboratorium']->id : ($userLab['laboratorium']['id'] ?? null);
                if ($labId) {
                    $kepLab = \App\Models\KepengurusanLab::where('laboratorium_id', $labId)
                        ->where('is_active', true)
                        ->first();
                    $adminKepLabId = $kepLab?->id;
                }
            }

            // Also allow superadmin/kadep with all_access
            $hasAllAccess = isset($userLab['all_access']) && $userLab['all_access'];

            if (!$hasAllAccess && (!$adminKepLabId || $permintaan->periodePiket->kepengurusan_lab_id !== $adminKepLabId)) {
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
