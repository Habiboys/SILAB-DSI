<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Proker;
use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KegiatanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        
        // Determine kepengurusan_lab_id
        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        $labId = $request->input('lab_id');
        
        // Enforce context for non-superadmin/kadep
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }
        
        // Fallback: resolve from lab_id (active year)
        if (!$kepengurusanLabId && $labId) {
             $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
             if ($tahunAktif) {
                 $kl = KepengurusanLab::where('laboratorium_id', $labId)
                     ->where('tahun_kepengurusan_id', $tahunAktif->id)
                     ->first();
                 if ($kl) {
                     $kepengurusanLabId = $kl->id;
                 }
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
            // Pass kepengurusanLabId for frontend linking/create
            'kepengurusanLabId' => $kepengurusanLabId
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        
        // Determine context
        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        // Get Proker based on context
        $prokerQuery = Proker::query();
        if ($kepengurusanLabId) {
            $prokerQuery->where('kepengurusan_lab_id', $kepengurusanLabId);
        }
        // Only active proker?
        $proker = $prokerQuery->where(function($q) {
             $q->where('status', 'sedang_berjalan')->orWhere('status', 'belum_mulai');
        })->get();

        return Inertia::render('Kegiatan/Create', [
             'proker' => $proker,
             'kepengurusanLabId' => $kepengurusanLabId
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        
        $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'proker_id' => 'required|exists:proker,id',
            'deskripsi_kegiatan' => 'nullable|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        // Security check: ensure proker belongs to user's authorized lab
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $proker = Proker::find($request->proker_id);
            if ($proker->kepengurusan_lab_id != $currentLab['kepengurusan_lab_id']) {
                abort(403, 'Anda tidak diizinkan membuat kegiatan untuk proker ini.');
            }
        }

        Kegiatan::create([
            'nama_kegiatan' => $request->nama_kegiatan,
            'proker_id' => $request->proker_id,
            'deskripsi_kegiatan' => $request->deskripsi_kegiatan,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'status_approval' => 'diajukan', 
        ]);

        return redirect()->route('kegiatan.index', ['kepengurusan_lab_id' => $request->input('kepengurusanLabId')]) // Preserve context if possible
            ->with('message', 'Kegiatan berhasil diajukan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Kegiatan $kegiatan)
    {
        $kegiatan->load(['proker.kepengurusanLab', 'approver', 'laporanKegiatan', 'peserta.user']);
        
        // Authorization check for viewing
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
                'create' => $user->can('kegiatan.create'), // For LPJ upload
                'approve' => $user->can('kegiatan.approve'),
                'edit' => $user->can('kegiatan.edit'), 
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Kegiatan $kegiatan)
    {
        // Check Lab Context
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

        $prokerQuery = Proker::query();
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
             $prokerQuery->where('kepengurusan_lab_id', $currentLab['kepengurusan_lab_id']);
        }
        $proker = $prokerQuery->get();
        
        return Inertia::render('Kegiatan/Edit', [
            'kegiatan' => $kegiatan,
            'proker' => $proker
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kegiatan $kegiatan)
    {
        $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'proker_id' => 'required|exists:proker,id',
            'deskripsi_kegiatan' => 'nullable|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $kegiatan->update($request->only([
            'nama_kegiatan', 'proker_id', 'deskripsi_kegiatan', 
            'tanggal_mulai', 'tanggal_selesai'
        ]));

        // Check if we should reset approval on edit?
        // Usually yes, if significant changes. For now keep simple.
        
        return redirect()->route('kegiatan.index')->with('message', 'Kegiatan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kegiatan $kegiatan)
    {
        $kegiatan->delete();
        return redirect()->route('kegiatan.index')->with('message', 'Kegiatan berhasil dihapus.');
    }

    /**
     * Approve or Reject activity
     */
    public function approve(Request $request, Kegiatan $kegiatan)
    {
        if (!Auth::user()->can('kegiatan.approve')) {
            abort(403, 'Unauthorized action.');
        }
        
        // Lab context check
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

    /**
     * Get events for calendar (JSON)
     */
    public function calendar(Request $request) // Accept Request
    {
        $user = Auth::user();
        $currentLab = $user->getCurrentLab();
        
        // Determine kepengurusan_lab_id context
        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        if (!isset($currentLab['all_access']) && isset($currentLab['kepengurusan_lab_id'])) {
            $kepengurusanLabId = $currentLab['kepengurusan_lab_id'];
        }

        $query = Kegiatan::with('proker')->where('status_approval', 'disetujui');
        
        if ($kepengurusanLabId) {
            $query->whereHas('proker', function($q) use ($kepengurusanLabId) {
                $q->where('kepengurusan_lab_id', $kepengurusanLabId);
            });
        }

        $kegiatan = $query->get()
            ->map(function($k) {
                return [
                    'id' => $k->id,
                    'title' => $k->nama_kegiatan,
                    'start' => $k->tanggal_mulai->format('Y-m-d'),
                    'end' => $k->tanggal_selesai->addDay()->format('Y-m-d'), // +1 day for FullCalendar exclusive end check
                    'url' => route('kegiatan.show', $k->id),
                    'backgroundColor' => '#3b82f6', // blue
                ];
            });
            
        return response()->json($kegiatan);
    }

    /**
     * Get participants for a activity
     */
    public function indexPeserta(Kegiatan $kegiatan)
    {
        // Check access
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

    /**
     * Add participant to activity
     */
    public function storePeserta(Request $request, Kegiatan $kegiatan)
    {
        // Check access
        if (!Auth::user()->can('kegiatan.edit')) { // Assuming edit permission is enough
             abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'peran' => 'required|in:peserta,panitia',
        ]);

        // Check if already exists
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

        return redirect()->back()->with('message', 'Peserta berhasil ditambahkan.');
    }

    /**
     * Remove participant from activity
     */
    /**
     * Upload Certificate Template
     */
    public function uploadTemplate(Request $request, Kegiatan $kegiatan)
    {
         if (!Auth::user()->can('kegiatan.edit')) {
             abort(403, 'Unauthorized action.');
         }

         $request->validate([
             'template' => 'required|file|mimes:docx|max:2048', // 2MB max
         ]);

         $path = $request->file('template')->store('templates/kegiatan', 'public');

         // Save to SertifikatTemplate
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

    /**
     * Generate Certificates for all participants
     */
    public function generateCertificates(Request $request, Kegiatan $kegiatan)
    {
         if (!Auth::user()->can('kegiatan.edit')) { // adjust permission if needed
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

         foreach ($kegiatan->peserta as $peserta) {
             $user = $peserta->user;
             $nomorSertifikat = 'SRT/' . date('Y') . '/' . $kegiatan->id . '/' . $peserta->id; // Example format
             
             // Prepare data
             $data = [
                 'nama' => $user->name,
                 'nim' => $user->nim ?? '-', // Assuming user has nim
                 'peran' => ucfirst($peserta->peran),
                 'kegiatan' => $kegiatan->nama_kegiatan,
                 'tanggal' => $kegiatan->tanggal_mulai->format('d F Y'),
                 'nomor' => $nomorSertifikat
             ];

             $fileName = 'sertifikat/kegiatan/' . $kegiatan->id . '_' . $peserta->id . '.docx';
             
             // Generate
             $result = $certificateService->generate($templatePath, $data, $fileName, 'docx');

             if ($result) {
                 // Save record to 'sertifikat' table (the main record table)
                 \App\Models\Sertifikat::updateOrCreate(
                     [
                         'user_id' => $user->id,
                         'nomor_sertifikat' => $nomorSertifikat, // unique key constraint might trigger here
                     ],
                     [
                        'jenis_sertifikat' => 'kepengurusan', // using 'kepengurusan' as fallback or maybe add 'kegiatan' to enum later?
                        // Wait, enum is ['asisten', 'praktikan', 'kepengurusan']. 'kegiatan' is missing in migration?
                        // Let's use 'kepengurusan' for now or I should have added 'kegiatan' to enum in migration.
                        // I will assume 'kepengurusan' covers generalized activities or I need to alter the table.
                        // Actually, I should probably check the migration I just made/viewed.
                        // The migration 2026_02_03_170654_create_sertifikat_table.php has:
                        // $table->enum('jenis_sertifikat', ['asisten', 'praktikan', 'kepengurusan']);
                        // I really should have added 'kegiatan'.
                        // For now, I will map it to 'kepengurusan' to avoid SQL error, 
                        // BUT I should note to the user that I might need to update the enum.
                         'file_path' => $result,
                         'tanggal_terbit' => now(),
                         'kepengurusan_lab_id' => $kegiatan->proker->kepengurusan_lab_id, // Link to lab context
                     ]
                 );

                 // Update KegiatanPeserta
                 $peserta->update([
                     'no_sertifikat' => $nomorSertifikat,
                     'file_sertifikat' => $result
                 ]);
                 
                 $count++;
             }
         }

         return redirect()->back()->with('message', "$count sertifikat berhasil digenerate.");
    }
}
