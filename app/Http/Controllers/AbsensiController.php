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
        
        if (!$userLab || !isset($userLab['kepengurusan_lab_id'])) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Anda tidak terdaftar di laboratorium manapun.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false,
            ]);
        }
        
        $kepengurusanLabId = $userLab['kepengurusan_lab_id'];
        
        // Get active period for this specific lab
        $periodePiket = PeriodePiket::where('isactive', true)
            ->where('kepengurusan_lab_id', $kepengurusanLabId)
            ->first();
        
        if (!$periodePiket) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Tidak ada periode piket aktif saat ini untuk laboratorium Anda.',
                'jadwal' => null,
                'periode' => null,
                'today' => now()->format('Y-m-d'),
                'alreadySubmitted' => false,
            ]);
        }
        
        // Check if we're within the date range of the active period
        $today = now()->startOfDay();
        $periodStart = $periodePiket->tanggal_mulai->startOfDay();
        $periodEnd = $periodePiket->tanggal_selesai->endOfDay();
        
        if ($today->lt($periodStart) || $today->gt($periodEnd)) {
            return Inertia::render('AmbilAbsen', [
                'message' => 'Hari ini bukan termasuk dalam periode piket aktif.',
                'jadwal' => null,
                'periode' => $periodePiket,
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
        
        // If no tahun_id is provided, use the active year
        if (!$tahun_id) {
            $aktiveTahun = \App\Models\TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $aktiveTahun ? $aktiveTahun->id : null;
            Log::info("Using active tahun: {$tahun_id}");
        }
        
        // Get the user's lab information
        $userLab = null;
        if (!$isSuperAdmin) {
            $userLab = $user->getCurrentLab();
            if ($userLab && isset($userLab['laboratorium'])) {
                $lab_id = $userLab['laboratorium']->id;
                Log::info("User's lab ID set to: {$lab_id}");
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
        
        // For regular users, we'll show data from their assigned lab
        if (!$isSuperAdmin && !$isAdmin) {
            if ($kepengurusanLabId) {
                // Get the user's jadwal piket IDs
                $userJadwalPiketIds = JadwalPiket::where('user_id', $user->id)
                    ->pluck('id')
                    ->toArray();
                    
                Log::info("Regular user {$user->name} has jadwal_piket IDs:", $userJadwalPiketIds);
                
                // Get periods associated with this kepengurusan where the user has absensi
                if (!empty($userJadwalPiketIds)) {
                    // First get period IDs from absensi
                    $periodIds = Absensi::whereIn('jadwal_piket', $userJadwalPiketIds)
                        ->distinct()
                        ->pluck('periode_piket_id')
                        ->toArray();
                    
                    // Then get the periods that match both the period IDs and kepengurusan
                    $periodes = PeriodePiket::whereIn('id', $periodIds)
                        ->where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->orderBy('tanggal_mulai', 'desc')
                        ->get();
                }
                
                // If no periods found with absensi, get all periods for this kepengurusan
                if ($periodes->isEmpty()) {
                    $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->orderBy('tanggal_mulai', 'desc')
                        ->get();
                }
            }
        } else {
            // For admin/superadmin, if we have a kepengurusan, get all its periods
            if ($kepengurusanLabId) {
                $periodes = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->orderBy('tanggal_mulai', 'desc')
                    ->get();
            }
        }
        
        Log::info('Found ' . $periodes->count() . ' periods for filtering');
        
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
            // Start query with periode filter
            $query = Absensi::with(['jadwalPiket.user', 'periodePiket'])
                ->where('periode_piket_id', $periode->id);
            
            // For regular users, only show their own records
            if (!$isSuperAdmin && !$isAdmin) {
                $userJadwalPiketIds = JadwalPiket::where('user_id', $user->id)
                    ->pluck('id')
                    ->toArray();
                    
                if (!empty($userJadwalPiketIds)) {
                    $query->whereIn('jadwal_piket', $userJadwalPiketIds);
                    Log::info("Filtering by user's jadwal_piket_ids: " . implode(', ', $userJadwalPiketIds));
                } else {
                    // No jadwal, so return empty results
                    return $this->renderRiwayatAbsenPage([], $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes);
                }
            } 
            // For admin/superadmin users, filter by kepengurusan
            else if ($kepengurusanLabId) {
                // Find struktur IDs for the kepengurusan_lab
                $strukturIds = Struktur::where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->pluck('id')
                    ->toArray();
                
                if (!empty($strukturIds)) {
                    // Find users with these struktur IDs
                    $userIds = User::whereIn('struktur_id', $strukturIds)
                        ->pluck('id')
                        ->toArray();
                    
                    if (!empty($userIds)) {
                        // Get jadwal_piket IDs for those users
                        $jadwalPiketIds = JadwalPiket::whereIn('user_id', $userIds)
                            ->pluck('id')
                            ->toArray();
                        
                        if (!empty($jadwalPiketIds)) {
                            // Filter absensi by those jadwal_piket IDs
                            $query->whereIn('jadwal_piket', $jadwalPiketIds);
                        } else {
                            // No jadwal, so return empty results
                            return $this->renderRiwayatAbsenPage([], $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes);
                        }
                    } else {
                        // No users, so return empty results
                        return $this->renderRiwayatAbsenPage([], $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes);
                    }
                } else {
                    // No struktur, so return empty results
                    return $this->renderRiwayatAbsenPage([], $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes);
                }
            }
            
            // Execute the query
            $absensiRecords = $query->orderBy('tanggal', 'desc')
                ->orderBy('jam_masuk', 'desc')
                ->get();
            
            Log::info('Found ' . $absensiRecords->count() . ' attendance records after filtering');
            
            // Map records for frontend
            $riwayatAbsensi = $absensiRecords->map(function($item) {
                try {
                    // Fix the image URL generation
                    $fotoUrl = null;
                    if ($item->foto) {
                        // First check storage disk
                        if (Storage::disk('public')->exists($item->foto)) {
                            // Use Storage::url to generate the correct URL
                            $fotoUrl = Storage::url($item->foto);
                            Log::info("Generated photo URL from storage: {$fotoUrl}");
                        } else {
                            // Check if file exists directly in public path (older images might be here)
                            $publicPath = public_path('storage/' . $item->foto);
                            if (file_exists($publicPath)) {
                                $fotoUrl = asset('storage/' . $item->foto);
                                Log::info("Generated photo URL from public path: {$fotoUrl}");
                            } else {
                                Log::warning("File not found: Storage: {$item->foto} | Public: {$publicPath}");
                            }
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
        } else {
            Log::warning('No periode found, returning empty data');
        }
        
        // Render the page with all necessary data
        return $this->renderRiwayatAbsenPage($riwayatAbsensi, $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes);
    }

    // Helper method to render the page with consistent data
    private function renderRiwayatAbsenPage($riwayatAbsensi, $periode, $tahun_id, $isSuperAdmin, $isAdmin, $periodes)
    {
        return Inertia::render('RiwayatAbsen', [
            'riwayatAbsensi' => $riwayatAbsensi,
            'periode' => $periode,
            'periodes' => $periodes, // Now properly filtered by kepengurusan_lab
            'isAdmin' => $isAdmin || $isSuperAdmin,  // Both admin and superadmin have admin privileges
            'isSuperAdmin' => $isSuperAdmin,  // Only superadmin/kadep can switch labs
            'tahunKepengurusan' => \App\Models\TahunKepengurusan::orderBy('tahun', 'desc')->get(),
            'laboratorium' => \App\Models\Laboratorium::all(),
            'currentTahunId' => $tahun_id,
        ]);
    }
    
    public function rekapAbsen(Request $request)
    {
        $user = Auth::user();
        
        // Check user roles - Only allow superadmin, kadep, and admin users to access this page
        $isSuperAdmin = $user->hasRole(['superadmin', 'kadep']);
        $isAdmin = $user->hasRole('admin');
        
        // If the user is neither superadmin nor admin, return a 403 Forbidden response
        if (!$isSuperAdmin && !$isAdmin) {
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
        if ($isAdmin && !$isSuperAdmin) {
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
                Log::info("Found kepengurusan_lab_id: {$kepengurusanLabId} for lab_id: {$lab_id} and tahun_id: {$tahun_id}");
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
            $strukturIds = Struktur::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->pluck('id')
                ->toArray();
                
            if (!empty($strukturIds)) {
                // Find users with these struktur IDs
                $users = User::whereIn('struktur_id', $strukturIds)
                    ->whereHas('jadwalPiket')
                    ->get();
                    
                Log::info('Found ' . $users->count() . ' users with jadwal piket for this kepengurusan');
                
                foreach ($users as $user) {
                    // Get user's jadwal piket IDs, filtered by this specific kepengurusan
                    $jadwalQuery = JadwalPiket::where('user_id', $user->id);
                    
                    // Ensure we only count jadwal for users in this kepengurusan
                    $jadwalQuery->whereHas('user', function($q) use ($strukturIds) {
                        $q->whereIn('struktur_id', $strukturIds);
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
            'isAdmin' => $isAdmin,
            'isSuperAdmin' => $isSuperAdmin,
            'tahunKepengurusan' => \App\Models\TahunKepengurusan::orderBy('tahun', 'desc')->get(),
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
            // Query jadwal_piket table for each day
            foreach ($days as $day) {
                $jadwalsQuery = JadwalPiket::with('user')
                    ->where('hari', $day);
                    
                // Filter by kepengurusan if needed
                if ($kepengurusanLabId) {
                    // Get struktur_ids in this kepengurusan
                    $strukturIds = Struktur::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->pluck('id')
                        ->toArray();
                        
                    if (!empty($strukturIds)) {
                        $jadwalsQuery->whereHas('user', function($q) use ($strukturIds) {
                            $q->whereIn('struktur_id', $strukturIds);
                        });
                    }
                }
                
                $jadwals = $jadwalsQuery->get();
                
                Log::info("Found {$jadwals->count()} jadwal for day: {$day}");
                
                // Map to the format expected by the frontend
                $mappedJadwals = $jadwals->map(function($jadwal) use ($periodeId) {
                    // Check attendance for this jadwal in the selected periode
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
