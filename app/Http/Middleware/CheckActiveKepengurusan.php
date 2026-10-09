<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckActiveKepengurusan
{
    public function handle(Request $request, Closure $next, ?string $modul = null)
    {
        if ($request->attributes->has('writable_kepengurusan') || $request->isMethodSafe()) {
            return $next($request);
        }

        return app(EnsureKepengurusanWritable::class)->handle($request, $next);
    }
}
