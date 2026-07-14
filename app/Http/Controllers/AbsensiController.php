<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\DendaPiket;
use App\Models\JadwalPiket;
use App\Models\PeriodePiket;
use App\Models\User;
use App\Models\Struktur;
use App\Models\KepengurusanUser;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{

    private function resolveAttendanceKepengurusanLabId(User $user): ?string
    {
        $sessionKepLabId = session('active_kepengurusan_lab_id');
        if ($sessionKepLabId) {
            $belongs = KepengurusanUser::where('user_id', $user->id)
                ->where('kepengurusan_lab_id', $sessionKepLabId)
                ->where('is_active', true)
                ->exists();

            if ($belongs) {
                return (string) $sessionKepLabId;
            }
        }

        $activeIds = KepengurusanUser::where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('kepengurusan_lab_id')
            ->unique()
            ->values();

        if ($activeIds->count() === 1) {
            return (string) $activeIds->first();
        }

        if ($activeIds->count() > 1) {
            return null;
        }

        $currentLab = $user->getCurrentLab();
        if ($currentLab && !empty($currentLab['kepengurusan_lab_id'])) {
            return (string) $currentLab['kepengurusan_lab_id'];
        }

        return null;
    }

    private function ensureManualAbsensiAccess(User $user): void
    {
        $byRole = $user->hasRole(['superadmin', 'admin']);
        $byPermission = $user->hasAnyPermission(['absensi.manual.create', 'absensi.manual.update']);

        if (!$byRole && !$byPermission) {
            abort(403, 'Hanya admin/superadmin yang dapat menginput atau mengubah absensi manual.');
        }
    }

    private function ensureManualAbsensiDeleteAccess(User $user): void
    {
        $byRole = $user->hasRole('superadmin');
        $byPermission = $user->can('absensi.manual.delete');

        if (!$byRole && !$byPermission) {
            abort(403, 'Hanya superadmin yang dapat menghapus absensi manual.');
        }
    }

    private function ensureAbsensiVerifyAccess(User $user): void
    {
        $byRole = $user->hasRole(['superadmin', 'admin']);
        $byPermission = $user->can('absensi.verify');

        if (!$byRole && !$byPermission) {
            abort(403, 'Anda tidak memiliki akses verifikasi absensi.');
        }
    }

    public function storeManual(Request $request)
    {
        $user = Auth::user();
        $this->ensureManualAbsensiAccess($user);

        $validated = $request->validate([
            'kepengurusan_lab_id' => 'required|uuid|exists:kepengurusan_lab,id',
            'user_id' => 'required|uuid|exists:users,id',
            'tanggal' => 'required|date',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_keluar' => 'nullable|date_format:H:i',
            'kegiatan' => 'required|string|max:1000',
        ]);

        $isMember = KepengurusanUser::where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
            ->where('user_id', $validated['user_id'])
            ->where('is_active', true)
            ->exists();

        if (!$isMember) {
            return back()->withErrors([
                'user_id' => 'User yang dipilih bukan anggota aktif di kepengurusan ini.',
            ])->withInput();
        }

        $tanggal = Carbon::parse($validated['tanggal']);
        $dayMap = [1 => 'senin', 2 => 'selasa', 3 => 'rabu', 4 => 'kamis', 5 => 'jumat'];
        $hari = $dayMap[$tanggal->dayOfWeekIso] ?? null;

        if (!$hari) {
            return back()->withErrors([
                'tanggal' => 'Absensi manual hanya bisa untuk hari Senin sampai Jumat.',
            ])->withInput();
        }

        $jadwal = JadwalPiket::withTrashed()
            ->where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
            ->whereHas('kepengurusanUser', function ($query) use ($validated) {
                $query->where('user_id', $validated['user_id']);
            })
            ->where('hari', $hari)
            ->whereDate('created_at', '<=', $tanggal->format('Y-m-d'))
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('deleted_at')
                      ->orWhereDate('deleted_at', '>=', $tanggal->format('Y-m-d'));
            })
            ->first();

        if (!$jadwal) {
            return back()->withErrors([
                'tanggal' => 'User tidak memiliki jadwal piket pada hari tersebut (atau jadwal tersebut tidak aktif pada tanggal ini).',
            ])->withInput();
        }

        $periodePiket = PeriodePiket::where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
            ->whereDate('tanggal_mulai', '<=', $tanggal->format('Y-m-d'))
            ->whereDate('tanggal_selesai', '>=', $tanggal->format('Y-m-d'))
            ->first();

        if ($periodePiket && !empty($validated['jam_masuk']) && !empty($validated['jam_keluar'])) {
            $masuk = Carbon::parse($validated['jam_masuk']);
            $keluar = Carbon::parse($validated['jam_keluar']);
            $diffMinutes = $masuk->diffInMinutes($keluar);
            $requiredMinutes = (int) ($periodePiket->lama_piket ?? 120);

            if ($diffMinutes < $requiredMinutes) {
                return back()->withErrors([
                    'jam_keluar' => 'Total durasi piket (' . $diffMinutes . ' menit) kurang dari batas minimal periode (' . $requiredMinutes . ' menit).',
                ])->withInput();
            }
        }

        $existing = Absensi::where('jadwal_piket_id', $jadwal->id)
            ->whereDate('tanggal', $tanggal->format('Y-m-d'))
            ->first();

        if ($existing) {
            return back()->withErrors([
                'tanggal' => 'Absensi pada tanggal tersebut sudah ada. Gunakan fitur edit untuk memperbarui data.',
            ])->withInput();
        }

        $jamMasuk = $validated['jam_masuk'] . ':00';
        $jamKeluar = !empty($validated['jam_keluar']) ? $validated['jam_keluar'] . ':00' : null;

        if ($jamKeluar && $jamKeluar <= $jamMasuk) {
            return back()->withErrors([
                'jam_keluar' => 'Jam keluar harus lebih besar dari jam masuk.',
            ])->withInput();
        }

        Absensi::create([
            'tanggal' => $tanggal->format('Y-m-d'),
            'jam_masuk' => $jamMasuk,
            'jam_keluar' => $jamKeluar,
            'foto_checkin' => 'manual_input',
            'foto_checkout' => 'manual_input',
            'jadwal_piket_id' => $jadwal->id,
            'kegiatan' => $validated['kegiatan'],
            'is_manual' => true,
            'manual_input_by' => $user->id,
            'verification_status' => 'approved',
            'verified_by' => $user->id,
            'verified_at' => now(),
            'verification_note' => null,
        ]);

        return redirect()->back()->with('success', 'Absensi manual berhasil ditambahkan.');
    }

    public function updateManual(Request $request, $id)
    {
        $user = Auth::user();
        $this->ensureManualAbsensiAccess($user);

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_keluar' => 'nullable|date_format:H:i',
            'kegiatan' => 'required|string|max:1000',
        ]);

        $absensi = Absensi::with('jadwalPiket')->findOrFail($id);
        if (!$absensi->jadwalPiket) {
            return back()->withErrors([
                'message' => 'Data jadwal piket untuk absensi ini tidak ditemukan.',
            ]);
        }

        $tanggal = Carbon::parse($validated['tanggal']);
        $dayMap = [1 => 'senin', 2 => 'selasa', 3 => 'rabu', 4 => 'kamis', 5 => 'jumat'];
        $hari = $dayMap[$tanggal->dayOfWeekIso] ?? null;

        if (!$hari) {
            return back()->withErrors([
                'tanggal' => 'Absensi manual hanya bisa untuk hari Senin sampai Jumat.',
            ])->withInput();
        }

        if ($absensi->jadwalPiket->hari !== $hari) {
            $targetUserId = $absensi->jadwalPiket->kepengurusanUser?->user_id;
            if (!$targetUserId) {
                return back()->withErrors([
                    'tanggal' => 'Data user jadwal piket tidak valid untuk absensi ini.',
                ])->withInput();
            }

            $jadwalBaru = JadwalPiket::withTrashed()
                ->where('kepengurusan_lab_id', $absensi->jadwalPiket->kepengurusan_lab_id)
                ->whereHas('kepengurusanUser', function ($query) use ($targetUserId) {
                    $query->where('user_id', $targetUserId);
                })
                ->where('hari', $hari)
                ->whereDate('created_at', '<=', $tanggal->format('Y-m-d'))
                ->where(function ($query) use ($tanggal) {
                    $query->whereNull('deleted_at')
                          ->orWhereDate('deleted_at', '>=', $tanggal->format('Y-m-d'));
                })
                ->first();

            if (!$jadwalBaru) {
                return back()->withErrors([
                    'tanggal' => 'User tidak memiliki jadwal piket di hari baru yang dipilih pada tanggal tersebut.',
                ])->withInput();
            }

            $absensi->jadwal_piket_id = $jadwalBaru->id;
        }

        $jamMasuk = $validated['jam_masuk'] . ':00';
        $jamKeluar = !empty($validated['jam_keluar']) ? $validated['jam_keluar'] . ':00' : null;

        if ($jamKeluar && $jamKeluar <= $jamMasuk) {
            return back()->withErrors([
                'jam_keluar' => 'Jam keluar harus lebih besar dari jam masuk.',
            ])->withInput();
        }

        $periodePiket = PeriodePiket::where('kepengurusan_lab_id', $absensi->jadwalPiket->kepengurusan_lab_id)
            ->whereDate('tanggal_mulai', '<=', $tanggal->format('Y-m-d'))
            ->whereDate('tanggal_selesai', '>=', $tanggal->format('Y-m-d'))
            ->first();

        if ($periodePiket && !empty($validated['jam_masuk']) && !empty($validated['jam_keluar'])) {
            $masuk = Carbon::parse($validated['jam_masuk']);
            $keluar = Carbon::parse($validated['jam_keluar']);
            $diffMinutes = $masuk->diffInMinutes($keluar);
            $requiredMinutes = (int) ($periodePiket->lama_piket ?? 120);

            if ($diffMinutes < $requiredMinutes) {
                return back()->withErrors([
                    'jam_keluar' => 'Total durasi piket (' . $diffMinutes . ' menit) kurang dari batas minimal periode (' . $requiredMinutes . ' menit).',
                ])->withInput();
            }
        }

        $duplicate = Absensi::where('jadwal_piket_id', $absensi->jadwal_piket_id)
            ->whereDate('tanggal', $tanggal->format('Y-m-d'))
            ->where('id', '!=', $absensi->id)
            ->exists();

        if ($duplicate) {
            return back()->withErrors([
                'tanggal' => 'Sudah ada absensi lain pada tanggal ini untuk jadwal tersebut.',
            ])->withInput();
        }

        $absensi->tanggal = $tanggal->format('Y-m-d');
        $absensi->jam_masuk = $jamMasuk;
        $absensi->jam_keluar = $jamKeluar;
        $absensi->kegiatan = $validated['kegiatan'];
        $absensi->save();

        return redirect()->back()->with('success', 'Absensi manual berhasil diperbarui.');
    }

    public function destroyManual($id)
    {
        $user = Auth::user();
        $this->ensureManualAbsensiDeleteAccess($user);

        $absensi = Absensi::findOrFail($id);

        if (!$absensi->is_manual) {
            return redirect()->back()->with('error', 'Hanya data absensi manual yang dapat dihapus.');
        }

        $absensi->delete();

        return redirect()->back()->with('success', 'Absensi manual berhasil dihapus.');
    }

    public function verify(Request $request, $id)
    {
        $user = Auth::user();
        $this->ensureAbsensiVerifyAccess($user);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'verification_note' => 'nullable|string|max:1000',
        ]);

        if ($validated['status'] === 'rejected' && empty(trim((string) ($validated['verification_note'] ?? '')))) {
            return back()->withErrors([
                'verification_note' => 'Alasan penolakan absensi wajib diisi.',
            ]);
        }

        $absensi = Absensi::findOrFail($id);
        $absensi->verification_status = $validated['status'];
        $absensi->verification_note = $validated['verification_note'] ?? null;
        $absensi->verified_by = $user->id;
        $absensi->verified_at = now();
        $absensi->save();

        return back()->with('success', $validated['status'] === 'approved'
            ? 'Absensi berhasil di-ACC.'
            : 'Absensi ditolak.');
    }

    public function index()
    {
        $user = Auth::user();

        $userLab = $user->getCurrentLab();

        Log::info('User lab information', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_lab' => $userLab,
            'struktur_id' => $user->struktur_id,
            'roles' => $user->roles->pluck('name')
        ]);

        if (!$userLab || !isset($userLab['kepengurusan_lab_id'])) {

            Log::warning('User not associated with a lab', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'struktur_id' => $user->struktur_id,
                'user_lab_data' => $userLab
            ]);

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

        $kepengurusanLabId = $this->resolveAttendanceKepengurusanLabId($user);

        if (!$kepengurusanLabId) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Terdeteksi lebih dari satu kepengurusan aktif. Silakan pilih tahun/kepengurusan aktif yang benar dari navbar terlebih dahulu.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false,
            ]);
        }

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

        check_active_period:

        $periodePiket = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $kepengurusanLabId)
            ->first();

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

        if (!$periodePiket) {
            $today = now()->format('Y-m-d');

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

        $today = now()->startOfDay();
        $periodStart = $periodePiket->tanggal_mulai->startOfDay();
        $periodEnd = $periodePiket->tanggal_selesai->endOfDay();

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

        $hariIni = strtolower(now()->locale('id')->dayName);

        Log::info('User schedule check', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'current_day' => $hariIni,
        ]);

        $jadwalPiket = JadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('hari', $hariIni)
            ->where('kepengurusan_lab_id', $kepengurusanLabId)
            ->first();

        $scheduleOverride = null;

        $scheduleOverrideQuery = \App\Models\GantiJadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('hari_baru', $hariIni)
            ->where('periode_piket_id', $periodePiket->id)
            ->where('status', 'approved')
            ->with(['jadwalPiket']);

        if ($kepengurusanLabId) {
            $scheduleOverrideQuery->whereHas('jadwalPiket', function ($q) use ($kepengurusanLabId) {
                $q->where('kepengurusan_lab_id', $kepengurusanLabId);
            });
        }

        $scheduleOverride = $scheduleOverrideQuery->first();

        if ($scheduleOverride) {

            $jadwalPiket = $scheduleOverride->jadwalPiket;
            $jadwalPiket->is_override = true;
            $jadwalPiket->override_reason = $scheduleOverride->alasan;
            $jadwalPiket->original_day = $scheduleOverride->hari_lama;
            $jadwalPiket->override_day = $scheduleOverride->hari_baru;
        } else {

            $scheduleOverrideAwayQuery = \App\Models\GantiJadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('hari_lama', $hariIni)
                ->where('periode_piket_id', $periodePiket->id)
                ->where('status', 'approved');

            if ($kepengurusanLabId) {
                $scheduleOverrideAwayQuery->whereHas('jadwalPiket', function ($q) use ($kepengurusanLabId) {
                    $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                });
            }

            $scheduleOverrideAway = $scheduleOverrideAwayQuery->first();

            if ($scheduleOverrideAway) {

                $jadwalPiket = null;
            }
        }

        if (!$jadwalPiket) {

            $allJadwal = JadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->get();

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
                'user_id' => $jadwalPiket->kepengurusanUser?->user_id,
                'day' => $jadwalPiket->hari,
                'is_override' => $jadwalPiket->is_override ?? false,
                'override_reason' => $jadwalPiket->override_reason ?? null
            ]);
        }

        $alreadySubmitted = false;
        $checkedIn = null;

        if ($jadwalPiket) {
            $todayAbsensi = Absensi::where('jadwal_piket_id', $jadwalPiket->id)
                ->whereDate('tanggal', now()->toDateString())
                ->first();

            if ($todayAbsensi) {
                if ($todayAbsensi->jam_keluar !== null) {

                    $alreadySubmitted = true;
                } else {

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
                'jadwal_piket_id' => 'nullable|exists:jadwal_piket,id',
                'foto_checkin'    => 'required|string',
            ]);

            $user = Auth::user();

            $kepengurusanLabId = $this->resolveAttendanceKepengurusanLabId($user);

            if (!$kepengurusanLabId) {
                return redirect()->back()->with('error', 'Konteks kepengurusan tidak valid. Silakan pilih kepengurusan aktif yang benar terlebih dahulu.');
            }

            if (!empty($validated['jadwal_piket_id'])) {
                $jadwalFromRequest = JadwalPiket::where('id', $validated['jadwal_piket_id'])
                    ->whereHas('kepengurusanUser', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->first();

                if (!$jadwalFromRequest) {
                    return redirect()->back()->with('error', 'Jadwal piket tidak valid untuk kepengurusan aktif Anda. Silakan refresh halaman lalu coba lagi.');
                }
            }

            if (empty($validated['jadwal_piket_id'])) {
                $hariIni = strtolower(now()->locale('id')->dayName);

                $jadwalQuery = JadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->where('hari', $hariIni);

                if ($kepengurusanLabId) {
                    $jadwalQuery->where('kepengurusan_lab_id', $kepengurusanLabId);
                }

                $jadwalPiket = $jadwalQuery->first();

                if (!$jadwalPiket) {
                    $overrideQuery = \App\Models\GantiJadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        })
                        ->where('hari_baru', $hariIni)
                        ->where('status', 'approved')
                        ->with(['jadwalPiket']);

                    if ($request->filled('periode_piket_id')) {
                        $overrideQuery->where('periode_piket_id', $request->periode_piket_id);
                    }

                    if ($kepengurusanLabId) {
                        $overrideQuery->whereHas('jadwalPiket', function($q) use ($kepengurusanLabId) {
                            $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                        });
                    }

                    $scheduleOverride = $overrideQuery->first();

                    if ($scheduleOverride) {
                        $jadwalPiket = $scheduleOverride->jadwalPiket;
                    }
                } else {

                    $overrideAwayQuery = \App\Models\GantiJadwalPiket::whereHas('kepengurusanUser', function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        })
                        ->where('hari_lama', $hariIni)
                        ->where('status', 'approved');

                    if ($request->filled('periode_piket_id')) {
                        $overrideAwayQuery->where('periode_piket_id', $request->periode_piket_id);
                    }

                    if ($kepengurusanLabId) {
                        $overrideAwayQuery->whereHas('jadwalPiket', function($q) use ($kepengurusanLabId) {
                            $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                        });
                    }

                    $scheduleOverrideAway = $overrideAwayQuery->first();

                    if ($scheduleOverrideAway) {
                        $jadwalPiket = null;
                    }
                }

                if (!$jadwalPiket) {
                    return redirect()->back()->with('error', 'Anda tidak memiliki jadwal piket untuk hari ini.');
                }

                $validated['jadwal_piket_id'] = $jadwalPiket->id;
            }

            $existing = Absensi::where('jadwal_piket_id', $validated['jadwal_piket_id'])
                ->whereDate('tanggal', now()->toDateString())
                ->first();

            if ($existing) {
                if ($existing->jam_keluar !== null) {
                    return redirect()->back()->with('error', 'Anda sudah menyelesaikan absensi (checkout) untuk hari ini.');
                }
                return redirect()->back()->with('error', 'Anda sudah melakukan check-in. Silakan lakukan checkout setelah piket selesai.');
            }

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

            $absensi = Absensi::create([
                'tanggal'        => now()->format('Y-m-d'),
                'jam_masuk'      => now()->format('H:i:s'),
                'jam_keluar'     => null,
                'foto_checkout'  => null,
                'foto_checkin'   => $checkinFilename,
                'jadwal_piket_id'=> $validated['jadwal_piket_id'],
                'kegiatan'       => $validated['kegiatan'],
                'verification_status' => 'approved',
                'verified_by' => null,
                'verified_at' => null,
                'verification_note' => null,
            ]);

            Log::info('Check-in recorded', ['absensi_id' => $absensi->id, 'user_id' => $user->id]);
            $periodeAktif = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('isactive', true)
                ->whereDate('tanggal_mulai', '<=', now()->toDateString())
                ->whereDate('tanggal_selesai', '>=', now()->toDateString())
                ->first();

            $minDurasi = $periodeAktif ? ($periodeAktif->lama_piket ?? 120) : 120;

            return redirect()->route('piket.absensi.index')->with('success', 'Check-in berhasil! Jangan lupa checkout setelah piket selesai (min. ' . $this->formatDurasiMenit($minDurasi) . ').');
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
                'absensi_id'     => 'required|exists:absensi,id',
                'foto_checkout'  => 'required|string',
                'kegiatan'       => 'required|string',
            ]);

            $user = Auth::user();
            $absensi = Absensi::findOrFail($validated['absensi_id']);

            $jadwalPiket = JadwalPiket::find($absensi->jadwal_piket_id);
            if (!$jadwalPiket || $jadwalPiket->kepengurusanUser?->user_id !== $user->id) {
                return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk checkout ini.');
            }

            if ($absensi->tanggal->toDateString() !== now()->toDateString()) {
                return redirect()->back()->with('error', 'Absensi ini bukan untuk hari ini.');
            }

            if ($absensi->jam_keluar !== null) {
                return redirect()->back()->with('error', 'Anda sudah melakukan checkout.');
            }

            $jamMasuk = \Carbon\Carbon::parse(now()->toDateString() . ' ' . $absensi->jam_masuk);
            $jamKeluar = now();
            $durasiMenit = (int) $jamMasuk->diffInMinutes($jamKeluar);

            $tanggalAbsensi = $absensi->tanggal instanceof \DateTimeInterface
                ? $absensi->tanggal->format('Y-m-d')
                : \Carbon\Carbon::parse($absensi->tanggal)->format('Y-m-d');
            $periodeAktif = PeriodePiket::where('kepengurusan_lab_id', $jadwalPiket->kepengurusan_lab_id)
                ->where('tanggal_mulai', '<=', $tanggalAbsensi)
                ->where('tanggal_selesai', '>=', $tanggalAbsensi)
                ->first();
            $minDurasi = $periodeAktif ? ($periodeAktif->lama_piket ?? 120) : 120;

            if ($durasiMenit < $minDurasi) {
                $sisaMenit = $minDurasi - $durasiMenit;
                $sisaJam   = intdiv($sisaMenit, 60);
                $sisaMin   = $sisaMenit % 60;
                $minLabel  = $this->formatDurasiMenit($minDurasi);
                $msg = "Minimal durasi piket adalah {$minLabel}. Masih kurang {$sisaJam} jam {$sisaMin} menit lagi.";
                return redirect()->back()->with('error', $msg);
            }

            if (!preg_match('/^data:image\/(\w+);base64,/', $validated['foto_checkout'])) {
                return redirect()->back()->with('error', 'Format foto tidak valid.');
            }

            $image_data = base64_decode(substr($validated['foto_checkout'], strpos($validated['foto_checkout'], ',') + 1));
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

            $absensi->jam_keluar    = $jamKeluar->format('H:i:s');
            $absensi->foto_checkout = $filename;
            $absensi->kegiatan      = $validated['kegiatan'];
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

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $periode = null;
        $riwayatAbsensi = [];

        Log::info('Request data for riwayat absen:', [
            'all_params' => $request->all(),
            'kepengurusan_lab_id' => $kepengurusan_lab_id,
            'periode_id' => $periodeId,
            'lab_id' => $lab_id,
            'tahun_id' => $tahun_id,
            'url' => $request->fullUrl(),
            'user_roles' => $user->roles->pluck('name')
        ]);

        $isSuperAdmin = $user->hasRole(['superadmin', 'kadep']);
        $isAdmin = $user->hasRole('admin');

        $kepengurusanLabId = null;

        if ($kepengurusan_lab_id) {

            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $kepengurusanLabId = $kepengurusanLab->id;
                $lab_id = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        } else {

            if (!$isSuperAdmin && $userLab = $user->getCurrentLab()) {
                $lab_id = $userLab['laboratorium']->id ?? $lab_id;
            }

            if ($lab_id) {
                if ($tahun_id) {
                    $kepengurusanLabId = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                        ->where('tahun_kepengurusan_id', $tahun_id)
                        ->value('id');
                } else {

                    $activeKl = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                        ->where('is_active', true)
                        ->first();
                    if ($activeKl) {
                        $kepengurusanLabId = $activeKl->id;
                        $tahun_id = $activeKl->tahun_kepengurusan_id;
                    }
                }
            }
        }

        $responseData = [
            'riwayatAbsensi' => [],
            'periode' => null,
            'periodes' => collect([]),
            'isAdmin' => $isAdmin || $isSuperAdmin,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageManualAbsensi' => $isAdmin || $isSuperAdmin,
            'canDeleteManualAbsensi' => $user->hasRole('superadmin'),
            'canVerifyAbsensi' => $user->hasRole(['superadmin', 'admin']) || $user->can('absensi.verify'),
            'manualUsers' => [],
            'currentKepengurusanLabId' => $kepengurusanLabId,
            'tahunKepengurusan' => \App\Models\TahunKepengurusan::orderBy('tahun', 'desc')->get(),
            'laboratorium' => \App\Models\Laboratorium::all(),
            'currentTahunId' => $tahun_id,
        ];

        if (!$kepengurusanLabId) {
            return Inertia::render('RiwayatAbsen', $responseData);
        }

        if ($isAdmin || $isSuperAdmin) {
            $manualUsers = User::whereIn('id', function ($q) use ($kepengurusanLabId) {
                    $q->select('user_id')
                        ->from('kepengurusan_user')
                        ->where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->where('is_active', true);
                })
                ->orderBy('name')
                ->get(['id', 'name']);

            $responseData['manualUsers'] = $manualUsers;
            $responseData['currentKepengurusanLabId'] = $kepengurusanLabId;
        }

        $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->orderBy('tanggal_mulai', 'desc');

        $userJadwalPiketIds = collect();
        $hasJadwalPiket = true;

        if (!$isSuperAdmin && !$isAdmin) {
            $userJadwalPiketIds = JadwalPiket::withTrashed()->whereHas('kepengurusanUser', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->pluck('id');

            if ($userJadwalPiketIds->isEmpty()) {
                $hasJadwalPiket = false;
            } else {

                $attendedPeriodIds = [];
                $allPeriodRows = $periodes->getQuery()->get();
                foreach ($allPeriodRows as $p) {
                    $hasRecord = Absensi::whereIn('jadwal_piket_id', $userJadwalPiketIds)
                        ->whereBetween('tanggal', [$p->tanggal_mulai, $p->tanggal_selesai])
                        ->exists();
                    if ($hasRecord) {
                        $attendedPeriodIds[] = $p->id;
                    }
                }

                if (!empty($attendedPeriodIds)) {
                    $periodes->whereIn('id', $attendedPeriodIds);
                }
            }
        }

        $periodes = $periodes->get();
        $responseData['periodes'] = $periodes;

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

        if (!$isSuperAdmin && !$isAdmin && !$hasJadwalPiket) {
            return Inertia::render('RiwayatAbsen', $responseData);
        }

        $query = Absensi::with(['jadwalPiket.kepengurusanUser.user'])
            ->whereBetween('tanggal', [
                $periode->tanggal_mulai->format('Y-m-d'),
                $periode->tanggal_selesai->format('Y-m-d'),
            ]);

        if (!$isSuperAdmin && !$isAdmin) {
            $query->whereIn('jadwal_piket_id', $userJadwalPiketIds);
        } else {
            $kepengurusanUserIds = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('is_active', true)
                ->pluck('user_id');
            if ($kepengurusanUserIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }

            $jadwalPiketIds = JadwalPiket::withTrashed()->whereHas('kepengurusanUser', function ($query) use ($kepengurusanUserIds) {
                $query->whereIn('user_id', $kepengurusanUserIds);
            })->pluck('id');
            if ($jadwalPiketIds->isEmpty()) {
                return Inertia::render('RiwayatAbsen', $responseData);
            }

            $query->whereIn('jadwal_piket_id', $jadwalPiketIds);
        }

        $absensiRecords = $query->orderBy('tanggal', 'desc')
            ->orderBy('jam_masuk', 'desc')
            ->get();

        $responseData['riwayatAbsensi'] = $absensiRecords->map(function($item) {
            try {
                $fotoCheckoutUrl = null;
                if ($item->foto_checkout) {
                    if (Storage::disk('public')->exists($item->foto_checkout)) {
                        $fotoCheckoutUrl = Storage::url($item->foto_checkout);
                    } elseif (file_exists(public_path('storage/' . $item->foto_checkout))) {
                        $fotoCheckoutUrl = asset('storage/' . $item->foto_checkout);
                    } else {
                        $fotoCheckoutUrl = asset('storage/' . $item->foto_checkout);
                    }
                }

                $fotoCheckinUrl = null;
                if ($item->foto_checkin) {
                    if (Storage::disk('public')->exists($item->foto_checkin)) {
                        $fotoCheckinUrl = Storage::url($item->foto_checkin);
                    } elseif (file_exists(public_path('storage/' . $item->foto_checkin))) {
                        $fotoCheckinUrl = asset('storage/' . $item->foto_checkin);
                    } else {
                        $fotoCheckinUrl = asset('storage/' . $item->foto_checkin);
                    }
                }

                return [
                    'id'           => $item->id,
                    'tanggal'      => $item->tanggal,
                    'jam_masuk'    => $item->jam_masuk,
                    'jam_keluar'   => $item->jam_keluar,
                    'kegiatan'     => $item->kegiatan,
                    'is_manual'    => (bool) $item->is_manual,
                    'verification_status' => $item->verification_status ?? 'approved',
                    'verification_note' => $item->verification_note,
                    'foto_checkout' => $fotoCheckoutUrl,
                    'foto_checkin'  => $fotoCheckinUrl,
                    'user_id'      => $item->jadwalPiket?->kepengurusanUser?->user_id,
                    'user'         => $item->jadwalPiket?->kepengurusanUser?->user,
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

        if (! $user->can('absensi.view_rekap')) {
            abort(403, 'Unauthorized access. You do not have permission to view this page.');
        }

        $periodeId = $request->input('periode_id');

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $periode = null;
        $rekapAbsensi = [];
        $jadwalByDay = [];

        Log::info('RekapAbsen request received', [
            'params' => $request->all(),
            'user_id' => Auth::id(),
            'url' => $request->fullUrl(),
            'user_roles' => $user->roles->pluck('name')
        ]);

        $kepengurusanLabId = null;

        if ($kepengurusan_lab_id) {

            $kepengurusanLab = \App\Models\KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepengurusanLab) {
                $kepengurusanLabId = $kepengurusanLab->id;
                $lab_id = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        } else {

            if ($user->hasRole('admin') && !$user->hasRole(['superadmin', 'kadep'])) {
                $userLab = $user->getCurrentLab();
                if ($userLab && isset($userLab['laboratorium'])) {
                    $lab_id = $userLab['laboratorium']->id;
                    Log::info("Admin user's lab ID set to: {$lab_id}");
                }
            }

            if ($lab_id) {
                if ($tahun_id) {
                    $kepengurusanLab = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                        ->where('tahun_kepengurusan_id', $tahun_id)
                        ->first();

                    if ($kepengurusanLab) {
                        $kepengurusanLabId = $kepengurusanLab->id;
                        Log::info("Found kepengurusan_lab_id: {$kepengurusanLabId} for lab_id: {$lab_id}");
                    } else {
                        Log::warning("No kepengurusan_lab found for lab_id: {$lab_id} and tahun_id: {$tahun_id}");
                    }
                } else {

                    $kepengurusanLab = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                        ->where('is_active', true)
                        ->first();
                    if ($kepengurusanLab) {
                        $kepengurusanLabId = $kepengurusanLab->id;
                        $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
                        Log::info("Using active kepengurusan_lab: {$kepengurusanLabId}");
                    }
                }
            }
        }

        $periodes = collect([]);

        if ($kepengurusanLabId) {

            $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->orderBy('tanggal_mulai', 'desc')
                ->get();

            Log::info('Found ' . $periodes->count() . ' periods for kepengurusan_lab_id: ' . $kepengurusanLabId);
        }

        if ($periodeId && $kepengurusanLabId) {
            $periode = PeriodePiket::where('id', $periodeId)
                ->where('kepengurusan_lab_id', $kepengurusanLabId)
                ->first();

            if (!$periode) {
                Log::warning("Selected period {$periodeId} not found or does not belong to kepengurusan_lab {$kepengurusanLabId}");
            }
        }

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

        if ($periode && $kepengurusanLabId) {
            Log::info('Using periode: ' . $periode->id . ' (' . $periode->nama . ')');

            $pengaturanPiket = \App\Models\PengaturanPiket::where('kepengurusan_lab_id', $kepengurusanLabId)->first();
            $adaDenda        = $pengaturanPiket && $pengaturanPiket->ada_denda;
            $nominalDenda    = $adaDenda ? (float) ($pengaturanPiket->nominal_denda ?? 0) : 0;

            // Sync denda piket
            app(\App\Http\Controllers\DendaPiketController::class)->sync($periode->id);

            $jadwalByDay = $this->getJadwalByDay($periode->id, $kepengurusanLabId);

            $userAttendance = [];

            $kepengurusanUserIds = \App\Models\KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('is_active', true)
                ->pluck('user_id')
                ->toArray();

            if (!empty($kepengurusanUserIds)) {

                $users = User::whereIn('id', $kepengurusanUserIds)
                    ->whereHas('jadwalPiket', function ($query) {
                        $query->withTrashed();
                    })
                    ->get();

                Log::info('Found ' . $users->count() . ' users with jadwal piket for this kepengurusan');

                foreach ($users as $user) {

                    $userJadwalIds = JadwalPiket::withTrashed()
                        ->where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->whereHas('kepengurusanUser', function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        })
                        ->pluck('id')
                        ->toArray();

                    $totalJadwal = count($userJadwalIds);

                    if ($totalJadwal === 0) {
                        continue;
                    }

                    $hadir = Absensi::whereIn('jadwal_piket_id', $userJadwalIds)
                        ->whereBetween('tanggal', [
                            $periode->tanggal_mulai->format('Y-m-d'),
                            $periode->tanggal_selesai->format('Y-m-d'),
                        ])
                        ->whereNotNull('jam_keluar')
                        ->where('verification_status', 'approved')
                        ->count();

                    $tidakHadir = $totalJadwal - $hadir;
                    $tidakHadir = max(0, $tidakHadir);

                    $ganti = 0;

                    $denda = $adaDenda ? ($tidakHadir * $nominalDenda) : 0;

                    $dendaPiket = DendaPiket::where('user_id', $user->id)
                        ->where('periode_piket_id', $periode->id)
                        ->first();

                    $userAttendance[] = [
                        'user' => $user,
                        'total_jadwal' => $totalJadwal,
                        'hadir' => $hadir,
                        'tidak_hadir' => $tidakHadir,
                        'ganti' => $ganti,
                        'denda' => $denda,
                        'denda_piket' => $dendaPiket ? [
                            'id' => $dendaPiket->id,
                            'total_denda' => (float) $dendaPiket->total_denda,
                            'sudah_dibayar' => (float) $dendaPiket->sudah_dibayar,
                            'sisa' => (float) ($dendaPiket->total_denda - $dendaPiket->sudah_dibayar),
                            'status' => $dendaPiket->status,
                        ] : null,
                    ];
                }

                $rekapAbsensi = $userAttendance;
            }
        }

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
            'periodes' => $periodes,
            'tahunKepengurusan' => $this->getFilteredTahunKepengurusan($lab_id),
            'laboratorium' => \App\Models\Laboratorium::all(),
            'currentTahunId' => $tahun_id,
            'currentLabId' => $lab_id,
            'pengaturanPiket' => isset($pengaturanPiket) ? $pengaturanPiket : null,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'message' => session('message')
            ]
        ]);
    }

    private function getJadwalByDay($periodeId, $kepengurusanLabId = null)
    {

        Log::info('Getting jadwal by day', [
            'periode_id' => $periodeId,
            'kepengurusan_lab_id' => $kepengurusanLabId
        ]);

        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        $jadwalByDay = [];

        foreach ($days as $day) {
            $jadwalByDay[$day] = [];
        }

        try {

            $periode = PeriodePiket::find($periodeId);
            if (!$periode) {
                Log::error("Cannot find period with ID: {$periodeId}");
                return $jadwalByDay;
            }

            $today = now()->startOfDay();
            $periodStart = $periode->tanggal_mulai->startOfDay();
            $periodEnd = $periode->tanggal_selesai->endOfDay();

            $isActivePeriod = $periode->isactive;

            $dayNumberMap = [
                'senin' => 1, 'selasa' => 2, 'rabu' => 3,
                'kamis' => 4, 'jumat' => 5
            ];

            $currentDayOfWeek = now()->dayOfWeekIso;

            $approvedChanges = \App\Models\GantiJadwalPiket::where('periode_piket_id', $periodeId)
                ->where('status', 'approved')
                ->with([
                    'jadwalPiket' => function ($query) {
                        $query->withTrashed()->with('kepengurusanUser.user');
                    },
                    'kepengurusanUser.user'
                ])
                ->get()
                ->keyBy('jadwal_piket_id');

            Log::info("Found {$approvedChanges->count()} approved schedule changes for period: {$periodeId}");

            foreach ($days as $day) {
                $jadwalsQuery = JadwalPiket::withTrashed()->with('kepengurusanUser.user')
                    ->where('hari', $day)
                    ->orderBy('deleted_at');

                if ($kepengurusanLabId) {

                    $jadwalsQuery->where('kepengurusan_lab_id', $kepengurusanLabId);
                }

                $jadwals = $jadwalsQuery->get();

                Log::info("Found {$jadwals->count()} jadwal for day: {$day}");

                $mappedJadwals = $jadwals->map(function($jadwal) use (
                    $periodeId,
                    $day,
                    $dayNumberMap,
                    $currentDayOfWeek,
                    $today,
                    $periodStart,
                    $periodEnd,
                    $isActivePeriod,
                    $approvedChanges,
                    $kepengurusanLabId
                ) {

                    $scheduleChange = $approvedChanges->get($jadwal->id);

                    $attendance = Absensi::where('jadwal_piket_id', $jadwal->id)
                        ->whereBetween('tanggal', [
                            $periodStart->format('Y-m-d'),
                            $periodEnd->format('Y-m-d'),
                        ])
                        ->whereNotNull('jam_keluar')
                        ->where('verification_status', 'approved')
                        ->first();

                    if (!$attendance) {
                        $attendance = Absensi::whereHas('jadwalPiket', function ($q) use ($jadwal, $day, $kepengurusanLabId) {
                            $q->withTrashed();
                            $q->where('kepengurusan_user_id', $jadwal->kepengurusan_user_id)
                                  ->where('hari', $day);

                                if ($kepengurusanLabId) {
                                    $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                                }
                            })
                            ->whereBetween('tanggal', [
                                $periodStart->format('Y-m-d'),
                                $periodEnd->format('Y-m-d'),
                            ])
                            ->whereNotNull('jam_keluar')
                            ->where('verification_status', 'approved')
                            ->first();
                    }

                    $status = 'tidak hadir';

                    if ($attendance) {

                        $status = 'hadir';
                    } else {

                        $dayNumber = $dayNumberMap[$day] ?? 0;

                        if ($isActivePeriod) {

                            if ($today->gte($periodStart) && $today->lte($periodEnd)) {

                                if ($dayNumber > $currentDayOfWeek) {
                                    $status = 'pending';
                                }
                            }

                            else if ($today->lt($periodStart)) {

                                $status = 'pending';
                            }

                        }

                    }

                    $baseData = [
                        'id' => $jadwal->id,
                        'user_id' => $jadwal->kepengurusanUser?->user_id,
                        'name' => $jadwal->user ? $jadwal->user->name : 'Unknown',
                        'status' => $status,
                        'is_override' => false,
                        'original_day' => null,
                        'override_day' => null,
                        'override_reason' => null
                    ];

                    if ($scheduleChange) {
                        $baseData['is_override'] = true;
                        $baseData['original_day'] = $scheduleChange->hari_lama;
                        $baseData['override_day'] = $scheduleChange->hari_baru;
                        $baseData['override_reason'] = $scheduleChange->alasan;
                        $baseData['override_user'] = $scheduleChange->user ? $scheduleChange->user->name : 'Unknown';
                    }

                    return $baseData;
                })

                ->unique('user_id')
                ->values()
                ->toArray();

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

        $attendanceRecords = Absensi::where('jadwal_piket_id', $jadwalId)
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
                    'foto_checkout' => $item->foto_checkout ? Storage::url($item->foto_checkout) : null,
                    'foto_checkin'  => $item->foto_checkin ? Storage::url($item->foto_checkin) : null,
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

    private function formatDurasiMenit(int $menit): string
    {
        $jam = intdiv($menit, 60);
        $sisaMenit = $menit % 60;

        if ($jam > 0 && $sisaMenit > 0) {
            return "{$jam} jam {$sisaMenit} menit";
        }

        if ($jam > 0) {
            return "{$jam} jam";
        }

        return "{$sisaMenit} menit";
    }
}
