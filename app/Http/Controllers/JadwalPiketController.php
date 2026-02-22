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
    // Note: Authorization handled via route middleware

    /**
     * Show attendance schedule page (Jadwal Piket)
     */
    public function index(Request $request)
    {
        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        // Get all labs for dropdown
        $laboratorium = Laboratorium::all();

        $kepengurusanLab = null;
        $tahunKepengurusan = collect();

        // Try to get kepengurusan_lab by ID first (most efficient)
        if ($kepengurusan_lab_id) {
            $kepengurusanLab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanLab) {
                $lab_id = $kepengurusanLab->laboratorium_id;
                $tahun_id = $kepengurusanLab->tahun_kepengurusan_id;
            }
        }
        // Fallback: lookup by lab_id + tahun_id
        elseif ($lab_id) {
            // If no year selected, use active year
            if (!$tahun_id) {
                $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
                $tahun_id = $tahunAktif ? $tahunAktif->id : null;
            }

            if ($tahun_id) {
                $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        // Get years for dropdown (only for the selected lab)
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
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
                    'kepengurusan_lab_id' => null,
                ]
            ]);
        }

        // Move users query here, after we confirm kepengurusanLab exists
        $users = User::whereHas('kepengurusan', function ($query) use ($kepengurusanLab) {
            $query->where('kepengurusan_lab_id', $kepengurusanLab->id)
                  ->whereHas('struktur', function($q) {
                      $q->whereHas('defaultRole', function($r) {
                          $r->where('name', 'like', '%asisten%');
                      });
                  });
        })

        ->get();

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
            ->whereHas('kepengurusan', function($query) use ($kepengurusanLab) {
                $query->where('kepengurusan_lab_id', $kepengurusanLab->id)
                      ->whereHas('struktur', function($q) {
                          $q->whereHas('defaultRole', function($r) {
                             $r->where('name', 'like', '%asisten%');
                          });
                      });
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
                'kepengurusan_lab_id' => $kepengurusanLab ? $kepengurusanLab->id : null,
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
            $request->validate([
                'user_ids'            => 'required|array|min:1',
                'user_ids.*'          => 'required|exists:users,id',
                'hari'                => 'required|in:senin,selasa,rabu,kamis,jumat',
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            ]);

            $kepengurusanLab = \App\Models\KepengurusanLab::findOrFail($request->kepengurusan_lab_id);

            $added   = 0;
            $skipped = [];

            foreach ($request->user_ids as $userId) {
                // Verify the user is an assistant in this kepengurusan
                $user = User::whereHas('kepengurusan', function ($query) use ($kepengurusanLab) {
                    $query->where('kepengurusan_lab_id', $kepengurusanLab->id)
                          ->whereHas('struktur', function ($q) {
                              $q->whereHas('defaultRole', function ($r) {
                                  $r->where('name', 'like', '%asisten%');
                              });
                          });
                })->find($userId);

                if (!$user) {
                    $skipped[] = 'User ' . $userId . ' bukan asisten';
                    continue;
                }

                // Skip if already assigned this day
                $existing = JadwalPiket::where('user_id', $userId)
                    ->where('hari', $request->hari)
                    ->where('kepengurusan_lab_id', $request->kepengurusan_lab_id)
                    ->first();

                if ($existing) {
                    $skipped[] = $user->name . ' sudah dijadwalkan pada hari ini';
                    continue;
                }

                JadwalPiket::create([
                    'user_id'             => $userId,
                    'hari'                => $request->hari,
                    'kepengurusan_lab_id' => $request->kepengurusan_lab_id,
                ]);
                $added++;
            }

            if ($added === 0) {
                return back()->with('error', 'Tidak ada jadwal yang ditambahkan. ' . implode(', ', $skipped));
            }

            $msg = $added . ' jadwal piket berhasil ditambahkan.';
            if (count($skipped)) {
                $msg .= ' Dilewati: ' . implode(', ', $skipped);
            }

            return redirect()->route('piket.jadwal.index', [
                'lab_id'   => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id'),
            ])->with('success', $msg);
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

            // Verify user belongs to this laboratory
            $kepengurusanLab = \App\Models\KepengurusanLab::findOrFail($jadwalPiket->kepengurusan_lab_id);
            $user = User::whereHas('kepengurusan', function($query) use ($kepengurusanLab) {
                $query->where('kepengurusan_lab_id', $kepengurusanLab->id)
                      ->whereHas('struktur', function($q) {
                          $q->whereHas('defaultRole', function($r) {
                              $r->where('name', 'like', '%asisten%');
                          });
                      });
            })

            ->find($validated['user_id']);

            if (!$user) {
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
