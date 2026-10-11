<?php

namespace App\Http\Controllers;

use App\Models\Laboratorium;
use App\Models\Sertifikat;
use App\Models\Praktikum;
use App\Services\KepengurusanAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

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
        $user = $request->user();
        $currentLab = $user->getCurrentLab() ?? [];
        $query = Sertifikat::with([
            'user',
            'praktikum',
            'kepengurusanLab.laboratorium',
        ]);
        if (empty($currentLab['all_access'])) {
            if ($user->hasAnyRole(['admin', 'kalab', 'asisten'])) {
                $labId = $currentLab['laboratorium']->id ?? $user->access_lab_id;
                abort_unless($labId, 403);
                $query->where(function ($scope) use ($labId) {
                    $scope->whereHas('kepengurusanLab', fn ($period) => $period->where('laboratorium_id', $labId))
                        ->orWhereHas('praktikum.kepengurusanLab', fn ($period) => $period->where('laboratorium_id', $labId));
                });
            } else {
                $query->where('user_id', $user->id);
            }
        }

        $selectedPeriod = KepengurusanAccess::selected($request);
        $selectedLabId = $selectedPeriod?->laboratorium_id ?? $request->input('lab_id');
        if ($selectedPeriod) {
            $query->where(function ($scope) use ($selectedPeriod) {
                $scope->where('kepengurusan_lab_id', $selectedPeriod->id)
                    ->orWhere(function ($fallback) use ($selectedPeriod) {
                        $fallback->whereNull('kepengurusan_lab_id')
                            ->whereHas('praktikum', fn ($praktikum) => $praktikum->where('kepengurusan_lab_id', $selectedPeriod->id));
                    });
            });
        } elseif ($selectedLabId) {
            $query->where(function ($scope) use ($selectedLabId) {
                $scope->whereHas('kepengurusanLab', fn ($period) => $period->where('laboratorium_id', $selectedLabId))
                    ->orWhereHas('praktikum.kepengurusanLab', fn ($period) => $period->where('laboratorium_id', $selectedLabId));
            });
        }

        $visible = clone $query;

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

        $visiblePeriodIds = (clone $visible)->pluck('kepengurusan_lab_id')->filter()
            ->merge(Praktikum::whereIn('id', (clone $visible)->pluck('praktikum_id'))->pluck('kepengurusan_lab_id'))->unique();
        $laboratories = Laboratorium::whereHas('kepengurusanLab', fn ($period) => $period->whereIn('id', $visiblePeriodIds))->orderBy('nama')->get(['id', 'nama']);
        $praktikums = Praktikum::whereIn('id', (clone $visible)->pluck('praktikum_id'))->orderBy('mata_kuliah')->get(['id', 'mata_kuliah']);

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
        if ($sertifikat->user_id !== $user->id) {
            $currentLab = $user->getCurrentLab() ?? [];
            if (empty($currentLab['all_access'])) {
                $period = $sertifikat->kepengurusanLab ?? $sertifikat->praktikum?->kepengurusanLab;
                $labId = $currentLab['laboratorium']->id ?? $user->access_lab_id;
                abort_unless($user->hasAnyRole(['admin', 'kalab', 'asisten']) && $user->can('sertifikat.view')
                    && $period && $labId && (string) $period->laboratorium_id === (string) $labId, 403, 'Unauthorized access.');
            }
        }

        $disk = Storage::disk('private')->exists($sertifikat->file_path) ? 'private' : 'public';
        if (!Storage::disk($disk)->exists($sertifikat->file_path)) {
            return redirect()->back()->with('error', 'File sertifikat tidak ditemukan.');
        }

        return Storage::disk($disk)->download($sertifikat->file_path);
    }
}
