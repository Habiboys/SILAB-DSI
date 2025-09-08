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
        
        // Find user's schedule for today
        $jadwalPiket = JadwalPiket::where('user_id', $user->id)
            ->where('hari', $hariIni)
            ->first();
        
        // Add more detailed logging for schedule checking
        if (!$jadwalPiket) {
            // Try to find if the user has any schedule at all
            $allJadwal = JadwalPiket::where('user_id', $user->id)->get();
            
            Log::info('No schedule found for today, checking all schedules', [
                'user_id' => $user->id,
                'day' => $hariIni,
                'has_any_schedule' => $allJadwal->isNotEmpty(),
                'all_schedules' => $allJadwal->pluck('hari')->toArray()
            ]);
        } else {
            Log::info('Found schedule for today', [
                'schedule_id' => $jadwalPiket->id,
                'user_id' => $jadwalPiket->user_id,
                'day' => $jadwalPiket->hari
            ]);
        }
        
        $alreadySubmitted = false;
        if ($jadwalPiket) {
            // Check if already submitted attendance today for this schedule in the active period
            $alreadySubmitted = Absensi::where('jadwal_piket', $jadwalPiket->id)
                ->where('periode_piket_id', $periodePiket->id)
                ->whereDate('tanggal', now()->toDateString())
                ->exists();
                
            Log::info('Attendance check', [
                'already_submitted' => $alreadySubmitted,
                'user_id' => $user->id,
                'schedule_id' => $jadwalPiket->id,
                'period_id' => $periodePiket->id,
                'date' => now()->toDateString()
            ]);
        }
        
        return Inertia::render('AmbilAbsen', [
            'jadwal' => $jadwalPiket,
            'periode' => $periodePiket,
            'today' => now()->format('Y-m-d'),
            'alreadySubmitted' => $alreadySubmitted,
            'debug_info' => [
                'user_id' => $user->id,
                'kepengurusan_lab_id' => $kepengurusanLabId,
                'current_day' => $hariIni,
                'has_schedule' => !!$jadwalPiket,
                'is_active_period' => $periodePiket->isactive
            ]
        ]);
    }
    
    public function store(Request $request)
    {
        try {
            Log::info('Received absensi data', [
                'has_foto' => !empty($request->foto),
                'foto_length' => $request->foto ? strlen($request->foto) : 0,
                'jam_masuk' => $request->jam_masuk,
                'kegiatan' => $request->kegiatan
            ]);
            
            $validated = $request->validate([
                'jam_masuk' => 'required',
                'jam_keluar' => 'nullable',
                'foto' => 'required|string',
                'kegiatan' => 'required|string',
                'periode_piket_id' => 'required|exists:periode_piket,id',
                'jadwal_piket' => 'nullable|exists:jadwal_piket,id',
            ]);
            
            // Additional validation to ensure jam_masuk is not after jam_keluar
            if (!empty($validated['jam_keluar']) && $validated['jam_masuk'] > $validated['jam_keluar']) {
                return redirect()->back()->with('error', 'Jam mulai tidak boleh lebih lambat dari jam selesai.');
            }
            
            $user = Auth::user();
            
            if (empty($validated['jadwal_piket'])) {
                $hariIni = strtolower(now()->locale('id')->dayName);
                $jadwalPiket = JadwalPiket::where('user_id', $user->id)
                    ->where('hari', $hariIni)
                    ->first();
                
                if (!$jadwalPiket) {
                    return redirect()->back()->with('error', 'Anda tidak memiliki jadwal piket untuk hari ini.');
                }
                
                $validated['jadwal_piket'] = $jadwalPiket->id;
            }
            
            // Cek apakah sudah absen hari ini
            $alreadySubmitted = Absensi::where('jadwal_piket', $validated['jadwal_piket'])
                ->whereDate('tanggal', now()->toDateString())
                ->exists();
                
            if ($alreadySubmitted) {
                return redirect()->back()->with('error', 'Anda sudah mengisi absensi untuk hari ini.');
            }
            
            // Proses foto
            if (preg_match('/^data:image\/(\w+);base64,/', $request->foto)) {
                $image_data = substr($request->foto, strpos($request->foto, ',') + 1);
                $image_data = base64_decode($image_data);
                
                if ($image_data === false) {
                    Log::error('Failed to decode base64 image data');
                    return redirect()->back()->with('error', 'Format gambar tidak valid.');
                }
                
                // Buat direktori jika belum ada
                if (!Storage::disk('public')->exists('absensi')) {
                    Storage::disk('public')->makeDirectory('absensi');
                }
                
                $filename = 'absensi/' . time() . '_' . Auth::id() . '.jpg'; // Changed to .jpg since we're using JPEG format
                
                try {
                    $saved = Storage::disk('public')->put($filename, $image_data);
                    
                    if (!$saved) {
                        Log::error('Failed to save image to storage');
                        return redirect()->back()->with('error', 'Gagal menyimpan foto.');
                    }
                    
                    // Verify the file was saved and exists
                    if (!Storage::disk('public')->exists($filename)) {
                        Log::error('File was reportedly saved but does not exist: ' . $filename);
                        return redirect()->back()->with('error', 'Foto tersimpan tapi tidak terverifikasi.');
                    }
                    
                    $fileSize = Storage::disk('public')->size($filename);
                    $fileUrl = url(Storage::url($filename));
                    
                    Log::info('Successfully saved image', [
                        'path' => $filename,
                        'size' => $fileSize,
                        'url' => $fileUrl
                    ]);
                    
                    $validated['foto'] = $filename;
                } catch (\Exception $e) {
                    Log::error('Exception while saving image: ' . $e->getMessage());
                    return redirect()->back()->with('error', 'Gagal menyimpan foto: ' . $e->getMessage());
                }
            } else {
                Log::error('Invalid image format: ' . substr($request->foto, 0, 30) . '...');
                return redirect()->back()->with('error', 'Format foto tidak valid.');
            }
            
            // Log data sebelum menyimpan
            Log::info('Creating absensi record with data', [
                'tanggal' => now()->format('Y-m-d'),
                'jam_masuk' => $validated['jam_masuk'],
                'jam_keluar' => $validated['jam_keluar'] ?? null,
                'foto' => $validated['foto'],
                'jadwal_piket' => $validated['jadwal_piket'],
                'kegiatan' => $validated['kegiatan'],
                'periode_piket_id' => $validated['periode_piket_id'],
            ]);
            
            // Simpan absensi
            try {
                $absensi = Absensi::create([
                    'tanggal' => now()->format('Y-m-d'),
                    'jam_masuk' => $validated['jam_masuk'],
                    'jam_keluar' => $validated['jam_keluar'] ?? null,
                    'foto' => $validated['foto'],
                    'jadwal_piket' => $validated['jadwal_piket'],
                    'kegiatan' => $validated['kegiatan'],
                    'periode_piket_id' => $validated['periode_piket_id'],
                ]);
                
                Log::info('Successfully created absensi record with ID: ' . $absensi->id);
                return redirect()->route('piket.absensi.index')->with('success', 'Absensi berhasil dicatat.');
            } catch (\Exception $e) {
                Log::error('Error creating absensi record: ' . $e->getMessage());
                return redirect()->back()->with('error', 'Gagal menyimpan data absensi: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            Log::error('Error in storeAbsen: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan absensi: ' . $e->getMessage());
        }
    }

    public function show(Request $request)
    {
        $user = Auth::user();
        $periodeId = $request->input('periode_id');
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $periode = null;
        $riwayatAbsensi = [];
        
        // Debug log request data
        Log::info('Request data for riwayat absen:', [
            'all_params' => $request->all(),
            'periode_id' => $periodeId,
            'lab_id' => $lab_id,
            'tahun_id' => $tahun_id,
            'url' => $request->fullUrl(),
            'user_roles' => $user->roles->pluck('name')
        ]);
        
        // Check user roles to determine access level
        $isSuperAdmin = $user->hasRole(['superadmin', 'kadep']);
        $isAdmin = $user->hasRole('admin');
        
        // Get active year if not provided
        $tahun_id = $tahun_id ?: \App\Models\TahunKepengurusan::where('isactive', true)->value('id');
        
        // Get user's lab if not superadmin
        if (!$isSuperAdmin && $userLab = $user->getCurrentLab()) {
            $lab_id = $userLab['laboratorium']->id ?? $lab_id;
        }
        
        // Get kepengurusan_lab_id
        $kepengurusanLabId = null;
        if ($lab_id && $tahun_id) {
            $kepengurusanLabId = \App\Models\KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->value('id');
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
                    }
                }
                
                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal,
                    'jam_masuk' => $item->jam_masuk,
                    'jam_keluar' => $item->jam_keluar,
                    'kegiatan' => $item->kegiatan,
                    'foto' => $fotoUrl,
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
                // Override any lab_id in the request with the admin's assigned lab
                $lab_id = $userLab['laboratorium']->id;
                Log::info("Admin user's lab ID set to: {$lab_id}");
            }
        }
        
        // Get kepengurusan_lab_id if lab_id and tahun_id are provided
        $kepengurusanLabId = null;
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
                    $isActivePeriod
                ) {
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
                    
                    return [
                        'id' => $jadwal->id,
                        'user_id' => $jadwal->user_id,
                        'name' => $jadwal->user ? $jadwal->user->name : 'Unknown',
                        'status' => $status
                    ];
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
