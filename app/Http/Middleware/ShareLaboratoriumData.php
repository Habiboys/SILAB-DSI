<?php

namespace App\Http\Middleware;

use Inertia\Inertia;
use Closure;
use App\Models\Laboratorium; // Pastikan model ini digunakan

class ShareLaboratoriumData
{
    public function handle($request, Closure $next)
    {
        // Ambil semua laboratorium dari database
        $laboratorium = Laboratorium::select('id', 'nama', 'logo')->get();

        // Bagikan data ke semua halaman Inertia
        Inertia::share('laboratorium', $laboratorium);

        return $next($request);
    }
}
