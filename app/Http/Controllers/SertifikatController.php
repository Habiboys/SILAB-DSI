<?php

namespace App\Http\Controllers;

use App\Models\Sertifikat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SertifikatController extends Controller
{
    /**
     * Display a listing of user's certificates.
     */
    public function index()
    {
        $user = Auth::user();
        
        $sertifikats = Sertifikat::where('user_id', $user->id)
            ->with(['kepengurusanLab.laboratorium', 'praktikum'])
            ->orderBy('tanggal_terbit', 'desc')
            ->get();

        return Inertia::render('Sertifikat/MyCertificates', [
            'sertifikats' => $sertifikats
        ]);
    }

    /**
     * Download certificate file.
     */
    public function download(Sertifikat $sertifikat)
    {
        // Authorization: User owns the certificate OR User is Admin
        $user = Auth::user();
        if ($sertifikat->user_id !== $user->id && !$user->hasRole(['admin', 'superadmin', 'asisten', 'kadep'])) {
             abort(403, 'Unauthorized access.');
        }

        if (!Storage::disk('public')->exists($sertifikat->file_path)) {
            return redirect()->back()->with('error', 'File sertifikat tidak ditemukan.');
        }

        return Storage::disk('public')->download($sertifikat->file_path);
    }
}
