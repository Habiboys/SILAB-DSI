<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckLabAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $currentLab = $user->getCurrentLab();
        
        // Allow superadmin and kadep to access all labs
        if (isset($currentLab['all_access'])) {
            return $next($request);
        }

        $context = \App\Services\NavigationContext::forRequest($request);
        $userLabId = $currentLab['laboratorium']->id ?? $user->access_lab_id;
        if (isset($context['lab_id']) && $userLabId && (string) $context['lab_id'] !== (string) $userLabId) {
            abort(403, 'Unauthorized laboratory access');
        }

        // Check if user has access to the requested lab
        $requestedLabId = $request->input('lab_id');
        
        // 1. Direct Field Check (Admin/Special)
        if ($user->access_lab_id && $user->access_lab_id == $requestedLabId) {
            return $next($request);
        }

        // 2. Kepengurusan Check (Standard)
        // getCurrentLab logic already handles looking up active kepengurusan
        $currentLab = $user->getCurrentLab();
        
        if ($requestedLabId) {
            $userLabId = $currentLab['laboratorium']->id ?? null;
            if ($userLabId != $requestedLabId) {
                abort(403, 'Unauthorized laboratory access');
            }
        }

        return $next($request);
    }
}
