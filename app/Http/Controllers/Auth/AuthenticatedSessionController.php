<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{

    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }


    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = auth()->user();

        // Jika user belum punya role, arahkan ke halaman pending approval
        if ($user->roles()->count() === 0) {
            return redirect()->route('pending.approval');
        }

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
        if ($user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles)) {
            return redirect()->intended(route('praktikan.daftar-tugas', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }


    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
