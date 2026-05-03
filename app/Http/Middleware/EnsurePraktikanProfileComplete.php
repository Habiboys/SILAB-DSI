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

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
        $isPraktikanOnly = $user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles);

        if (!$isPraktikanOnly) {
            return $next($request);
        }

        // Izinkan akses ke route profile dan auth
        if ($request->routeIs('profile.*', 'logout', 'password.*', 'verification.*')) {
            return $next($request);
        }

        $praktikan = Praktikan::where('user_id', $user->id)->first();

        if (!$praktikan || empty($praktikan->no_hp)) {
            return redirect()->route('profile.edit')
                ->with('warning', 'Lengkapi nomor HP Anda sebelum mengakses halaman lain.');
        }

        return $next($request);
    }
}
