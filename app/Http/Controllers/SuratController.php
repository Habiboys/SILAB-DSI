<?php

namespace App\Http\Controllers;

use App\Models\Surat;
use App\Models\User;
use App\Models\KepengurusanUser;
use App\Models\Struktur;
use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SuratController extends Controller
{



    public function createSurat()
    {
        $authId = Auth::id();

        $penerima = KepengurusanUser::with([
                'user.profile',
                'struktur',
                'kepengurusanLab.laboratorium',
                'kepengurusanLab.tahunKepengurusan',
            ])
            ->where('user_id', '!=', $authId)
            ->get()
            ->groupBy('user_id')
            ->map(function ($keps) {

                $kep = $keps->firstWhere('is_active', true)
                       ?? $keps->sortByDesc('created_at')->first();

                if (!$kep?->user) return null;

                $allLabs   = $keps->map(fn($k) => $k->kepengurusanLab?->laboratorium?->nama)->filter()->unique()->values()->toArray();
                $allTahuns = $keps->map(fn($k) => (string)($k->kepengurusanLab?->tahunKepengurusan?->tahun ?? ''))->filter()->unique()->values()->toArray();

                return [
                    'id'          => $kep->user->id,
                    'name'        => $kep->user->name,
                    'email'       => $kep->user->email,
                    'nomor_induk' => $kep->user->profile?->nomor_induk ?? null,
                    'jabatan'     => $kep->struktur?->struktur ?? 'Anggota',
                    'lab'         => $kep->kepengurusanLab?->laboratorium?->nama ?? '-',
                    'tahun'       => (string)($kep->kepengurusanLab?->tahunKepengurusan?->tahun ?? '-'),
                    'labs'        => $allLabs,
                    'tahuns'      => $allTahuns,
                ];
            })
            ->filter()
            ->values();

        $laboratorium      = Laboratorium::orderBy('nama')->get(['id', 'nama']);
        $tahunKepengurusan = TahunKepengurusan::orderByDesc('tahun')->get(['id', 'tahun', 'isactive']);

        $canCreateResmi = Auth::user()->can('surat.create_resmi');
        $myLabs = collect();
        if ($canCreateResmi) {
            $myLabs = KepengurusanUser::with(['kepengurusanLab.laboratorium'])
                ->where('user_id', $authId)
                ->get()
                ->map(fn($k) => $k->kepengurusanLab?->laboratorium)
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn($l) => ['id' => $l->id, 'nama' => $l->nama]);
        }

        return Inertia::render('KirimSurat', [
            'penerima'          => $penerima,
            'laboratorium'      => $laboratorium,
            'tahunKepengurusan' => $tahunKepengurusan,
            'canCreateResmi'    => $canCreateResmi,
            'myLabs'            => $myLabs,
        ]);
    }


    public function storeSurat(Request $request)
    {
        $tipe = $request->input('tipe_surat', 'pribadi');

        $rules = [
            'tipe_surat'   => 'required|in:pribadi,resmi',
            'tanggal_surat' => 'required|date',
            'perihal'      => 'required|string|max:255',
            'file'         => 'required|file|mimes:pdf|max:5120',
        ];

        if ($tipe === 'pribadi') {
            $rules['nomor_surat'] = 'required|string|max:255';
            $rules['penerima_id'] = 'required|exists:users,id';
        } else {

            $labId = $request->input('lab_id');
            $rules['lab_id']      = 'required|exists:laboratorium,id';
            $rules['nomor_surat'] = [
                'required', 'string', 'max:255',
                Rule::unique('surat', 'nomor_surat')
                    ->where('tipe_surat', 'resmi')
                    ->where('lab_id', $labId),
            ];

            $rules['penerima_id']         = 'nullable|exists:users,id';
            $rules['penerima_nama_luar']  = 'required_without:penerima_id|nullable|string|max:255';

            if (!Auth::user()->can('surat.create_resmi')) {
                abort(403, 'Anda tidak memiliki izin untuk membuat surat resmi.');
            }
        }

        $request->validate($rules);

        try {
            $file     = $request->file('file');
            $fileName = time() . '_' . Str::slug($request->perihal) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('surat', $fileName, 'public');

            $surat = new Surat();
            $surat->nomor_surat        = $request->nomor_surat;
            $surat->tanggal_surat      = $request->tanggal_surat;
            $surat->pengirim           = Auth::id();
            $surat->penerima           = $request->penerima_id;
            $surat->perihal            = $request->perihal;
            $surat->file               = $filePath;
            $surat->isread             = false;
            $surat->tipe_surat         = $tipe;
            $surat->lab_id             = $tipe === 'resmi' ? $request->lab_id : null;
            $surat->penerima_nama_luar = $tipe === 'resmi' ? $request->penerima_nama_luar : null;
            $surat->save();

            return redirect()->route('surat.kirim')->with('message', 'Surat berhasil dikirim');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengirim surat: ' . $e->getMessage())->withInput();
        }
    }


    public function suratMasuk(Request $request)
    {
        $query = Surat::where('penerima', Auth::id())
            ->with(['pengirim']);

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_surat', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
            });
        }

        if ($request->has('tanggal') && !empty($request->tanggal)) {
            $query->whereDate('tanggal_surat', $request->tanggal);
        }

        $suratMasuk = $query->orderBy('tanggal_surat', 'desc')->get();

        return Inertia::render('SuratMasuk', [
            'suratMasuk' => $suratMasuk,
            'filters' => [
                'search' => $request->search ?? '',
                'tanggal' => $request->tanggal ?? '',
            ]
        ]);
    }


    public function suratKeluar(Request $request)
    {
        $query = Surat::where('pengirim', Auth::id())
            ->with(['penerima']);

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_surat', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
            });
        }

        if ($request->has('tanggal') && !empty($request->tanggal)) {
            $query->whereDate('tanggal_surat', $request->tanggal);
        }

        $suratKeluar = $query->orderBy('tanggal_surat', 'desc')->get();

        return Inertia::render('SuratKeluar', [
            'suratKeluar' => $suratKeluar,
            'filters' => [
                'search' => $request->search ?? '',
                'tanggal' => $request->tanggal ?? '',
            ]
        ]);
    }


    public function arsipResmi(Request $request)
    {
        if (!Auth::user()->can('surat.view_all')) {
            abort(403);
        }

        $labIds = KepengurusanUser::with('kepengurusanLab')
            ->where('user_id', Auth::id())
            ->get()
            ->pluck('kepengurusanLab.laboratorium_id')
            ->filter()
            ->unique()
            ->values();

        $query = Surat::resmi()
            ->whereIn('lab_id', $labIds)
            ->with(['pengirim', 'penerima', 'lab']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_surat', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%")
                  ->orWhere('penerima_nama_luar', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_surat', $request->tanggal);
        }

        if ($request->filled('lab_id')) {
            $query->where('lab_id', $request->lab_id);
        }

        $suratResmi = $query->orderBy('tanggal_surat', 'desc')->get();

        $labs = Laboratorium::whereIn('id', $labIds)->orderBy('nama')->get(['id', 'nama']);

        return Inertia::render('SuratArsipResmi', [
            'suratResmi' => $suratResmi,
            'labs'       => $labs,
            'filters'    => [
                'search'  => $request->search ?? '',
                'tanggal' => $request->tanggal ?? '',
                'lab_id'  => $request->lab_id ?? '',
            ],
        ]);
    }


    public function viewSurat($id)
    {
        $surat = Surat::with(['pengirim.profile', 'pengirim.kepengurusan.struktur', 'penerima.profile', 'penerima.kepengurusan.struktur'])
            ->findOrFail($id);

        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk melihat surat ini');
        }

        if ($surat->penerima == Auth::id() && !$surat->isread) {
            $surat->isread = true;
            $surat->save();
        }

        return Inertia::render('DetailSurat', [
            'surat' => $surat
        ]);
    }


    public function downloadSurat($id)
    {
        $surat = Surat::findOrFail($id);

        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return response('Anda tidak memiliki akses untuk mengunduh surat ini', 403);
        }

        if (!Storage::disk('public')->exists($surat->file)) {
            return response('File surat tidak ditemukan', 404);
        }

        $filePath = storage_path('app/public/' . $surat->file);

        if (request()->has('download')) {

            $downloadName = Str::slug($surat->perihal) . '_' . $surat->nomor_surat . '.pdf';
            return response()->download($filePath, $downloadName);
        } else {

            return response()->file($filePath);
        }
    }


    public function previewSurat($id)
    {
        $surat = Surat::findOrFail($id);

        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return response('Anda tidak memiliki akses untuk melihat surat ini', 403);
        }

        if (!Storage::disk('public')->exists($surat->file)) {
            return response('File surat tidak ditemukan', 404);
        }

        $filePath = storage_path('app/public/' . $surat->file);

        return response()->file($filePath);
    }


    public function markAsRead($id)
    {
        $surat = Surat::findOrFail($id);

        if ($surat->penerima !== Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk membaca surat ini');
        }

        $surat->isread = true;
        $surat->save();

        return redirect()->back()->with('message', 'Surat telah ditandai sebagai dibaca');
    }


    public function getUnreadCount()
    {
        $count = Surat::where('penerima', Auth::id())
            ->where('isread', false)
            ->count();

        return response()->json(['unreadCount' => $count], 200, [
            'Content-Type' => 'application/json',
            'X-Inertia' => 'false'
        ]);
    }
}
