<?php

namespace App\Http\Middleware;

use App\Models\Praktikan;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePraktikanProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Izinkan akses ke route profile dan auth
        if ($request->routeIs('profile.*', 'logout', 'password.*', 'verification.*')) {
            return $next($request);
        }

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'dosen'];
        $isPraktikanOnly = $user->hasRole('praktikan') && !$user->hasAnyRole(array_merge($staffRoles, ['asisten']));

        if ($isPraktikanOnly) {
            $praktikan = Praktikan::where('user_id', $user->id)->first();
            if (!$praktikan || empty($praktikan->no_hp)) {
                return redirect()->route('profile.edit')
                    ->with('warning', 'Lengkapi nomor HP Anda sebelum mengakses halaman lain.');
            }
        }

        if ($user->hasRole('asisten') && !$user->hasAnyRole($staffRoles)) {
            $profile = $user->profile;
            if (!$profile || empty($profile->no_hp)) {
                return redirect()->route('profile.edit')
                    ->with('warning', 'Lengkapi nomor HP Anda sebelum mengakses halaman lain.');
            }
        }

        return $next($request);
    }
}
