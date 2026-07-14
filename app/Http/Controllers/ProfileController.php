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

    private function isPraktikanOnly(\App\Models\User $user): bool
    {
        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'asisten', 'dosen'];
        return $user->hasRole('praktikan') && !$user->hasAnyRole($staffRoles);
    }

    public function edit(Request $request): Response
    {
        $user = $request->user();
        $isPraktikan = $this->isPraktikanOnly($user);

        $microsoftConnected = !is_null($user->microsoft_email);

        if ($isPraktikan) {
            $praktikan = \App\Models\Praktikan::where('user_id', $user->id)->first();
            return Inertia::render('Profile/Edit', [
                'mustVerifyEmail' => $user instanceof MustVerifyEmail,
                'status' => session('status'),
                'isPraktikan' => true,
                'praktikan' => $praktikan ? [
                    'nim'   => $praktikan->nim,
                    'nama'  => $praktikan->nama,
                    'no_hp' => $praktikan->no_hp,
                ] : null,
                'microsoftConnected' => $microsoftConnected,
                'microsoftEmail' => $user->microsoft_email,
            ]);
        }

        $staffRoles = ['admin', 'superadmin', 'kadep', 'kalab', 'dosen'];
        $isAsisten = $user->hasRole('asisten') && !$user->hasAnyRole($staffRoles);
        $profile = $user->profile;
        $needsCompletion = $isAsisten && empty($profile?->no_hp);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'isPraktikan' => false,
            'needsCompletion' => $needsCompletion,
            'profile' => $profile ? [
                'nomor_induk' => $profile->nomor_induk,
                'nomor_anggota' => $profile->nomor_anggota,
                'jenis_kelamin' => $profile->jenis_kelamin,
                'foto_profile' => $profile->foto_profile ? Storage::url($profile->foto_profile) : null,
                'tanda_tangan' => $profile->tanda_tangan ? Storage::url($profile->tanda_tangan) : null,
                'alamat' => $profile->alamat,
                'no_hp' => $profile->no_hp,
                'tempat_lahir' => $profile->tempat_lahir,
                'tanggal_lahir' => $profile->tanggal_lahir,
            ] : null,
            'microsoftConnected' => $microsoftConnected,
            'microsoftEmail' => $user->microsoft_email,
        ]);
    }


    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($this->isPraktikanOnly($user)) {
            $request->validate(['no_hp' => ['required', 'string', 'max:20']]);

            \App\Models\Praktikan::where('user_id', $user->id)
                ->update(['no_hp' => $request->no_hp]);

            return Redirect::route('profile.edit')->with('status', 'profile-updated');
        }

        $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'jenis_kelamin' => ['required', 'string', 'in:laki-laki,perempuan'],
            'nomor_induk'   => ['required', 'string', 'max:50'],
            'nomor_anggota' => ['nullable', 'string', 'max:50'],
            'alamat'        => ['nullable', 'string', 'max:500'],
            'no_hp'         => ['nullable', 'string', 'max:15'],
            'tempat_lahir'  => ['nullable', 'string', 'max:100'],
            'tanggal_lahir' => ['nullable', 'date'],
            'foto_profile'  => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'tanda_tangan'  => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $user->fill($request->only('name'));
        $user->save();

        $profile = $user->profile;
        $profileData = $request->only(['jenis_kelamin', 'nomor_induk', 'nomor_anggota', 'alamat', 'no_hp', 'tempat_lahir', 'tanggal_lahir']);

        if ($request->hasFile('foto_profile')) {
            if ($profile?->foto_profile && Storage::disk('public')->exists($profile->foto_profile)) {
                Storage::disk('public')->delete($profile->foto_profile);
            }
            $profileData['foto_profile'] = $request->file('foto_profile')->store('profile-photos', 'public');
        }

        if ($request->hasFile('tanda_tangan')) {
            if ($profile?->tanda_tangan && Storage::disk('public')->exists($profile->tanda_tangan)) {
                Storage::disk('public')->delete($profile->tanda_tangan);
            }
            $profileData['tanda_tangan'] = $request->file('tanda_tangan')->store('tanda-tangan', 'public');
        }

        if ($profile) {
            $profile->update($profileData);
        } else {
            $user->profile()->create(array_merge($profileData, ['user_id' => $user->id]));
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }


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
