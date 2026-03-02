<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\User;
use App\Models\Struktur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    // Note: Authorization handled via route middleware

    public function index()
    {
        $user = Auth::user();

        // First get the user's lab
        $userLab = $user->getCurrentLab();

        // Add detailed logging for debugging
        Log::info('User lab information', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_lab' => $userLab,
            'struktur_id' => $user->struktur_id, // Log the user's struktur_id
            'roles' => $user->roles->pluck('name')
        ]);

        if (!$userLab || !isset($userLab['kepengurusan_lab_id'])) {
            // Add more debugging here to understand why user is not associated with a lab
            Log::warning('User not associated with a lab', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'struktur_id' => $user->struktur_id,
                'user_lab_data' => $userLab
            ]);

            // Try to get kepengurusan_lab_id from kepengurusan_user table as fallback
            $kepengurusanUser = \App\Models\KepengurusanUser::where('user_id', $user->id)
                ->where('is_active', true)
                ->with(['kepengurusanLab.laboratorium'])
                ->first();

            if ($kepengurusanUser) {
                $kepengurusanLabId = $kepengurusanUser->kepengurusan_lab_id;

                Log::info('Retrieved kepengurusan_lab_id from kepengurusan_user fallback', [
                    'kepengurusan_lab_id' => $kepengurusanLabId,
                    'lab_name' => $kepengurusanUser->kepengurusanLab->laboratorium->nama ?? 'Unknown'
                ]);

                // Continue with this kepengurusan_lab_id
                goto check_active_period;
            }

            return Inertia::render('AmbilAbsen', [
                'message' => 'Anda tidak terdaftar di laboratorium manapun. Silakan hubungi admin untuk mengatur posisi Anda di laboratorium.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false,
                'debug_info' => [
                    'user_id' => $user->id,
                    'struktur_id' => $user->struktur_id,
                    'roles' => $user->roles->pluck('name')->toArray()
                ]
            ]);
        }

        $kepengurusanLabId = $userLab['kepengurusan_lab_id'];

        // Override with session-selected kepengurusan if the user actually belongs to it.
        // This makes the piket page respect the navbar year dropdown (same as other controllers).
        $sessionKepLabId = session('active_kepengurusan_lab_id');
        if ($sessionKepLabId && $sessionKepLabId !== $kepengurusanLabId) {
            $userBelongs = \App\Models\KepengurusanUser::where('user_id', $user->id)
                ->where('kepengurusan_lab_id', $sessionKepLabId)
                ->where('is_active', true)
                ->exists();
            if ($userBelongs) {
                $kepengurusanLabId = $sessionKepLabId;
                Log::info('Overriding kepengurusan_lab_id from session', [
                    'session_id' => $sessionKepLabId,
                    'original_id' => $userLab['kepengurusan_lab_id'],
                ]);
            }
        }

        // Add a label for the goto target
        check_active_period:

        // Get active period for this specific lab
        $periodePiket = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $kepengurusanLabId)
            ->first();

        // Log the result of the active period query
        Log::info('Active period query for lab', [
            'kepengurusan_lab_id' => $kepengurusanLabId,
            'found_active_period' => $periodePiket ? true : false,
            'period_name' => $periodePiket ? $periodePiket->nama : null,
            'period_dates' => $periodePiket ? [
                'start' => $periodePiket->tanggal_mulai->format('Y-m-d'),
                'end' => $periodePiket->tanggal_selesai->format('Y-m-d')
            ] : null,
            'sql_query' => "SELECT * FROM periode_piket WHERE isactive = 1 AND kepengurusan_lab_id = $kepengurusanLabId"
        ]);

        // If no active period found, try to get any period that includes today's date
        if (!$periodePiket) {
            $today = now()->format('Y-m-d');

            // Try to find any period that includes today
            $periodePiket = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('tanggal_mulai', '<=', $today)
                ->where('tanggal_selesai', '>=', $today)
                ->orderBy('tanggal_mulai', 'desc')
                ->first();

            Log::info('Searched for period including today', [
                'today' => $today,
                'found_period' => $periodePiket ? true : false,
                'period_name' => $periodePiket ? $periodePiket->nama : null
            ]);

            if (!$periodePiket) {
                return Inertia::render('AmbilAbsen', [
                    'message' => 'Tidak ada periode piket aktif saat ini untuk laboratorium Anda.',
                    'jadwal' => null,
                    'periode' => null,
                    'today' => now()->format('Y-m-d'),
                    'alreadySubmitted' => false,
                    'debug_info' => [
                        'kepengurusan_lab_id' => $kepengurusanLabId,
                        'today' => $today
                    ]
                ]);
            }

            // If we found a period that includes today but it's not active, show appropriate message
            if (!$periodePiket->isactive) {
                return Inertia::render('AmbilAbsen', [
                    'message' => 'Periode piket untuk rentang tanggal ini belum diaktifkan. Silakan hubungi admin.',
                    'jadwal' => null,
                    'periode' => $periodePiket,
                    'today' => now()->format('Y-m-d'),
                    'alreadySubmitted' => false
                ]);
            }
        }

        // Check if we're within the date range of the active period
        $today = now()->startOfDay();
        $periodStart = $periodePiket->tanggal_mulai->startOfDay();
        $periodEnd = $periodePiket->tanggal_selesai->endOfDay();

        // Log date comparisons for debugging
        Log::info('Date comparison for period check', [
            'today' => $today->format('Y-m-d'),
            'period_start' => $periodStart->format('Y-m-d'),
            'period_end' => $periodEnd->format('Y-m-d'),
            'is_before_period' => $today->lt($periodStart),
            'is_after_period' => $today->gt($periodEnd),
            'is_in_period' => $today->gte($periodStart) && $today->lte($periodEnd)
        ]);

        if ($today->lt($periodStart) || $today->gt($periodEnd)) {
            $message = $today->lt($periodStart)
                ? 'Periode piket belum dimulai. Periode akan dimulai pada ' . $periodStart->format('d F Y')
                : 'Periode piket sudah berakhir. Periode berakhir pada ' . $periodEnd->format('d F Y');

            return Inertia::render('AmbilAbsen', [
                'message' => $message,
                'jadwal' => null,
                'periode' => $periodePiket,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false
            ]);
        }

        // Get current day name in Indonesian
        $hariIni = strtolower(now()->locale('id')->dayName);

        Log::info('User schedule check', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'current_day' => $hariIni,
        ]);

        // Find user's schedule for today, filtered by the correct kepengurusan period
        $jadwalPiket = JadwalPiket::where('user_id', $user->id)
            ->where('hari', $hariIni)
            ->where('kepengurusan_lab_id', $kepengurusanLabId)
            ->first();

        // Check if user has an approved schedule override for today
        $scheduleOverride = null;

        // First, check if there's an override that moves the user TO today
        $scheduleOverride = \App\Models\GantiJadwalPiket::where('user_id', $user->id)
            ->where('hari_baru', $hariIni)
            ->where('status', 'approved')
            ->where('periode_piket_id', $periodePiket->id)
            ->with(['jadwalPiket'])
            ->first();

        if ($scheduleOverride) {
            // Use the original schedule but mark it as overridden
            $jadwalPiket = $scheduleOverride->jadwalPiket;
            $jadwalPiket->is_override = true;
            $jadwalPiket->override_reason = $scheduleOverride->alasan;
            $jadwalPiket->original_day = $scheduleOverride->hari_lama;
            $jadwalPiket->override_day = $scheduleOverride->hari_baru;
        } else {
            // Check if there's an override that moves the user AWAY from today
            $scheduleOverrideAway = \App\Models\GantiJadwalPiket::where('user_id', $user->id)
                ->where('hari_lama', $hariIni)
                ->where('status', 'approved')
                ->where('periode_piket_id', $periodePiket->id)
                ->first();

            if ($scheduleOverrideAway) {
                // User has an override that moves them away from today
                // They should not be able to take attendance on their original day
                $jadwalPiket = null;
            }
        }

        // Add more detailed logging for schedule checking
        if (!$jadwalPiket) {
            // Try to find if the user has any schedule at all
            $allJadwal = JadwalPiket::where('user_id', $user->id)->get();

            Log::info('No schedule found for today, checking all schedules', [
                'user_id' => $user->id,
                'day' => $hariIni,
                'has_any_schedule' => $allJadwal->isNotEmpty(),
                'all_schedules' => $allJadwal->pluck('hari')->toArray(),
                'has_override' => $scheduleOverride ? true : false
            ]);
        } else {
            Log::info('Found schedule for today', [
                'schedule_id' => $jadwalPiket->id,
                'user_id' => $jadwalPiket->user_id,
                'day' => $jadwalPiket->hari,
                'is_override' => $jadwalPiket->is_override ?? false,
                'override_reason' => $jadwalPiket->override_reason ?? null
            ]);
        }

        $alreadySubmitted = false;
        $checkedIn = null;

        if ($jadwalPiket) {
            $todayAbsensi = Absensi::where('jadwal_piket', $jadwalPiket->id)
                ->where('periode_piket_id', $periodePiket->id)
                ->whereDate('tanggal', now()->toDateString())
                ->first();

            if ($todayAbsensi) {
                if ($todayAbsensi->jam_keluar !== null) {
                    // Fully checked out
                    $alreadySubmitted = true;
                } else {
                    // Checked in but not yet checked out
                    $checkedIn = [
                        'id'         => $todayAbsensi->id,
                        'jam_masuk'  => $todayAbsensi->jam_masuk,
                        'kegiatan'   => $todayAbsensi->kegiatan,
                        'tanggal'    => $todayAbsensi->tanggal->format('Y-m-d'),
                    ];
                }
            }

            Log::info('Attendance check (new flow)', [
                'already_submitted' => $alreadySubmitted,
                'checked_in' => !!$checkedIn,
                'user_id' => $user->id,
                'schedule_id' => $jadwalPiket->id,
                'period_id' => $periodePiket->id,
                'date' => now()->toDateString()
            ]);
        }

        return Inertia::render('AmbilAbsen', [
            'jadwal'          => $jadwalPiket,
            'periode'         => $periodePiket,
            'today'           => now()->format('Y-m-d'),
            'alreadySubmitted'=> $alreadySubmitted,
            'checkedIn'       => $checkedIn,
        ]);
    }

    public function store(Request $request)
    {
        try {
            Log::info('Received check-in data', [
                'kegiatan' => $request->kegiatan,
                'periode_piket_id' => $request->periode_piket_id,
            ]);

            $validated = $request->validate([
                'kegiatan'        => 'required|string',
                'periode_piket_id'=> 'required|exists:periode_piket,id',
                'jadwal_piket'    => 'nullable|exists:jadwal_piket,id',
                'foto_checkin'    => 'required|string',
            ]);

            $user = Auth::user();

            if (empty($validated['jadwal_piket'])) {
                $hariIni = strtolower(now()->locale('id')->dayName);
                $jadwalPiket = JadwalPiket::where('user_id', $user->id)
                    ->where('hari', $hariIni)
                    ->first();

                // Check for approved schedule override for today
                if (!$jadwalPiket) {
                    $scheduleOverride = \App\Models\GantiJadwalPiket::where('user_id', $user->id)
                        ->where('hari_baru', $hariIni)
                        ->where('status', 'approved')
                        ->where('periode_piket_id', $validated['periode_piket_id'])
                        ->with(['jadwalPiket'])
                        ->first();

                    if ($scheduleOverride) {
                        $jadwalPiket = $scheduleOverride->jadwalPiket;
                    }
                } else {
                    // Check if there's an override that moves the user AWAY from today
                    $scheduleOverrideAway = \App\Models\GantiJadwalPiket::where('user_id', $user->id)
                        ->where('hari_lama', $hariIni)
                        ->where('status', 'approved')
                        ->where('periode_piket_id', $validated['periode_piket_id'])
                        ->first();

                    if ($scheduleOverrideAway) {
                        $jadwalPiket = null;
                    }
                }

                if (!$jadwalPiket) {
                    return redirect()->back()->with('error', 'Anda tidak memiliki jadwal piket untuk hari ini.');
                }

                $validated['jadwal_piket'] = $jadwalPiket->id;
            }

            // Check if already checked in or checked out today
            $existing = Absensi::where('jadwal_piket', $validated['jadwal_piket'])
                ->whereDate('tanggal', now()->toDateString())
                ->first();

            if ($existing) {
                if ($existing->jam_keluar !== null) {
                    return redirect()->back()->with('error', 'Anda sudah menyelesaikan absensi (checkout) untuk hari ini.');
                }
                return redirect()->back()->with('error', 'Anda sudah melakukan check-in. Silakan lakukan checkout setelah piket selesai.');
            }

            // Process check-in photo
            if (!preg_match('/^data:image\/(\w+);base64,/', $validated['foto_checkin'])) {
                return redirect()->back()->with('error', 'Format foto check-in tidak valid.');
            }

            $checkinImageData = base64_decode(substr($validated['foto_checkin'], strpos($validated['foto_checkin'], ',') + 1));
            if ($checkinImageData === false) {
                return redirect()->back()->with('error', 'Gagal memproses foto check-in.');
            }

            if (!Storage::disk('public')->exists('absensi')) {
                Storage::disk('public')->makeDirectory('absensi');
            }

            $checkinFilename = 'absensi/checkin_' . time() . '_' . $user->id . '.jpg';
            if (!Storage::disk('public')->put($checkinFilename, $checkinImageData)) {
                return redirect()->back()->with('error', 'Gagal menyimpan foto check-in.');
            }

            // Create check-in record
            $absensi = Absensi::create([
                'tanggal'         => now()->format('Y-m-d'),
                'jam_masuk'       => now()->format('H:i:s'),
                'jam_keluar'      => null,
                'foto'            => null,
                'foto_checkin'    => $checkinFilename,
                'jadwal_piket'    => $validated['jadwal_piket'],
                'kegiatan'        => $validated['kegiatan'],
                'periode_piket_id'=> $validated['periode_piket_id'],
            ]);

            Log::info('Check-in recorded', ['absensi_id' => $absensi->id, 'user_id' => $user->id]);
            return redirect()->route('piket.absensi.index')->with('success', 'Check-in berhasil! Jangan lupa checkout setelah piket selesai (min. 2 jam).');
        } catch (\Exception $e) {
            Log::error('Error in store (check-in): ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function checkout(Request $request)
    {
        try {
            Log::info('Received checkout data', [
                'absensi_id' => $request->absensi_id,
                'has_foto'   => !empty($request->foto),
            ]);

            $validated = $request->validate([
                'absensi_id' => 'required|exists:absensi,id',
                'foto'       => 'required|string',
                'kegiatan'   => 'required|string',
            ]);

            $user = Auth::user();
            $absensi = Absensi::findOrFail($validated['absensi_id']);

            // Check ownership via jadwal_piket
            $jadwalPiket = JadwalPiket::find($absensi->jadwal_piket);
            if (!$jadwalPiket || $jadwalPiket->user_id !== $user->id) {
                return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk checkout ini.');
            }

            // Must be today's record
            if ($absensi->tanggal->toDateString() !== now()->toDateString()) {
                return redirect()->back()->with('error', 'Absensi ini bukan untuk hari ini.');
            }

            // Must not be already checked out
            if ($absensi->jam_keluar !== null) {
                return redirect()->back()->with('error', 'Anda sudah melakukan checkout.');
            }

            // Validate minimum 2 hours duration
            $jamMasuk = \Carbon\Carbon::parse(now()->toDateString() . ' ' . $absensi->jam_masuk);
            $jamKeluar = now();
            $durasiMenit = (int) $jamMasuk->diffInMinutes($jamKeluar);

            if ($durasiMenit < 120) {
                $sisaMenit = 120 - $durasiMenit;
                $sisaJam   = intdiv($sisaMenit, 60);
                $sisaMin   = $sisaMenit % 60;
                $msg = "Minimal durasi piket adalah 2 jam. Masih kurang {$sisaJam} jam {$sisaMin} menit lagi.";
                return redirect()->back()->with('error', $msg);
            }

            // Process photo
            if (!preg_match('/^data:image\/(\w+);base64,/', $validated['foto'])) {
                return redirect()->back()->with('error', 'Format foto tidak valid.');
            }

            $image_data = base64_decode(substr($validated['foto'], strpos($validated['foto'], ',') + 1));
            if ($image_data === false) {
                return redirect()->back()->with('error', 'Gagal memproses foto.');
            }

            if (!Storage::disk('public')->exists('absensi')) {
                Storage::disk('public')->makeDirectory('absensi');
            }

            $filename = 'absensi/checkout_' . time() . '_' . $user->id . '.jpg';
            if (!Storage::disk('public')->put($filename, $image_data)) {
                return redirect()->back()->with('error', 'Gagal menyimpan foto.');
            }

            // Update record with checkout info
            $absensi->jam_keluar = $jamKeluar->format('H:i:s');
            $absensi->foto       = $filename;
            $absensi->kegiatan   = $validated['kegiatan'];
            $absensi->save();

            Log::info('Checkout recorded', [
                'absensi_id'   => $absensi->id,
                'user_id'      => $user->id,
                'durasi_menit' => $durasiMenit,
            ]);

            return redirect()->route('piket.absensi.index')->with('success', 'Checkout berhasil! Durasi piket: ' . intdiv($durasiMenit, 60) . ' jam ' . ($durasiMenit % 60) . ' menit.');
        } catch (\Exception $e) {
            Log::error('Error in checkout: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat checkout: ' . $e->getMessage());
        }
    }

    public function show(Request $request)
    {
        $user = Auth::user();
        $periodeId = $request->input('periode_id');

        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $periode = null;
        $riwayatAbsensi = [];

        // Debug log request data
        Log::info('Request data for riwayat absen:', [
            'all_params' => $request->all(),
            'kepengurusan_lab_id' => $kepengurusan_lab_id,
            'periode_id' => $periodeId,
            'lab_id' => $lab_id,
            'tahun_id' => $tahun_id,
            'url' => $request->fullUrl(),
            'user_roles' => $user->roles->pluck('name')
        ]);

        // Check user roles to determine access level
        $isSuperAdmin = $user->hasRole(['superadmin', 'kadep']);
        $isAdmin = $user->hasRole('admin');

        // Get kepengurusan_lab_id - prefer direct ID, fallback to lab_id + tahun_id lookup
        $kepengurusanLabId = null;

        if ($kepengurusan_lab_id) {
            // Direct kepengurusan_lab_id provided
            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $kepengurusanLabId = $kepengurusanLab->id;
                $lab_id = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        } else {
            // Fallback: Get active year if not provided
            $tahun_id = $tahun_id ?: \App\Models\TahunKepengurusan::where('isactive', true)->value('id');

            // Get user's lab if not superadmin
            if (!$isSuperAdmin && $userLab = $user->getCurrentLab()) {
                $lab_id = $userLab['laboratorium']->id ?? $lab_id;
            }

            // Lookup kepengurusan_lab_id
            if ($lab_id && $tahun_id) {
                $kepengurusanLabId = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->value('id');
            }
        }

        // Base response data
        $responseData = [
            'riwayatAbsensi' => [],
            'periode' => null,
            'periodes' => collect([]),
            'isAdmin' => $isAdmin || $isSuperAdmin,
            'isSuperAdmin' => $isSuperAdmin,
            'tahunKepengurusan' => \App\Models\TahunKepengurusan::orderBy('tahun', 'desc')->get(),
            'laboratorium' => \App\Models\Laboratorium::all(),
            'currentTahunId' => $tahun_id,
        ];

        // If no kepengurusan found, return empty response
        if (!$kepengurusanLabId) {
            return Inertia::render('RiwayatAbsen', $responseData);
        }

        // Get periods for the kepengurusan
        $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->orderBy('tanggal_mulai', 'desc');

        // For regular users, filter periods where they have attendance
        if (!$isSuperAdmin && !$isAdmin) {
            $userJadwalPiketIds = JadwalPiket::where('user_id', $user->id)->pluck('id');
            if ($userJadwalPiketIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }

            $periodIds = Absensi::whereIn('jadwal_piket', $userJadwalPiketIds)
                ->distinct()
                ->pluck('periode_piket_id');

            if ($periodIds->isNotEmpty()) {
                $periodes->whereIn('id', $periodIds);
            }
        }

        $periodes = $periodes->get();
        $responseData['periodes'] = $periodes;

        // Get active or selected period
        $periode = null;
        if ($periodeId) {
            $periode = $periodes->where('id', $periodeId)->first();
        }
        if (!$periode) {
            $periode = $periodes->where('isactive', true)->first();
        }
        if (!$periode) {
            return Inertia::render('RiwayatAbsen', $responseData);
        }

        $responseData['periode'] = $periode;

        // Build attendance query
        $query = Absensi::with(['jadwalPiket.user', 'periodePiket'])
            ->where('periode_piket_id', $periode->id);

        // Filter by user access
        if (!$isSuperAdmin && !$isAdmin) {
            $userJadwalPiketIds = JadwalPiket::where('user_id', $user->id)->pluck('id');
            if ($userJadwalPiketIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }
            $query->whereIn('jadwal_piket', $userJadwalPiketIds);
        } else {
            $kepengurusanUserIds = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('is_active', true)
                ->pluck('user_id');
            if ($kepengurusanUserIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }

            $jadwalPiketIds = JadwalPiket::whereIn('user_id', $kepengurusanUserIds)->pluck('id');
            if ($jadwalPiketIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }

            $query->whereIn('jadwal_piket', $jadwalPiketIds);
        }

        // Get and map attendance records
        $absensiRecords = $query->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'desc')
            ->get();

        $responseData['riwayatAbsensi'] = $absensiRecords->map(function($item) {
            try {
                $fotoUrl = null;
                if ($item->foto) {
                    if (Storage::disk('public')->exists($item->foto)) {
                        $fotoUrl = Storage::url($item->foto);
                    } elseif (file_exists(public_path('storage/' . $item->foto))) {
                        $fotoUrl = asset('storage/' . $item->foto);
                    } else {
                        // Fallback: generate URL anyway (trust the path is valid)
                        $fotoUrl = asset('storage/' . $item->foto);
                    }
                }

                $fotoCheckinUrl = null;
                if ($item->foto_checkin) {
                    if (Storage::disk('public')->exists($item->foto_checkin)) {
                        $fotoCheckinUrl = Storage::url($item->foto_checkin);
                    } elseif (file_exists(public_path('storage/' . $item->foto_checkin))) {
                        $fotoCheckinUrl = asset('storage/' . $item->foto_checkin);
                    } else {
                        // Fallback: generate URL anyway (trust the path is valid)
                        $fotoCheckinUrl = asset('storage/' . $item->foto_checkin);
                    }
                }

                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal,
                    'jam_masuk' => $item->jam_masuk,
                    'jam_keluar' => $item->jam_keluar,
                    'kegiatan' => $item->kegiatan,
                    'foto' => $fotoUrl,
                    'foto_checkin' => $fotoCheckinUrl,
                    'user' => $item->jadwalPiket->user ?? null,
                    'periode' => $item->periodePiket ? $item->periodePiket->nama : null,
                ];
            } catch (\Exception $e) {
                Log::error('Error mapping absensi record:', [
                    'error' => $e->getMessage(),
                    'record_id' => $item->id
                ]);
                return null;
            }
        })->filter()->values();

        return Inertia::render('RiwayatAbsen', $responseData);
    }

    public function rekapAbsen(Request $request)
    {
        $user = Auth::user();

        // Cek akses hanya sekali, jika tidak punya salah satu role, tolak
        if (!$user->hasRole(['superadmin', 'kadep', 'admin', 'kalab'])) {
            abort(403, 'Unauthorized access. You do not have permission to view this page.');
        }

        $periodeId = $request->input('periode_id');

        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $periode = null;
        $rekapAbsensi = [];
        $jadwalByDay = [];

        // Debug log request data
        Log::info('RekapAbsen request received', [
            'params' => $request->all(),
            'user_id' => Auth::id(),
            'url' => $request->fullUrl(),
            'user_roles' => $user->roles->pluck('name')
        ]);

        // Get kepengurusan_lab_id - prefer direct ID, fallback to lab_id + tahun_id lookup
        $kepengurusanLabId = null;

        if ($kepengurusan_lab_id) {
            // Direct kepengurusan_lab_id provided
            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $kepengurusanLabId = $kepengurusanLab->id;
                $lab_id = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        } else {
            // If no tahun_id is provided, use the active year
            if (!$tahun_id) {
                $aktiveTahun = \App\Models\TahunKepengurusan::where('isactive', true)->first();
                $tahun_id = $aktiveTahun ? $aktiveTahun->id : null;
                Log::info("Using active tahun: {$tahun_id}");
            }

            // For admin users, ensure they only see their lab's data
            if ($user->hasRole('admin') && !$user->hasRole(['superadmin', 'kadep'])) {
                $userLab = $user->getCurrentLab();
                if ($userLab && isset($userLab['laboratorium'])) {
                    $lab_id = $userLab['laboratorium']->id;
                    Log::info("Admin user's lab ID set to: {$lab_id}");
                }
            }

            // Lookup kepengurusan_lab_id
            if ($lab_id && $tahun_id) {
                $kepengurusanLab = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->first();

                if ($kepengurusanLab) {
                    $kepengurusanLabId = $kepengurusanLab->id;
                    Log::info("Found kepengurusan_lab_id: {$kepengurusanLabId} for lab_id: {$lab_id}");
                } else {
                    Log::warning("No kepengurusan_lab found for lab_id: {$lab_id} and tahun_id: {$tahun_id}");
                }
            }
        }

        // Initialize empty periodes array
        $periodes = collect([]);

        // Only get periods if we have a valid kepengurusan_lab_id
        if ($kepengurusanLabId) {
            // Get periods associated STRICTLY with this kepengurusan_lab_id
            $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->orderBy('tanggal_mulai', 'desc')
                ->get();

            Log::info('Found ' . $periodes->count() . ' periods for kepengurusan_lab_id: ' . $kepengurusanLabId);
        }

        // Get period by ID, but only if it belongs to the current kepengurusan_lab
        if ($periodeId && $kepengurusanLabId) {
            $periode = PeriodePiket::where('id', $periodeId)
                ->where('kepengurusan_lab_id', $kepengurusanLabId)
                ->first();

            if (!$periode) {
                Log::warning("Selected period {$periodeId} not found or does not belong to kepengurusan_lab {$kepengurusanLabId}");
            }
        }

        // If no valid period_id was provided or period not found, try to find an active one for this kepengurusan
        if (!$periode && $kepengurusanLabId) {
            $periode = PeriodePiket::where('isactive', true)
                ->where('kepengurusan_lab_id', $kepengurusanLabId)
                ->first();

            if ($periode) {
                Log::info('Using active period for kepengurusan:', ['id' => $periode->id, 'name' => $periode->nama]);
            } else {
                Log::info('No active period found for the selected lab and year');
            }
        }

        // Only process data if we have both a valid period and kepengurusan
        if ($periode && $kepengurusanLabId) {
            Log::info('Using periode: ' . $periode->id . ' (' . $periode->nama . ')');

            // Get jadwal piket for this kepengurusan_lab_id
            $jadwalByDay = $this->getJadwalByDay($periode->id, $kepengurusanLabId);

            // Calculate attendance summaries for each user
            $userAttendance = [];

            // Get users who belong to this kepengurusan
            $kepengurusanUserIds = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('is_active', true)
                ->pluck('user_id')
                ->toArray();

            if (!empty($kepengurusanUserIds)) {
                // Find users with these user IDs
                $users = User::whereIn('id', $kepengurusanUserIds)
                    ->whereHas('jadwalPiket')
                    ->get();

                Log::info('Found ' . $users->count() . ' users with jadwal piket for this kepengurusan');

                foreach ($users as $user) {
                    // Get user's jadwal piket IDs, filtered by this specific kepengurusan
                    $jadwalQuery = JadwalPiket::where('user_id', $user->id);

                    // Ensure we only count jadwal for users in this kepengurusan
                    $jadwalQuery->whereHas('user', function($q) use ($kepengurusanUserIds) {
                        $q->whereIn('id', $kepengurusanUserIds);
                    });

                    $userJadwalIds = $jadwalQuery->pluck('id')->toArray();

                    // Count total jadwal assignments
                    $totalJadwal = count($userJadwalIds);

                    // If user has no jadwal in this periode, skip them
                    if ($totalJadwal === 0) {
                        continue;
                    }

                    // Count attendance records for this period
                    $hadir = Absensi::whereIn('jadwal_piket', $userJadwalIds)
                        ->where('periode_piket_id', $periode->id)
                        ->count();

                    // Calculate tidak hadir (absences)
                    $tidakHadir = $totalJadwal - $hadir;
                    $tidakHadir = max(0, $tidakHadir); // Ensure it's not negative

                    // Placeholder for ganti (substitutions)
                    $ganti = 0;

                    // Calculate denda (penalty) - example calculation
                    $denda = $tidakHadir * 5000; // 5000 per absence

                    $userAttendance[] = [
                        'user' => $user,
                        'total_jadwal' => $totalJadwal,
                        'hadir' => $hadir,
                        'tidak_hadir' => $tidakHadir,
                        'ganti' => $ganti,
                        'denda' => $denda
                    ];
                }

                $rekapAbsensi = $userAttendance;
            }
        }

        // Log what we're returning to the view
        Log::info('Returning data to RekapAbsen view', [
            'rekap_count' => count($rekapAbsensi),
            'jadwal_days' => $jadwalByDay ? array_keys($jadwalByDay) : [],
            'has_periode' => !is_null($periode),
            'periode_count' => $periodes->count(),
        ]);

        return Inertia::render('RekapAbsen', [
            'rekapAbsensi' => $rekapAbsensi,
            'jadwalByDay' => $jadwalByDay,
            'periode' => $periode,
            'periodes' => $periodes, // Now properly filtered by kepengurusan_lab
            'tahunKepengurusan' => $this->getFilteredTahunKepengurusan($lab_id),
            'laboratorium' => \App\Models\Laboratorium::all(),
            'currentTahunId' => $tahun_id,
            'currentLabId' => $lab_id,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'message' => session('message')
            ]
        ]);
    }

    /**
     * Get jadwal piket grouped by day for a specific period and kepengurusan (optional)
     */
    private function getJadwalByDay($periodeId, $kepengurusanLabId = null)
    {
        // Debug log to check parameters
        Log::info('Getting jadwal by day', [
            'periode_id' => $periodeId,
            'kepengurusan_lab_id' => $kepengurusanLabId
        ]);

        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        $jadwalByDay = [];

        // Initialize jadwalByDay with empty arrays for each day
        foreach ($days as $day) {
            $jadwalByDay[$day] = [];
        }

        try {
            // Get the period data to determine date range
            $periode = PeriodePiket::find($periodeId);
            if (!$periode) {
                Log::error("Cannot find period with ID: {$periodeId}");
                return $jadwalByDay;
            }

            // Get current date for comparison
            $today = now()->startOfDay();
            $periodStart = $periode->tanggal_mulai->startOfDay();
            $periodEnd = $periode->tanggal_selesai->endOfDay();

            // Check if we're looking at the active period
            $isActivePeriod = $periode->isactive;

            // Map day names to day numbers (1 = Monday, 5 = Friday)
            $dayNumberMap = [
                'senin' => 1, 'selasa' => 2, 'rabu' => 3,
                'kamis' => 4, 'jumat' => 5
            ];

            // Current day of week (1-7)
            $currentDayOfWeek = now()->dayOfWeekIso;

            // Get approved schedule changes for this period
            $approvedChanges = \App\Models\GantiJadwalPiket::where('periode_piket_id', $periodeId)
                ->where('status', 'approved')
                ->with(['jadwalPiket.user', 'user'])
                ->get()
                ->keyBy('jadwal_piket_id');

            Log::info("Found {$approvedChanges->count()} approved schedule changes for period: {$periodeId}");

            // Query jadwal_piket table for each day
            foreach ($days as $day) {
                $jadwalsQuery = JadwalPiket::with('user')
                    ->where('hari', $day);

                // Filter by kepengurusan if needed
                if ($kepengurusanLabId) {
                    // Get user_ids in this kepengurusan
                    $kepengurusanUserIds = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->where('is_active', true)
                        ->pluck('user_id')
                        ->toArray();

                    if (!empty($kepengurusanUserIds)) {
                        $jadwalsQuery->whereHas('user', function($q) use ($kepengurusanUserIds) {
                            $q->whereIn('id', $kepengurusanUserIds);
                        });
                    }
                }

                $jadwals = $jadwalsQuery->get();

                Log::info("Found {$jadwals->count()} jadwal for day: {$day}");

                // Map to the format expected by the frontend
                $mappedJadwals = $jadwals->map(function($jadwal) use (
                    $periodeId,
                    $day,
                    $dayNumberMap,
                    $currentDayOfWeek,
                    $today,
                    $periodStart,
                    $periodEnd,
                    $isActivePeriod,
                    $approvedChanges
                ) {
                    // Check if this jadwal has an approved schedule change
                    $scheduleChange = $approvedChanges->get($jadwal->id);

                    // Check attendance for this jadwal in the selected periode
                    $attendance = Absensi::where('jadwal_piket', $jadwal->id)
                        ->where('periode_piket_id', $periodeId)
                        ->first();

                    // Determine status
                    $status = 'tidak hadir'; // Default status is "not attended"

                    if ($attendance) {
                        // If there's attendance record, mark as present
                        $status = 'hadir';
                    } else {
                        // Get the day number for this schedule
                        $dayNumber = $dayNumberMap[$day] ?? 0;

                        // Only use "pending" status if:
                        // 1. We're viewing the active period AND
                        // 2. The day hasn't come yet (it's in the future)

                        // For active period
                        if ($isActivePeriod) {
                            // First check if today is within the period
                            if ($today->gte($periodStart) && $today->lte($periodEnd)) {
                                // If the schedule day is later in the current week, mark as pending
                                if ($dayNumber > $currentDayOfWeek) {
                                    $status = 'pending';
                                }
                            }
                            // If today is before the period starts
                            else if ($today->lt($periodStart)) {
                                // All days are in the future, set all to pending
                                $status = 'pending';
                            }
                            // If today is after period ends, all days should be 'tidak hadir'
                            // (default status, no change needed)
                        }
                        // For non-active periods, everything in the past gets 'tidak hadir'
                        // (default status, no change needed)
                    }

                    // Prepare base data
                    $baseData = [
                        'id' => $jadwal->id,
                        'user_id' => $jadwal->user_id,
                        'name' => $jadwal->user ? $jadwal->user->name : 'Unknown',
                        'status' => $status,
                        'is_override' => false,
                        'original_day' => null,
                        'override_day' => null,
                        'override_reason' => null
                    ];

                    // If there's an approved schedule change, add override information
                    if ($scheduleChange) {
                        $baseData['is_override'] = true;
                        $baseData['original_day'] = $scheduleChange->hari_lama;
                        $baseData['override_day'] = $scheduleChange->hari_baru;
                        $baseData['override_reason'] = $scheduleChange->alasan;
                        $baseData['override_user'] = $scheduleChange->user ? $scheduleChange->user->name : 'Unknown';
                    }

                    return $baseData;
                })->toArray();

                $jadwalByDay[$day] = $mappedJadwals;
            }
        } catch (\Exception $e) {
            Log::error('Error getting jadwal by day: ' . $e->getMessage());
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
                    'foto_checkin' => $item->foto_checkin ? Storage::url($item->foto_checkin) : null,
                ];
            });

        return $attendanceRecords;
    }

    private function getFilteredTahunKepengurusan($lab_id)
    {
        if ($lab_id) {
            return \App\Models\TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        } else {
            return collect();
        }
    }
}
