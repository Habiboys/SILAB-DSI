<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile;
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'profile' => $profile ? [
                'nomor_induk' => $profile->nomor_induk,
                'nomor_anggota' => $profile->nomor_anggota,
                'jenis_kelamin' => $profile->jenis_kelamin,
                'foto_profile' => $profile->foto_profile ? Storage::url($profile->foto_profile) : null,
                'alamat' => $profile->alamat,
                'no_hp' => $profile->no_hp,
                'tempat_lahir' => $profile->tempat_lahir,
                'tanggal_lahir' => $profile->tanggal_lahir,
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // Debug: log data yang diterima
        \Log::info('Profile update request data:', $request->all());
        
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Handle profile data update
        $profile = $user->profile;
        
        if ($profile) {
            // Update existing profile (nomor_induk dan nomor_anggota tidak bisa diubah)
            $profileData = $request->only([
                'jenis_kelamin', 'alamat', 'no_hp', 'tempat_lahir', 'tanggal_lahir'
            ]);
            
            // Handle profile photo update
            if ($request->hasFile('foto_profile')) {
                // Delete old photo if exists
                if ($profile->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
                    Storage::disk('public')->delete($profile->foto_profile);
                }
                
                // Store new photo
                $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
                $profileData['foto_profile'] = $fotoPath;
            }
            
            $profile->update($profileData);
        } else {
            // Create new profile if doesn't exist (nomor_induk dan nomor_anggota tidak bisa diubah)
            $profileData = $request->only([
                'jenis_kelamin', 'alamat', 'no_hp', 'tempat_lahir', 'tanggal_lahir'
            ]);
            $profileData['user_id'] = $user->id;
            
            // Handle profile photo
            if ($request->hasFile('foto_profile')) {
                $fotoPath = $request->file('foto_profile')->store('profile-photos', 'public');
                $profileData['foto_profile'] = $fotoPath;
            }
            
            $user->profile()->create($profileData);
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
