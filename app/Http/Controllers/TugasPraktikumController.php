<?php

namespace App\Http\Controllers;

use App\Models\TugasPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Praktikan;
use App\Models\PraktikanPraktikum;

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
        
        // Check lab access
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            // Check if user has permission in this specific lab
            if (!$user->canAccessPraktikum($praktikumId)) {
                 abort(403, 'Anda tidak memiliki akses ke praktikum dari lab lain');
            }
        }

        // Get pertemuan list for filter and form
        $pertemuanQuery = \App\Models\PertemuanPraktikum::where('praktikum_id', $praktikumId)
            ->orderBy('tanggal', 'desc');

        if ($request->has('kelas_id') && $request->kelas_id !== 'all' && $request->kelas_id !== 'umum') {
            $pertemuanQuery->where('kelas_id', $request->kelas_id);
        }
        
        $pertemuanList = $pertemuanQuery->get();
        
        // Query builder for tugas
        $query = TugasPraktikum::with(['komponenRubriks', 'kelas', 'pertemuan'])
            ->where('praktikum_id', $praktikumId);

        // Filter by Kelas (Tab)
        if ($request->has('kelas_id') && $request->kelas_id !== 'all' && $request->kelas_id !== 'umum') {
            $query->where('kelas_id', $request->kelas_id);
        } elseif ($request->kelas_id === 'umum') {
            $query->whereNull('kelas_id');
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

        return Inertia::render('TugasPraktikum/Index', [
            'praktikum' => $praktikum,
            'tugas' => $tugas,
            'pertemuanList' => $pertemuanList,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium,
            'filters' => $request->only(['search', 'pertemuan_id', 'kelas_id'])
        ]);
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
            'praktikum_id' => $praktikumId,
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

        TugasPraktikum::create($data);

        return redirect()->back()->with('success', 'Tugas praktikum berhasil ditambahkan');
    }

    /**
     * Update tugas
     */
    public function update(Request $request, $id)
    {
        $tugas = TugasPraktikum::with('praktikum.kepengurusanLab')->findOrFail($id);
        
        // Check lab access
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            if (!$user->canAccessPraktikum($tugas->praktikum_id)) {
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
        $tugas = TugasPraktikum::with('praktikum.kepengurusanLab')->findOrFail($id);
        
        // Check lab access
        $user = auth()->user();
        if (!$user->hasAnyRole(['admin', 'superadmin', 'kadep'])) {
            if (!$user->canAccessPraktikum($tugas->praktikum_id)) {
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
        $tugas = TugasPraktikum::findOrFail($id);
        
        if (!$tugas->file_tugas || !Storage::disk('public')->exists($tugas->file_tugas)) {
            abort(404, 'File tidak ditemukan');
        }

        // Validasi kelas: praktikan hanya bisa download file tugas dari kelas yang sama
        if (auth()->check() && auth()->user()->hasRole('praktikan')) {
            $user = auth()->user();
            $praktikan = Praktikan::where('user_id', $user->id)->first();
            
            if ($praktikan && $tugas->kelas_id) {
                $praktikanKelas = PraktikanPraktikum::where('praktikan_id', $praktikan->id)
                    ->where('praktikum_id', $tugas->praktikum_id)
                    ->where('kelas_id', $tugas->kelas_id)
                    ->first();
                    
                if (!$praktikanKelas) {
                    abort(403, 'Anda tidak terdaftar di kelas yang sama dengan tugas ini');
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
        $tugas = TugasPraktikum::with('praktikum.kepengurusanLab.laboratorium')->findOrFail($id);
        
        // Check if tugas is active
        if ($tugas->status !== 'aktif') {
            abort(403, 'File instruksi tidak dapat diakses karena tugas sudah nonaktif');
        }
        
        if (!$tugas->file_tugas) {
            abort(404, 'File tugas tidak ditemukan');
        }

        // Validasi kelas: praktikan hanya bisa view file tugas dari kelas yang sama
        if (auth()->check() && auth()->user()->hasRole('praktikan')) {
            $user = auth()->user();
            $praktikan = Praktikan::where('user_id', $user->id)->first();
            
            if ($praktikan && $tugas->kelas_id) {
                $praktikanKelas = PraktikanPraktikum::where('praktikan_id', $praktikan->id)
                    ->where('praktikum_id', $tugas->praktikum_id)
                    ->where('kelas_id', $tugas->kelas_id)
                    ->first();
                    
                if (!$praktikanKelas) {
                    abort(403, 'Anda tidak terdaftar di kelas yang sama dengan tugas ini');
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
        $tugas = TugasPraktikum::where('praktikum_id', $praktikumId)
            ->where('status', 'aktif')
            ->orderBy('deadline')
            ->get();

        return response()->json($tugas);
    }
}
