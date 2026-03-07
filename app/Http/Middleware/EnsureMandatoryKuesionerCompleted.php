<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\Kuesioner;
use App\Models\ResponKuesioner;

class EnsureMandatoryKuesionerCompleted
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // 1. Exclude specific routes to avoid infinite loops and allow submission
        $excludedRoutes = [
            'kuesioner.participate', // To view the questionnaire
            'kuesioner.submit',      // To submit the questionnaire
            'logout',                // To allow logout
        ];

        if (in_array($request->route()->getName(), $excludedRoutes)) {
            return $next($request);
        }

        // 2. Find mandatory, active questionnaires that this user has NOT responded to
        //    AND that target the user (or global)
        $pendingKuesioner = Kuesioner::where('is_active', true)
            ->where('is_mandatory', true)
            ->whereDoesntHave('respon', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get()
            ->filter(function ($kuesioner) use ($user) {
                // Check targeting logic
                if ($kuesioner->target->isEmpty()) {
                    return true; // No target implies global (or you can define it as no one, but usually global)
                }

                // If has targets, check if user matches any role
                $targetRoles = $kuesioner->target->load('role')->pluck('role.name')->filter()->toArray();
                if (!empty($targetRoles)) {
                    return $user->hasRole($targetRoles);
                }

                return false;
            })
            ->first();

        // 3. If found, redirect to that questionnaire
        if ($pendingKuesioner) {
            return redirect()->route('kuesioner.participate', $pendingKuesioner->id)
                ->with('error', 'Anda harus mengisi kuesioner wajib ini sebelum melanjutkan.');
        }

        return $next($request);
    }
}
