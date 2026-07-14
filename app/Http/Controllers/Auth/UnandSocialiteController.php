<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class UnandSocialiteController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('unand')->redirect();
    }

    public function callback()
    {
        try {
            $unandUser = Socialite::driver('unand')->user();
        } catch (\Exception $e) {
            Log::error('Unand SSO callback error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Gagal autentikasi dengan SSO Unand. Silakan coba lagi.');
        }

        $user = User::where('email', $unandUser->email)->first();

        if (!$user) {
            // Buat user baru jika tidak ada
            $user = User::create([
                'name'  => $unandUser->name,
                'email' => $unandUser->email,
                // tambahkan field lain jika diperlukan, misal unand_id
            ]);
        }

        // Login user
        Auth::login($user);

        // Redirect logic, sesuaikan dengan logic yang ada di MicrosoftSocialiteController
        if ($user->roles()->count() === 0) {
            return redirect()->route('pending.approval');
        }

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
        if ($user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles)) {
            return redirect()->intended(route('praktikan.daftar-tugas', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
