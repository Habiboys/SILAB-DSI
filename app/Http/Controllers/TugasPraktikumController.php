<?php

namespace App\Http\Controllers;

use App\Models\TugasPraktikum;
use App\Models\Praktikum;
use App\Models\Praktikan;
use App\Models\PraktikanPraktikum;
use App\Notifications\TugasBaruNotification;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Support\KelasScopeResolver;

class TugasPraktikumController extends Controller
{
    // Note: Authorization handled via route middleware

    /**
     * Display a listing of tugas for a specific praktikum
     */
    public function index(Request $request, $praktikumId)
    {
        $praktikum = Praktikum::with([
            'kepengurusanLab.laboratorium',
            'kelas' => function($query) {
                $query->where('status', 'aktif')->orderBy('nama_kelas');
            }
        ])->findOrFail($praktikumId);

        // Hanya admin/kadep atau aslab yang di-assign yang boleh kelola tugas
        $user = auth()->user();
        if (!$user->canManagePraktikum($praktikumId)) {
            abort(403, 'Anda tidak di-assign sebagai aslab untuk praktikum ini. Hanya aslab yang ditugaskan yang dapat mengelola tugas.');
        }

        $requestedKelasId = $request->input('context_kelas_id', $request->input('kelas_id'));
        $kelasScopeIds = KelasScopeResolver::resolve($requestedKelasId);

        // Get pertemuan list for filter and form
        $kelasIds = \App\Models\Kelas::where('praktikum_id', $praktikumId)->pluck('id');
        $pertemuanListQuery = \App\Models\PertemuanPraktikum::whereIn('kelas_id', $kelasIds);
        if (!empty($kelasScopeIds)) {
            $pertemuanListQuery->whereIn('kelas_id', $kelasScopeIds);
        }

        $pertemuanList = $pertemuanListQuery
            ->with('kelas')
            ->orderBy('tanggal', 'desc')
            ->get();

        // Query builder for tugas
        $query = TugasPraktikum::with(['komponenRubriks', 'kelas', 'pertemuan'])
            ->whereHas('kelas', fn($q) => $q->where('praktikum_id', $praktikumId));

        // Filter by Kelas/Context scope
        if ($request->has('kelas_id') && $request->kelas_id === 'umum') {
            $query->whereNull('kelas_id');
        } elseif (!empty($kelasScopeIds)) {
            $query->whereIn('kelas_id', $kelasScopeIds);
        }

        // Filter by Pertemuan
        if ($request->filled('pertemuan_id')) {
            $query->where('pertemuan_id', $request->pertemuan_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('judul_tugas', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Sort and Paginate
        $tugas = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $classContext = null;
        if ($requestedKelasId) {
            $classContext = $praktikum->kelas->firstWhere('id', $requestedKelasId);
        }

        return Inertia::render('TugasPraktikum/Index', [
            'praktikum' => $praktikum,
            'tugas' => $tugas,
            'pertemuanList' => $pertemuanList,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium,
            'filters' => $request->only(['search', 'pertemuan_id', 'kelas_id', 'context_kelas_id']),
            'classContext' => $classContext,
        ]);
    }

    /**
     * Boleh pilih kelas parent: tugas untuk parent = semua subkelas ikut dapat tugas yang sama.
     * Tidak perlu validasi blokir parent.
     */
    private function validateEnrollmentKelas(string $kelasId): ?string
    {
        return null;
    }

    /**
     * Store a newly created tugas
     */
    public function store(Request $request, $praktikumId)
    {
        // Check lab access
        $praktikum = Praktikum::findOrFail($praktikumId);
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
             // Check if user has permission in this specific lab
            if (!$user->canAccessPraktikum($praktikumId)) {
                 abort(403, 'Anda tidak memiliki akses ke praktikum dari lab lain');
            }
        }

        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
            'deadline' => 'required|date',
            'kelas_id' => 'nullable|exists:kelas,id',
            'pertemuan_id' => 'nullable|exists:pertemuan_praktikum,id',
        ]);

        if ($request->kelas_id && ($err = $this->validateEnrollmentKelas($request->kelas_id))) {
            return back()->withErrors(['kelas_id' => $err])->withInput();
        }

        // Normalisasi deadline
        $appTz = config('app.timezone', 'Asia/Jakarta');
        $deadlineCarbon = null;
        try {
            $deadlineCarbon = Carbon::createFromFormat('Y-m-d\TH:i', (string) $request->deadline, $appTz);
        } catch (\Throwable $e) {
            $deadlineCarbon = Carbon::parse($request->deadline, $appTz);
        }
        $deadline = $deadlineCarbon->format('Y-m-d H:i:s');

        $data = [
            'kelas_id' => $request->kelas_id,
            'pertemuan_id' => $request->pertemuan_id,
            'judul_tugas' => $request->judul_tugas,
            'deskripsi' => $request->deskripsi,
            'deadline' => $deadline,
            'status' => 'aktif'
        ];

        if ($request->hasFile('file_tugas')) {
            $file = $request->file('file_tugas');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('tugas_praktikum', $filename, 'public');
            $data['file_tugas'] = $path;
        }

        $tugas = TugasPraktikum::create($data);

        // Kirim FCM ke semua praktikan yang punya akun & fcm_token
        $this->notifyPraktikan($tugas, $praktikum, $request->kelas_id);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil ditambahkan');
    }

