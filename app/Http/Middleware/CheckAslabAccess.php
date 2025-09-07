<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Praktikum;

class CheckAslabAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        
        // Allow admin, superadmin, kalab, and kadep to access
        if ($user->hasAnyRole(['admin', 'superadmin', 'kalab', 'kadep'])) {
            return $next($request);
        }
        
        // Check if user is aslab and assigned to this praktikum
        $praktikumId = $request->route('praktikum');
        
        if ($praktikumId && $user->hasRole('asisten')) {
            $isAssignedAslab = $user->praktikumAslab()
                ->where('praktikum_id', $praktikumId)
                ->exists();
                
            if ($isAssignedAslab) {
                return $next($request);
            }
        }
        
        // For routes that don't have praktikum parameter, allow asisten role
        if ($user->hasRole('asisten')) {
            return $next($request);
        }
        
        abort(403, 'Unauthorized access. You are not assigned as aslab for this praktikum.');
    }
}
