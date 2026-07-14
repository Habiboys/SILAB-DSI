<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class MicrosoftSocialiteController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('microsoft')->redirect();
    }

    public function callback()
    {
        try {
            $microsoftUser = Socialite::driver('microsoft')->user();
        } catch (\Exception $e) {
            Log::error('Microsoft SSO callback error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Gagal autentikasi dengan Microsoft. Silakan coba lagi.');
        }

        $user = User::where('email', $microsoftUser->email)->first();

        if (!$user) {
            $user = User::create([
                'name'  => $microsoftUser->name ?? $microsoftUser->email,
                'email' => $microsoftUser->email,
            ]);
        }

        // Simpan microsoft_email jika belum ada
        if (!$user->microsoft_email) {
            $user->update(['microsoft_email' => $microsoftUser->email]);
        }

        Auth::login($user);

        if ($user->roles()->count() === 0) {
            return redirect()->route('pending.approval');
        }

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
        if ($user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles)) {
            return redirect()->intended(route('praktikan.daftar-tugas', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * User yang sudah login ingin menghubungkan akun Microsoft.
     */
    public function linkRedirect()
    {
        session(['microsoft_link' => true]);
        return Socialite::driver('microsoft')->redirect();
    }

    public function linkCallback(Request $request)
    {
        try {
            $microsoftUser = Socialite::driver('microsoft')->user();
        } catch (\Exception $e) {
            Log::error('Microsoft SSO link callback error: ' . $e->getMessage());
            return redirect()->route('profile.edit')->with('error', 'Gagal menghubungkan akun Microsoft. Silakan coba lagi.');
        }

        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Cek apakah email microsoft sudah dipakai user lain
        $existing = User::where('microsoft_email', $microsoftUser->email)
            ->where('id', '!=', $user->id)
            ->first();

        if ($existing) {
            return redirect()->route('profile.edit')
                ->with('error', 'Akun Microsoft ini sudah terhubung dengan pengguna lain.');
        }

        $user->update([
            'microsoft_email' => $microsoftUser->email,
        ]);

        return redirect()->route('profile.edit')->with('status', 'Akun Microsoft berhasil dihubungkan.');
    }

    public function unlink(Request $request)
    {
        $user = $request->user();
        $user->update(['microsoft_email' => null]);

        return redirect()->route('profile.edit')->with('status', 'Akun Microsoft berhasil diputuskan.');
    }
}
