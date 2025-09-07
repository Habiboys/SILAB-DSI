<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AslabPraktikum;
use App\Models\Praktikum;
use App\Models\User;
use Inertia\Inertia;

class AslabPraktikumController extends Controller
{
    public function index($praktikumId)
    {
        $praktikum = Praktikum::with(['aslabPraktikum.user', 'kepengurusanLab.laboratorium'])->findOrFail($praktikumId);
        
        // Get aslab users who are active in this lab's kepengurusan
        $asistenUsers = User::role('asisten')
            ->whereHas('kepengurusanAktif', function($query) use ($praktikum) {
                $query->where('kepengurusan_lab_id', $praktikum->kepengurusan_lab_id);
            })
            // Exclude users who are already praktikan in this praktikum
            ->whereDoesntHave('praktikan.praktikanPraktikums', function($query) use ($praktikumId) {
                $query->where('praktikum_id', $praktikumId);
            })
            ->with(['kepengurusanAktif' => function($query) use ($praktikum) {
                $query->where('kepengurusan_lab_id', $praktikum->kepengurusan_lab_id);
            }, 'laboratory', 'profile'])
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nim' => $user->profile->nomor_induk ?? 'N/A'
                ];
            });
        
        return Inertia::render('AslabPraktikum/Index', [
            'praktikum' => $praktikum,
            'asistenUsers' => $asistenUsers,
            'currentAslab' => $praktikum->aslabPraktikum->load('user.profile')
  
        ]);
    }

    public function store(Request $request, $praktikumId)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'catatan' => 'nullable|string'
        ]);

        // Check if user already assigned as aslab
        $existing = AslabPraktikum::where('praktikum_id', $praktikumId)
            ->where('user_id', $request->user_id)
            ->first();

        if ($existing) {
            return back()->withErrors(['user_id' => 'Aslab sudah ditugaskan ke praktikum ini']);
        }

        // Check if user is already a praktikan in this praktikum
        $isPraktikan = \App\Models\Praktikan::where('user_id', $request->user_id)
            ->whereHas('praktikanPraktikums', function($query) use ($praktikumId) {
                $query->where('praktikum_id', $praktikumId);
            })
            ->exists();

        if ($isPraktikan) {
            return back()->withErrors(['user_id' => 'User ini sudah terdaftar sebagai praktikan di praktikum ini']);
        }

        AslabPraktikum::create([
            'praktikum_id' => $praktikumId,
            'user_id' => $request->user_id,
            'catatan' => $request->catatan
        ]);

        return redirect()->back();
    }

    public function update(Request $request, $praktikumId, $aslabId)
    {
        $request->validate([
            'catatan' => 'nullable|string'
        ]);

        $aslabPraktikum = AslabPraktikum::where('praktikum_id', $praktikumId)
            ->where('id', $aslabId)
            ->firstOrFail();

        $aslabPraktikum->update([
            'catatan' => $request->catatan
        ]);

        return redirect()->back();
    }

    public function destroy($praktikumId, $aslabId)
    {
        $aslabPraktikum = AslabPraktikum::where('praktikum_id', $praktikumId)
            ->where('id', $aslabId)
            ->firstOrFail();

        $aslabPraktikum->delete();

        return redirect()->back();
    }
}