    /**
     * Update tugas
     */
    public function update(Request $request, $id)
    {
        $tugas = TugasPraktikum::with(['kelas'])->findOrFail($id);

        // Check lab access
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            if (!$user->canAccessPraktikum($tugas->kelas?->praktikum_id)) {
                abort(403, 'Anda tidak memiliki akses ke tugas dari lab lain');
            }
        }

        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'deadline' => 'required|date',
            'kelas_id' => 'nullable|exists:kelas,id',
            'pertemuan_id' => 'nullable|exists:pertemuan_praktikum,id',
            'status' => 'required|in:aktif,nonaktif'
        ]);

        if ($request->kelas_id && ($err = $this->validateEnrollmentKelas($request->kelas_id))) {
            return back()->withErrors(['kelas_id' => $err])->withInput();
        }

        // Normalisasi deadline
        $appTz = config('app.timezone', 'Asia/Jakarta');
        $deadlineCarbon = null;
        try {
            $deadlineCarbon = Carbon::createFromFormat('Y-m-d\TH:i', (string) $request->deadline, $appTz);
        } catch (\Throwable $e) {
            $deadlineCarbon = Carbon::parse($request->deadline, $appTz);
        }
        $deadline = $deadlineCarbon->format('Y-m-d H:i:s');

        $data = [
            'judul_tugas' => $request->judul_tugas,
            'deskripsi' => $request->deskripsi,
            'deadline' => $deadline,
            'kelas_id' => $request->kelas_id,
            'pertemuan_id' => $request->pertemuan_id,
            'status' => $request->status
        ];

        if ($request->hasFile('file_tugas')) {
            if ($tugas->file_tugas) {
                Storage::delete($tugas->file_tugas);
            }

            $file = $request->file('file_tugas');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('tugas_praktikum', $filename, 'public');
            $data['file_tugas'] = $path;
        }

        $tugas->update($data);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil diubah');
    }

    /**
     * Remove tugas
     */
    public function destroy($id)
    {
        $tugas = TugasPraktikum::with(['kelas'])->findOrFail($id);

        // Check lab access
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            if (!$user->canAccessPraktikum($tugas->kelas?->praktikum_id)) {
                abort(403, 'Anda tidak memiliki akses ke tugas dari lab lain');
            }
        }

        // Delete file if exists
        if ($tugas->file_tugas) {
            Storage::delete($tugas->file_tugas);
        }

        $tugas->delete();

        return redirect()->back()->with('success', 'Tugas praktikum berhasil dihapus');
    }

    /**
     * Download file tugas
     */
    public function downloadFile($id)
    {
        $tugas = TugasPraktikum::with('kelas')->findOrFail($id);

        if (!$tugas->file_tugas || !Storage::disk('public')->exists($tugas->file_tugas)) {
            abort(404, 'File tidak ditemukan');
        }

        // Validasi kelas: praktikan boleh download jika tugas untuk kelasnya atau untuk kelas induk (parent) dari kelasnya
        if (auth()->check() && auth()->user()->hasRole('praktikan')) {
            $user = auth()->user();
            $praktikan = Praktikan::where('user_id', $user->id)->first();

            if ($praktikan && $tugas->kelas_id) {
                $praktikanKelas = PraktikanPraktikum::where('praktikan_id', $praktikan->id)
                    ->where('praktikum_id', $tugas->kelas?->praktikum_id)
                    ->first();

                if (!$praktikanKelas) {
                    abort(403, 'Anda tidak terdaftar di praktikum ini');
                }
                $kelasPraktikan = \App\Models\Kelas::find($praktikanKelas->kelas_id);
                $bolehDownload = $tugas->kelas_id === $praktikanKelas->kelas_id
                    || ($kelasPraktikan && $kelasPraktikan->parent_kelas_id === $tugas->kelas_id);
                if (!$bolehDownload) {
                    abort(403, 'Tugas ini tidak untuk kelas Anda');
                }
            }
        }

        $filename = basename($tugas->file_tugas);
        $originalFilename = preg_replace('/^\d+_/', '', $filename);

        return Storage::disk('public')->download($tugas->file_tugas, $originalFilename);
    }

    /**
     * View file instruksi tugas
     */
    public function viewFile($id)
    {
        $tugas = TugasPraktikum::with(['kelas'])->findOrFail($id);

        // Check if tugas is active
        if ($tugas->status !== 'aktif') {
            abort(403, 'File instruksi tidak dapat diakses karena tugas sudah nonaktif');
        }

        if (!$tugas->file_tugas) {
            abort(404, 'File tugas tidak ditemukan');
        }

        // Validasi: praktikan hanya bisa view file tugas untuk kelasnya atau kelas induk (subkelas)
        if (auth()->check() && auth()->user()->hasRole('praktikan')) {
            $user = auth()->user();
            $praktikan = Praktikan::where('user_id', $user->id)->first();

            if ($praktikan && $tugas->kelas_id) {
                $praktikanKelas = PraktikanPraktikum::where('praktikan_id', $praktikan->id)
                    ->where('praktikum_id', $tugas->kelas?->praktikum_id)
                    ->first();
                if (!$praktikanKelas) {
                    abort(403, 'Anda tidak terdaftar di praktikum ini');
                }
                $kelasPraktikan = \App\Models\Kelas::find($praktikanKelas->kelas_id);
                $bolehView = $tugas->kelas_id === $praktikanKelas->kelas_id
                    || ($kelasPraktikan && $kelasPraktikan->parent_kelas_id === $tugas->kelas_id);
                if (!$bolehView) {
                    abort(403, 'Tugas ini tidak untuk kelas Anda');
                }
            }
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($tugas->file_tugas)) {
            abort(404, 'File tidak ditemukan di storage');
        }

        // Get the file's MIME type
        $mimeType = Storage::disk('public')->mimeType($tugas->file_tugas);
        $isPdf = $mimeType === 'application/pdf';

        // Build the file URL for the PDF viewer
        $fileUrl = asset('storage/' . $tugas->file_tugas);

        // Return the React component using Inertia
        return Inertia::render('TugasViewer', [
            'tugas' => $tugas,
            'praktikum' => $tugas->praktikum,
            'fileUrl' => $fileUrl,
            'isPdf' => $isPdf
        ]);
    }

    /**
     * Get tugas data for API
     */
    public function getTugas($praktikumId)
    {
        $tugas = TugasPraktikum::whereHas('kelas', fn($q) => $q->where('praktikum_id', $praktikumId))
            ->where('status', 'aktif')
            ->orderBy('deadline')
            ->get();

        return response()->json($tugas);
    }

    private function notifyPraktikan(TugasPraktikum $tugas, Praktikum $praktikum, ?string $kelasId): void
    {
        $praktikanList = Praktikan::whereNotNull('user_id')
            ->whereHas('praktikums', function ($q) use ($praktikum, $kelasId) {
                $q->where('praktikan_praktikum.praktikum_id', $praktikum->id);
                if ($kelasId) {
                    $q->where('praktikan_praktikum.kelas_id', $kelasId);
                }
            })
            ->with('user.profile')
            ->get();

        \Illuminate\Support\Facades\Log::info('[WA Debug] praktikan ditemukan: ' . $praktikanList->count());

        if ($praktikanList->isEmpty()) return;

        // FCM
        $fcmUsers = $praktikanList->pluck('user')->filter(fn($u) => $u?->fcm_token);
        if ($fcmUsers->isNotEmpty()) {
            Notification::send($fcmUsers, new TugasBaruNotification($tugas, $praktikum));
        }

        // WA
        $deadline = Carbon::parse($tugas->deadline)
            ->timezone(config('app.timezone', 'Asia/Jakarta'))
            ->translatedFormat('d M Y, H:i');

        $namaPraktikum = $praktikum->nama ?: ($praktikum->mata_kuliah ?? 'Praktikum');
        $message = implode("\n", [
            'Halo {{nama}},',
            '',
            "📝 *Tugas Baru - {$namaPraktikum}*",
            '',
            "*{$tugas->judul_tugas}*",
            "Deadline: {$deadline}",
            '',
            'Segera kerjakan dan kumpulkan tepat waktu!',
            '',
            '_Pesan otomatis dari SILAB._',
        ]);

        $contacts = $praktikanList
            ->map(fn($p) => [
                'phone' => $p->no_hp ?: $p->user?->profile?->no_hp,
                'name'  => $p->nama ?: $p->user?->name,
            ])
            ->filter(fn($c) => $c['phone'] && $c['name'])
            ->values()
            ->toArray();

        \Illuminate\Support\Facades\Log::info('[WA Debug] contacts HP: ' . count($contacts) . ' — sample: ' . ($contacts[0]['phone'] ?? 'none'));

        if (!empty($contacts)) {
            (new WhatsAppService())->sendBulk($contacts, $message);
        }
    }
}
