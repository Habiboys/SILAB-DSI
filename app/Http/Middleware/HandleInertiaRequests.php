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
            $canSelectLab = $user->hasAnyRole([ 'admin', 'kadep']);
            
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
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'can_select_lab' => $canSelectLab,
                    'laboratory_id' => $user->laboratory_id,
                    'laboratory' => $userLab,
                    'praktikumAslab' => $user->praktikumAslab()->withPivot('catatan')->get()->toArray(),
                    'profile' => $userProfile
                ] : null,
            ],
            'laboratorium' => $laboratoriumData
        ]);
    }
}
