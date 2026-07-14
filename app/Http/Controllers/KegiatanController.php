<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Proker;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Sertifikat;
use App\Models\User;
use App\Notifications\KegiatanPesertaNotification;
use App\Notifications\SertifikatBaruNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KegiatanController extends Controller
{

    public function index(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        $labId = $request->input('lab_id');

        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        if (!$kepengurusanLabId && $labId) {
             $kl = KepengurusanLab::where('laboratorium_id', $labId)
                 ->where('is_active', true)
                 ->first();
             if ($kl) {
                 $kepengurusanLabId = $kl->id;
             }
        }

        $query = Kegiatan::with(['proker', 'approver'])
            ->whereHas('proker', function($q) use ($kepengurusanLabId) {
                if ($kepengurusanLabId) {
                    $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                }
            });

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status_approval', $request->status);
        }

        $kegiatan = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Kegiatan/Index', [
            'kegiatan' => $kegiatan,
            'filters' => array_merge($request->only(['status']), ['kepengurusan_lab_id' => $kepengurusanLabId]),
            'can' => [
                'create' => $user->can('kegiatan.create'),
                'approve' => $user->can('kegiatan.approve'),
            ],

            'kepengurusanLabId' => $kepengurusanLabId
        ]);
    }


    public function create(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        if (!$kepengurusanLabId && !isset($currentLab['all_access']) && isset($currentLab['laboratorium'])) {
            $labId = $currentLab['laboratorium']->id ?? null;
            if ($labId) {
                $kl = KepengurusanLab::where('laboratorium_id', $labId)
                    ->where('is_active', true)
                    ->first();
                $kepengurusanLabId = $kl?->id;
            }
        }

        if (!$kepengurusanLabId && $request->input('lab_id')) {
            $kl = KepengurusanLab::where('laboratorium_id', $request->input('lab_id'))
                ->where('is_active', true)
                ->first();
            $kepengurusanLabId = $kl?->id;
        }

        $prokerQuery = Proker::query();
        if ($kepengurusanLabId) {
            $prokerQuery->where('kepengurusan_lab_id', $kepengurusanLabId);
        }
        $proker = $prokerQuery->with('struktur')
            ->where('status_pengajuan', 'disetujui')
            ->where(function($q) {
                $q->where('status', 'sedang_berjalan')->orWhere('status', 'belum_mulai');
            })->get();

        if ($proker->isEmpty() && $kepengurusanLabId) {
            $currentKepLab = KepengurusanLab::find($kepengurusanLabId);
            if ($currentKepLab) {
                $allPeriodIds = KepengurusanLab::where('laboratorium_id', $currentKepLab->laboratorium_id)
                    ->pluck('id');
                $proker = Proker::with('struktur')
                    ->whereIn('kepengurusan_lab_id', $allPeriodIds)
                    ->where('status_pengajuan', 'disetujui')
                    ->where(function($q) {
                        $q->where('status', 'sedang_berjalan')->orWhere('status', 'belum_mulai');
                    })->get();
            }
        }

        return Inertia::render('Kegiatan/Create', [
             'proker' => $proker,
             'kepengurusanLabId' => $kepengurusanLabId
        ]);
    }


    public function store(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        $request->validate([
            'nama_kegiatan'    => 'required|string|max:255',
            'proker_id'        => 'required|exists:proker,id',
            'deskripsi_kegiatan' => 'nullable|string',
            'tipe_kegiatan'    => 'nullable|string|max:50',
            'lokasi'           => 'nullable|string|max:255',
            'link_meeting'     => 'nullable|string|max:500',
            'tanggal_mulai'    => 'required|date',
            'tanggal_selesai'  => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $selectedProker = Proker::find($request->proker_id);
        if (!$selectedProker || $selectedProker->status_pengajuan !== 'disetujui') {
            return back()->withErrors(['proker_id' => 'Kegiatan hanya dapat ditambahkan untuk program kerja yang sudah disetujui.'])->withInput();
        }

        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $proker = Proker::with('kepengurusanLab')->find($request->proker_id);
            $currentKepLab = KepengurusanLab::find($currentLab['kepengurusan_lab_id']);
            if (!$currentKepLab || !$proker->kepengurusanLab || $proker->kepengurusanLab->laboratorium_id != $currentKepLab->laboratorium_id) {
                abort(403, 'Anda tidak diizinkan membuat kegiatan untuk proker ini.');
            }
        }

        Kegiatan::create([
            'nama_kegiatan'      => $request->nama_kegiatan,
            'proker_id'          => $request->proker_id,
            'deskripsi_kegiatan' => $request->deskripsi_kegiatan,
            'tipe_kegiatan'      => $request->tipe_kegiatan,
            'lokasi'             => $request->lokasi,
            'link_meeting'       => $request->link_meeting,
            'tanggal_mulai'      => $request->tanggal_mulai,
            'tanggal_selesai'    => $request->tanggal_selesai,
            'status_approval'    => 'diajukan',
        ]);

        return redirect()->route('kegiatan.index', ['kepengurusan_lab_id' => $request->input('kepengurusanLabId')])
            ->with('message', 'Kegiatan berhasil diajukan.');
    }


    public function show(Kegiatan $kegiatan)
    {
        $kegiatan->load([
            'proker.kepengurusanLab',
            'approver',
            'laporanKegiatan',
            'peserta.user',
            'dokumentasiKegiatan.uploader',
        ]);

        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            if ($kegiatan->proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Unauthorized access to this activity.');
            }
        }

        return Inertia::render('Kegiatan/Show', [
            'kegiatan' => $kegiatan,
            'can' => [
                'create'  => $user->can('kegiatan.create'),
                'approve' => $user->can('kegiatan.approve'),
                'edit'    => $user->can('kegiatan.edit'),
            ],
        ]);
    }


    public function sertifikat(Kegiatan $kegiatan)
    {
        $kegiatan->load(['proker.kepengurusanLab', 'approver', 'peserta.user']);

        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            if ($kegiatan->proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Unauthorized access.');
            }
        }

        $existingUserIds = $kegiatan->peserta->pluck('user_id')->toArray();
        $kepLabId = $kegiatan->proker?->kepengurusan_lab_id;
        $anggota = [];
        if ($kepLabId) {
            $anggota = \App\Models\KepengurusanUser::with('user')
                ->where('kepengurusan_lab_id', $kepLabId)
                ->whereHas('user')
                ->get()
                ->map(fn($ku) => ['id' => $ku->user->id, 'name' => $ku->user->name])
                ->filter(fn($u) => !in_array($u['id'], $existingUserIds))
                ->values()
                ->toArray();
        }

        $template = \App\Models\SertifikatTemplate::where('kategori', 'kegiatan')
            ->where('ref_id', $kegiatan->id)
            ->first();

        return Inertia::render('Kegiatan/Sertifikat', [
            'kegiatan' => $kegiatan,
            'anggota'  => $anggota,
            'template' => $template,
            'can' => [
                'create'  => $user->can('kegiatan.create'),
                'approve' => $user->can('kegiatan.approve'),
                'edit'    => $user->can('kegiatan.edit'),
            ],
        ]);
    }


    public function edit(Kegiatan $kegiatan)
    {

        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            if ($kegiatan->proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Unauthorized access.');
            }
        }

        if ($kegiatan->status_approval === 'disetujui' && !Auth::user()->hasRole('superadmin')) {
             return redirect()->back()->with('error', 'Kegiatan yang sudah disetujui tidak dapat diedit.');
        }

        $prokerQuery = Proker::query()->with('struktur');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
             $prokerQuery->where('kepengurusan_lab_id', $currentLab['kepengurusan_lab_id']);
        }
        $proker = $prokerQuery->get();

        if ($proker->isEmpty() && !isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $currentKepLab = KepengurusanLab::find($currentLab['kepengurusan_lab_id']);
            if ($currentKepLab) {
                $allPeriodIds = KepengurusanLab::where('laboratorium_id', $currentKepLab->laboratorium_id)->pluck('id');
                $proker = Proker::with('struktur')->whereIn('kepengurusan_lab_id', $allPeriodIds)->get();
            }
        }

        return Inertia::render('Kegiatan/Edit', [
            'kegiatan' => $kegiatan,
            'proker' => $proker
        ]);
    }


    public function update(Request $request, Kegiatan $kegiatan)
    {
        $request->validate([
            'nama_kegiatan'      => 'required|string|max:255',
            'proker_id'          => 'required|exists:proker,id',
            'deskripsi_kegiatan' => 'nullable|string',
            'tipe_kegiatan'      => 'nullable|string|max:50',
            'lokasi'             => 'nullable|string|max:255',
            'link_meeting'       => 'nullable|string|max:500',
            'tanggal_mulai'      => 'required|date',
            'tanggal_selesai'    => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $kegiatan->update($request->only([
            'nama_kegiatan', 'proker_id', 'deskripsi_kegiatan',
            'tipe_kegiatan', 'lokasi', 'link_meeting',
            'tanggal_mulai', 'tanggal_selesai'
        ]));

        return redirect()->route('kegiatan.index')->with('message', 'Kegiatan berhasil diperbarui.');
    }


    public function destroy(Kegiatan $kegiatan)
    {
        $kegiatan->delete();
        return redirect()->route('kegiatan.index')->with('message', 'Kegiatan berhasil dihapus.');
    }


    public function approve(Request $request, Kegiatan $kegiatan)
    {
        if (!Auth::user()->can('kegiatan.approve')) {
            abort(403, 'Unauthorized action.');
        }

        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            if ($kegiatan->proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Unauthorized access to this activity.');
            }
        }

        $request->validate([
            'status' => 'required|in:disetujui,ditolak'
        ]);

        $kegiatan->update([
            'status_approval' => $request->status,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        $msg = $request->status === 'disetujui' ? 'disetujui' : 'ditolak';
        return redirect()->back()->with('message', "Kegiatan berhasil $msg.");
    }

    public function calendarView()
    {
        return Inertia::render('Kegiatan/Kalender');
    }


    public function calendar(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();

        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        if (!$kepengurusanLabId && $request->input('lab_id')) {
            $kl = KepengurusanLab::where('laboratorium_id', $request->input('lab_id'))
                ->where('is_active', true)
                ->first();
            if ($kl) $kepengurusanLabId = $kl->id;
        }

        $query = Kegiatan::with('proker')->whereIn('status_approval', ['diajukan', 'disetujui']);

        if ($kepengurusanLabId) {
            $query->whereHas('proker', function($q) use ($kepengurusanLabId) {
                $q->where('kepengurusan_lab_id', $kepengurusanLabId);
            });
        }

        $kegiatan = $query->get()
            ->map(function($k) {
                $colors = [
                    'diajukan'  => '#f59e0b',
                    'disetujui' => '#3b82f6',
                ];
                return [
                    'id'              => $k->id,
                    'title'           => $k->nama_kegiatan,
                    'start'           => $k->tanggal_mulai->format('Y-m-d'),
                    'end'             => $k->tanggal_selesai->addDay()->format('Y-m-d'),
                    'url'             => route('kegiatan.show', $k->id),
                    'backgroundColor' => $colors[$k->status_approval] ?? '#6b7280',
                    'status'          => $k->status_approval,
                ];
            });

        return response()->json($kegiatan);
    }


    public function indexPeserta(Kegiatan $kegiatan)
    {

        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            if ($kegiatan->proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Unauthorized access.');
            }
        }

        $peserta = $kegiatan->peserta()->with('user')->get();
        return response()->json($peserta);
    }


    public function storePeserta(Request $request, Kegiatan $kegiatan)
    {

        if (!Auth::user()->can('kegiatan.edit')) {
             abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'peran' => 'required|in:peserta,panitia',
        ]);

        $exists = $kegiatan->peserta()->where('user_id', $request->user_id)->exists();
        if ($exists) {
            return redirect()->back()->with('error', 'User sudah terdaftar sebagai peserta.');
        }

        \App\Models\KegiatanPeserta::create([
            'kegiatan_id' => $kegiatan->id,
            'user_id' => $request->user_id,
            'peran' => $request->peran,
            'is_lulus' => false
        ]);

        $user = User::find($request->user_id);
        if ($user?->fcm_token) {
            $user->notify(new KegiatanPesertaNotification($kegiatan, $request->peran));
        }

        return redirect()->back()->with('message', 'Peserta berhasil ditambahkan.');
    }


    public function destroyPeserta(Kegiatan $kegiatan, $pesertaId)
    {
        if (!Auth::user()->can('kegiatan.edit')) {
            abort(403, 'Unauthorized action.');
        }

        $peserta = \App\Models\KegiatanPeserta::where('id', $pesertaId)
            ->where('kegiatan_id', $kegiatan->id)
            ->firstOrFail();

        $peserta->delete();

        return redirect()->back()->with('message', 'Peserta berhasil dihapus.');
    }


    public function uploadTemplate(Request $request, Kegiatan $kegiatan)
    {
         if (!Auth::user()->can('kegiatan.edit')) {
             abort(403, 'Unauthorized action.');
         }

         $request->validate([
             'template' => 'required|file|mimes:docx|max:2048',
         ]);

         $path = $request->file('template')->store('templates/kegiatan', 'public');

         \App\Models\SertifikatTemplate::updateOrCreate(
             [
                 'kategori' => 'kegiatan',
                 'ref_id' => $kegiatan->id
             ],
             [
                 'nama' => 'Template ' . $kegiatan->nama_kegiatan,
                 'file_path' => $path
             ]
         );

         return redirect()->back()->with('message', 'Template sertifikat berhasil diunggah.');
    }


    public function generateCertificates(Request $request, Kegiatan $kegiatan)
    {
         if (!Auth::user()->can('kegiatan.edit')) {
             abort(403, 'Unauthorized action.');
         }

         $template = \App\Models\SertifikatTemplate::where('kategori', 'kegiatan')
             ->where('ref_id', $kegiatan->id)
             ->first();

         if (!$template) {
             return redirect()->back()->with('error', 'Template sertifikat belum diunggah.');
         }

         $templatePath = storage_path('app/public/' . $template->file_path);
         $certificateService = new \App\Services\CertificateService();
         $count = 0;

         $kegiatan->loadMissing(['peserta.user.profile', 'peserta.user.praktikan', 'proker.kepengurusanLab.laboratorium']);

         $userIds = $request->input('user_ids', []);
         $pesertaList = $kegiatan->peserta;
         if (!empty($userIds)) {
             $pesertaList = $pesertaList->filter(fn($p) => in_array($p->user_id, $userIds))->values();
         }

         $baseSeq = \App\Models\KegiatanPeserta::where('kegiatan_id', $kegiatan->id)
             ->whereNotNull('no_sertifikat')
             ->count();

         foreach ($pesertaList as $i => $peserta) {
             $user = $peserta->user;
             if (!$user) continue;

             $seq = str_pad($baseSeq + $i + 1, 3, '0', STR_PAD_LEFT);
             $nomorSertifikat = 'SRT-' . date('Y') . '-KGT-' . $seq;

             $data = [
                 'nama'     => $user->name,
                 'nim'      => $user->profile?->nomor_induk ?? $user->praktikan?->nim ?? '-',
                 'peran'    => ucfirst($peserta->peran),
                 'kegiatan' => $kegiatan->nama_kegiatan,
                 'tanggal'  => $kegiatan->tanggal_mulai->format('d F Y'),
                 'nomor'    => $nomorSertifikat,
             ];

             $fileName = 'sertifikat/kegiatan/' . $kegiatan->id . '_' . $user->id . '.docx';

             $result = $certificateService->generate($templatePath, $data, $fileName, 'docx');

             if ($result) {

                 \App\Models\Sertifikat::updateOrCreate(
                     [
                         'user_id' => $user->id,
                         'nomor_sertifikat' => $nomorSertifikat,
                     ],
                     [
                        'jenis_sertifikat' => 'kegiatan',

                         'file_path' => $result,
                         'tanggal_terbit' => now(),
                         'kepengurusan_lab_id' => $kegiatan->proker->kepengurusan_lab_id,
                     ]
                 );

                 $peserta->update([
                     'no_sertifikat' => $nomorSertifikat,
                     'file_sertifikat' => $result
                 ]);

                 if ($user->fcm_token) {
                     $sertifikat = Sertifikat::where('user_id', $user->id)
                         ->where('nomor_sertifikat', $nomorSertifikat)
                         ->first();
                     if ($sertifikat) {
                         $user->notify(new SertifikatBaruNotification($sertifikat));
                     }
                 }

                 $count++;
             }
         }

         return redirect()->back()->with('message', "$count sertifikat berhasil digenerate.");
    }
}
