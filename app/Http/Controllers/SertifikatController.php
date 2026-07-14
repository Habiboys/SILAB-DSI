<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use App\Models\Sertifikat;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SertifikatController extends Controller
{

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

    public function indexAll(Request $request)
    {
        $query = Sertifikat::with([
            'user',
            'praktikum',
            'kepengurusanLab.laboratorium',
        ]);

        // Filter search by user name/email
        if ($search = $request->search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter jenis_sertifikat
        if ($jenis = $request->jenis_sertifikat) {
            $query->where('jenis_sertifikat', $jenis);
        }

        // Filter lab
        if ($labId = $request->laboratory_id) {
            $query->whereHas('kepengurusanLab', function ($q) use ($labId) {
                $q->where('laboratorium_id', $labId);
            });
        }

        // Filter praktikum
        if ($praktikumId = $request->praktikum_id) {
            $query->where('praktikum_id', $praktikumId);
        }

        // Filter range tanggal
        if ($tglAwal = $request->tanggal_awal) {
            $query->whereDate('tanggal_terbit', '>=', $tglAwal);
        }
        if ($tglAkhir = $request->tanggal_akhir) {
            $query->whereDate('tanggal_terbit', '<=', $tglAkhir);
        }

        $perPage = min((int) ($request->perPage ?? 15), 100);

        $sertifikats = $query->orderBy('tanggal_terbit', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $laboratories = Laboratorium::orderBy('nama')->get(['id', 'nama']);
        $praktikums = Praktikum::orderBy('mata_kuliah')->get(['id', 'mata_kuliah']);

        return Inertia::render('Sertifikat/Index', [
            'sertifikats' => $sertifikats,
            'laboratories' => $laboratories,
            'praktikums' => $praktikums,
            'filters' => $request->only([
                'search', 'jenis_sertifikat', 'laboratory_id',
                'praktikum_id', 'tanggal_awal', 'tanggal_akhir', 'perPage',
            ]),
        ]);
    }

    public function download(Sertifikat $sertifikat)
    {

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
