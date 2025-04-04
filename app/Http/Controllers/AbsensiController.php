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
        // Ambil periode piket aktif
        $periodePiket = PeriodePiket::where('isactive', true)->first();
        
        if (!$periodePiket) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Tidak ada periode piket aktif saat ini.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false,
            ]);
        }
        
        // Ambil hari ini dalam bahasa Indonesia
        $hariIni = strtolower(now()->locale('id')->dayName);
        
        // Cari jadwal piket hanya berdasarkan user_id dan hari
        $jadwalPiket = JadwalPiket::where('user_id', $user->id)
            ->where('hari', $hariIni)
            ->first();
        
        $alreadySubmitted = false;
        if ($jadwalPiket) {
            // Cek apakah sudah absen hari ini untuk jadwal piket ini di periode aktif
            $alreadySubmitted = Absensi::where('jadwal_piket', $jadwalPiket->id)
                ->where('periode_piket_id', $periodePiket->id)
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
                
                $filename = 'absensi/' . time() . '_' . Auth::id() . '.png';
                
                try {
                    $saved = Storage::disk('public')->put($filename, $image_data);
                    
                    if (!$saved) {
                        Log::error('Failed to save image to storage');
                        return redirect()->back()->with('error', 'Gagal menyimpan foto.');
                    }
                    
                    Log::info('Successfully saved image to: ' . $filename);
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
        $periodeId = $request->input('periode_id');
        $periode = null;
        $riwayatAbsensi = [];
        
        // Debug log all request data
        Log::info('Request data for riwayat absen:', [
            'all_params' => $request->all(),
            'periode_id_param' => $periodeId,
            'url' => $request->fullUrl()
        ]);
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
            // If we're falling back to the active period, log it
            if ($periode) {
                Log::info('No period specified, using active period:', ['id' => $periode->id, 'name' => $periode->nama]);
            }
        }
        
        if ($periode) {
            // LOG the actual periode we're using
            Log::info('Using periode:', ['id' => $periode->id, 'name' => $periode->nama]);
            
            // Start by ignoring the user-specific filter to see ALL attendance records
            $query = Absensi::with(['jadwalPiket.user', 'periodePiket'])
                ->where('periode_piket_id', $periode->id);
            
            // Let's log the raw SQL first to confirm what we're querying
            Log::info('Raw SQL query: ' . $query->toSql());
            Log::info('SQL bindings:', $query->getBindings());
            
            // Direct check for the record we know should exist
            $testRecord = Absensi::where('periode_piket_id', 6)
                ->where('jadwal_piket', 10)
                ->first();
            
            if ($testRecord) {
                Log::info('Found test record in database:', $testRecord->toArray());
            } else {
                Log::warning('Test record not found in database!');
                // Broader search to see what IS in the database
                $allRecords = Absensi::count();
                Log::info('Total records in absensi table: ' . $allRecords);
                if ($allRecords > 0) {
                    $sampleRecords = Absensi::limit(3)->get(['id', 'periode_piket_id', 'jadwal_piket']);
                    Log::info('Sample records:', $sampleRecords->toArray());
                }
            }
            
            // Now get all the records first (without user filtering)
            $allRecords = $query->get();
            Log::info('All records for periode ' . $periode->id . ': ' . $allRecords->count());
            
            // AFTER confirming what records exist, apply user filtering only if needed
            // Get the logged in user's jadwal IDs
            $userJadwalIds = JadwalPiket::where('user_id', Auth::id())->pluck('id')->toArray();
            Log::info('User jadwal IDs:', $userJadwalIds);
            
            // For now, let's enable "admin" mode to see ALL records
            $isAdmin = true; // Temporarily override for debugging
            
            if (!$isAdmin && !empty($userJadwalIds)) {
                $query->whereIn('jadwal_piket', $userJadwalIds);
                // Log the filtered query
                Log::info('Filtered SQL query: ' . $query->toSql());
                Log::info('Filtered SQL bindings:', $query->getBindings());
            }
            
            // Execute the query
            $absensiRecords = $query->orderBy('tanggal', 'desc')
                ->orderBy('jam_masuk', 'desc')
                ->get();
            
            Log::info('Found ' . $absensiRecords->count() . ' attendance records after filtering');
            
            // If we found records, check if we can access relations
            if ($absensiRecords->count() > 0) {
                $firstRecord = $absensiRecords->first();
                Log::info('First record:', $firstRecord->toArray());
                
                // Check if relations are loading properly
                if ($firstRecord->jadwalPiket) {
                    Log::info('JadwalPiket relation loaded successfully');
                    if ($firstRecord->jadwalPiket->user) {
                        Log::info('User relation loaded successfully');
                    } else {
                        Log::warning('User relation failed to load');
                    }
                } else {
                    Log::warning('JadwalPiket relation failed to load');
                }
            }
            
            // Map records for frontend
            $riwayatAbsensi = $absensiRecords->map(function($item) {
                try {
                    // Log the current item we're processing
                    Log::info('Processing absensi record:', [
                        'id' => $item->id,
                        'tanggal' => $item->tanggal,
                        'has_jadwal_piket' => $item->jadwalPiket ? 'yes' : 'no',
                        'has_user' => ($item->jadwalPiket && $item->jadwalPiket->user) ? 'yes' : 'no'
                    ]);
                    
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
                } catch (\Exception $e) {
                    Log::error('Error mapping absensi record:', [
                        'error' => $e->getMessage(),
                        'record_id' => $item->id
                    ]);
                    return null;
                }
            })->filter()->values();
            
            // Log the final processed data
            Log::info('Processed ' . count($riwayatAbsensi) . ' records for frontend');
        } else {
            Log::warning('No periode found, returning empty data');
        }
        
        // Hardcode isAdmin for now to show all records
        $isAdmin = true;
        
        return Inertia::render('RiwayatAbsen', [
            'riwayatAbsensi' => $riwayatAbsensi,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
            'isAdmin' => $isAdmin,
            'debug' => [
                'userID' => Auth::id(),
                'url' => $request->fullUrl(),
                'params' => $request->all()
            ] // Add debug data for frontend visibility
        ]);
    }
    
    public function rekapAbsen(Request $request)
    {
        // Adding debugging
        Log::info('RekapAbsen request received', [
            'params' => $request->all(),
            'user_id' => Auth::id()
        ]);
        
        $periodeId = $request->input('periode_id');
        $periode = null;
        $rekapAbsensi = [];
        $jadwalByDay = [];
        
        if ($periodeId) {
            $periode = PeriodePiket::findOrFail($periodeId);
        } else {
            $periode = PeriodePiket::where('isactive', true)->first();
        }
        
        if ($periode) {
            Log::info('Using periode: ' . $periode->id . ' (' . $periode->nama . ')');
            
            // Get all jadwal piket data grouped by day
            // Here's the issue - we need to check the actual structure of the jadwal_piket table
            $jadwalByDay = $this->getJadwalByDay($periode->id);
            
            // Calculate attendance summaries for each user
            $userAttendance = [];
            
            // Get users who have jadwal piket
            $users = User::whereHas('jadwalPiket')->get();
            
            foreach ($users as $user) {
                // Get user's jadwal piket IDs 
                // Make sure we're using the correct column to filter by periode
                $userJadwalIds = JadwalPiket::where('user_id', $user->id)
                    // Instead of periode_piket_id, check the actual foreign key column
                    // Example: if it's actually "periode_id" in the jadwal_piket table
                    // ->where('periode_id', $periode->id)
                    ->pluck('id')
                    ->toArray();
                    
                // Log debugging info
                Log::info('User jadwal IDs for ' . $user->name, [
                    'ids' => $userJadwalIds,
                    'count' => count($userJadwalIds)
                ]);
                    
                // Count total jadwal assignments
                $totalJadwal = count($userJadwalIds);
                
                // If user has no jadwal in this period, skip them
                if ($totalJadwal === 0) {
                    continue;
                }
                
                // Count attendance records
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
        
        // Log what we're returning to the view
        Log::info('Returning data to RekapAbsen view', [
            'has_periode' => !is_null($periode),
            'jadwal_days' => array_keys($jadwalByDay),
            'rekap_count' => count($rekapAbsensi)
        ]);
        
        return Inertia::render('RekapAbsen', [
            'rekapAbsensi' => $rekapAbsensi,
            'jadwalByDay' => $jadwalByDay,
            'periode' => $periode,
            'periodes' => PeriodePiket::orderBy('created_at', 'desc')->get(),
            'isAdmin' => true, // For now, hardcoded to true
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'message' => session('message')
            ]
        ]);
    }
    
    /**
     * Get jadwal piket grouped by day for a specific period
     * UPDATED to check for the correct structure of the jadwal_piket table
     */
    private function getJadwalByDay($periodeId)
    {
        // Debug log to check parameters
        Log::info('Getting jadwal by day', ['periode_id' => $periodeId]);
        
        $days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        $jadwalByDay = [];
        
        // First, check if we can find any jadwal for this period
        // Let's check the actual structure by getting a sample
        $sampleJadwal = JadwalPiket::first();
        if ($sampleJadwal) {
            Log::info('Sample jadwal piket structure', [
                'attributes' => $sampleJadwal->getAttributes()
            ]);
        }
        
        // Initialize jadwalByDay with empty arrays for each day
        foreach ($days as $day) {
            $jadwalByDay[$day] = [];
        }
        
        try {
            // Query jadwal_piket table with the correct column for periode relation
            // Since we're not sure about the column name, we need to check it
            
            // IMPORTANT: Let's query by day only first, without periode filter
            // We'll modify this once we confirm the correct column name
            foreach ($days as $day) {
                $jadwals = JadwalPiket::with('user')
                    ->where('hari', $day)
                    ->get();
                    
                Log::info("Found {$jadwals->count()} jadwal for day: {$day}");
                
                // Map to the format expected by the frontend
                $mappedJadwals = $jadwals->map(function($jadwal) use ($periodeId) {
                    // Check attendance for this jadwal in the selected period
                    $attendance = Absensi::where('jadwal_piket', $jadwal->id)
                        ->where('periode_piket_id', $periodeId)
                        ->first();
                        
                    // Determine status
                    $status = 'tidak hadir';
                    if ($attendance) {
                        $status = 'hadir';
                    } else {
                        // If the day hasn't come yet, mark as pending
                        $dayNumber = [
                            'senin' => 1, 'selasa' => 2, 'rabu' => 3, 
                            'kamis' => 4, 'jumat' => 5
                        ][$jadwal->hari] ?? 0;
                        
                        $currentDay = now()->dayOfWeekIso;
                        
                        if ($dayNumber > $currentDay) {
                            $status = 'pending';
                        }
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
}
