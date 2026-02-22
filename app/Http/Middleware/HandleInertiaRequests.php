<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Laboratorium;
use Illuminate\Support\Facades\Storage;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $canSelectLab = false;
        $userLab = null;

        if ($user) {
            // Superadmin, kadep, and admin can select lab
            $canSelectLab = $user->hasAnyRole(['superadmin', 'admin', 'kadep']);

            // Get user's laboratory data using getCurrentLab method
            $currentLab = $user->getCurrentLab();

            if ($currentLab && !isset($currentLab['all_access'])) {
                $userLab = $currentLab['laboratorium'];
                // Ensure consistent field names
                if ($userLab) {
                    $userLab = [
                        'id' => $userLab->id,
                        'nama' => $userLab->nama,
                        'nama_lab' => $userLab->nama, // Add alias for compatibility
                        'logo' => $userLab->logo
                    ];
                }
            } else if (isset($currentLab['all_access']) && $currentLab['all_access'] === true) {
                // For superadmin/kadep, determine the active lab from request or fallback
                $activeLabId = $request->input('lab_id') ?? $user->access_lab_id;

                if ($activeLabId) {
                    $labModel = Laboratorium::find($activeLabId);
                } else {
                    $labModel = Laboratorium::first();
                }

                if ($labModel) {
                    $userLab = [
                        'id' => $labModel->id,
                        'nama' => $labModel->nama,
                        'nama_lab' => $labModel->nama,
                        'logo' => $labModel->logo
                    ];
                } else {
                    $userLab = null;
                }
            } else {
                $userLab = null;
            }
        }

        $laboratoriumData = Laboratorium::select('id', 'nama', 'logo')->get()->map(function($lab) {
            return [
                'id' => $lab->id,
                'nama' => $lab->nama,
                'nama_lab' => $lab->nama, // Add alias for compatibility
                'logo' => $lab->logo
            ];
        });

        // Get user profile data
        $userProfile = null;
        if ($user && $user->profile) {
            $userProfile = [
                'foto_profile' => $user->profile->foto_profile ? Storage::url($user->profile->foto_profile) : null,
                'nomor_induk' => $user->profile->nomor_induk,
                'nomor_anggota' => $user->profile->nomor_anggota,
                'jenis_kelamin' => $user->profile->jenis_kelamin,
                'alamat' => $user->profile->alamat,
                'no_hp' => $user->profile->no_hp,
                'tempat_lahir' => $user->profile->tempat_lahir,
                'tanggal_lahir' => $user->profile->tanggal_lahir,
            ];
        }

        return array_merge(parent::share($request), [
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'), // NEW: For frontend permission checking
                    'current_position' => $user->getCurrentJabatan(), // NEW: For position-based UI
                    'is_kalab' => $user->isKalab(), // NEW: Quick check for kalab
                    'struktur_aktif' => $user->struktur_aktif, // NEW: For struktur-based permission UI
                    'can_select_lab' => $canSelectLab,
                    'access_lab_id' => $user->access_lab_id, // Renamed
                    'laboratory' => $userLab,
                    'praktikumAslab' => $user->praktikumAslab()->withPivot('catatan')->get()->toArray(),
                    'profile' => $userProfile
                ] : null,
            ],
            'laboratorium' => $laboratoriumData,
            'selected_kepengurusan' => function () use ($request, $userLab) {
                if (!$userLab) return null;

                $requestedId = $request->input('kepengurusan_lab_id');

                // If present in request, update session
                if ($requestedId) {
                    session(['active_kepengurusan_lab_id' => $requestedId]);
                } else {
                    // Try session
                    $requestedId = session('active_kepengurusan_lab_id');
                }

                $target = null;

                if ($requestedId) {
                    $target = \App\Models\KepengurusanLab::with('tahunKepengurusan')
                        ->where('laboratorium_id', $userLab['id'])
                        ->find($requestedId);
                }

                if (!$target) {
                    $target = \App\Models\KepengurusanLab::where('laboratorium_id', $userLab['id'])
                        ->whereHas('tahunKepengurusan', function($query) {
                            $query->where('isactive', 1);
                        })
                        ->with('tahunKepengurusan')
                        ->first();

                    // Update session with fallback
                    if ($target) {
                        session(['active_kepengurusan_lab_id' => $target->id]);
                    }
                }

                // Final fallback: pick the most recent kepengurusan even if no period is active
                if (!$target) {
                    $target = \App\Models\KepengurusanLab::where('laboratorium_id', $userLab['id'])
                        ->with('tahunKepengurusan')
                        ->join('tahun_kepengurusan', 'kepengurusan_lab.tahun_kepengurusan_id', '=', 'tahun_kepengurusan.id')
                        ->orderByDesc('tahun_kepengurusan.tahun')
                        ->orderByDesc('tahun_kepengurusan.id')
                        ->select('kepengurusan_lab.*')
                        ->first();

                    if ($target) {
                        session(['active_kepengurusan_lab_id' => $target->id]);
                    }
                }

                if ($target) {
                    return [
                        'id' => $target->id,
                        'tahun' => $target->tahunKepengurusan->tahun,
                        'semester' => $target->tahunKepengurusan->semester,
                        'is_active' => $target->tahunKepengurusan->isactive,
                        'label' => $target->tahunKepengurusan->tahun . ' ' . $target->tahunKepengurusan->semester,
                        'is_read_only' => $target->tahunKepengurusan->isactive != 1
                    ];
                }

                return null;
            },
            'kepengurusan_list' => function () use ($request, $userLab) {
                if (!$userLab) return [];
                return \App\Models\KepengurusanLab::where('laboratorium_id', $userLab['id'])
                    ->with('tahunKepengurusan')
                    ->get()
                    ->map(function ($k) {
                        return [
                            'id' => $k->id,
                            'tahun' => $k->tahunKepengurusan->tahun,
                            'semester' => $k->tahunKepengurusan->semester,
                            'is_active' => $k->tahunKepengurusan->isactive,
                            'label' => $k->tahunKepengurusan->tahun . ' ' . $k->tahunKepengurusan->semester
                        ];
                    })
                    ->sortByDesc('tahun')
                    ->values()
                    ->toArray();
            }
        ]);
    }
}
