<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckLabAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        $currentLab = $user->getCurrentLab();
        
        // Allow superadmin and kadep to access all labs
        if (isset($currentLab['all_access'])) {
            return $next($request);
        }

        // Check if user has access to the requested lab
        $requestedLabId = $request->input('lab_id');
        if ($requestedLabId && $user->laboratory_id != $requestedLabId) {
            abort(403, 'Unauthorized laboratory access');
        }

        return $next($request);
    }
}