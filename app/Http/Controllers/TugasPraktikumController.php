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
        
        // Get all tugas for this praktikum
        $allTugas = TugasPraktikum::with(['komponenRubriks', 'kelas'])
            ->where('praktikum_id', $praktikumId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Group tugas by kelas
        $tugasByKelas = [];
        foreach ($praktikum->kelas as $kelas) {
            $tugasByKelas[$kelas->id] = $allTugas->where('kelas_id', $kelas->id)->values();
        }

        // Tugas for all kelas (kelas_id is null)
        $tugasUmum = $allTugas->whereNull('kelas_id')->values();

        return Inertia::render('TugasPraktikum/Index', [
            'praktikum' => $praktikum,
            'tugas' => $allTugas, // For backward compatibility
            'tugasByKelas' => $tugasByKelas,
            'tugasUmum' => $tugasUmum,
            'kelas' => $praktikum->kelas,
            'lab' => $praktikum->kepengurusanLab->laboratorium
        ]);
    }

    /**
     * Store a newly created tugas
     */
    public function store(Request $request, $praktikumId)
    {
        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // Max 10MB
            'deadline' => 'required|date|after:now',
            'kelas_id' => 'nullable|exists:kelas,id', // Optional: if null, tugas for all kelas
        ]);

        // Normalisasi deadline ke format datetime (kolom bertipe datetime) dengan timezone aplikasi
        $appTz = config('app.timezone', 'Asia/Jakarta');
        $deadlineCarbon = null;
        // Coba parse dari input datetime-local (YYYY-MM-DDTHH:mm)
        try {
            $deadlineCarbon = Carbon::createFromFormat('Y-m-d\TH:i', (string) $request->deadline, $appTz);
        } catch (\Throwable $e) {
            // Fallback parse bebas
            $deadlineCarbon = Carbon::parse($request->deadline, $appTz);
        }
        // Simpan sebagai waktu lokal aplikasi tanpa mengubah ke UTC
        $deadline = $deadlineCarbon->format('Y-m-d H:i:s');

        $data = [
            'praktikum_id' => $praktikumId,
            'kelas_id' => $request->kelas_id,
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
        $tugas = TugasPraktikum::findOrFail($id);

        $request->validate([
            'judul_tugas' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'file_tugas' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'deadline' => 'required|date',
            'kelas_id' => 'nullable|exists:kelas,id',
            'status' => 'required|in:aktif,nonaktif'
        ]);

        // Normalisasi deadline ke format datetime (kolom bertipe datetime) dengan timezone aplikasi
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
            'status' => $request->status
        ];

        if ($request->hasFile('file_tugas')) {
            // Delete old file
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
        $tugas = TugasPraktikum::findOrFail($id);
        
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
        $tugas = TugasPraktikum::findOrFail($id);
        
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


         // Serve file langsung dari storage
        if (!Storage::disk('public')->exists($tugas->file_tugas)) {
            abort(404, 'File tidak ditemukan di storage');
        }

        $filename = basename($tugas->file_tugas);
        $originalFilename = preg_replace('/^\d+_/', '', $filename);
        
        return Storage::disk('public')->download($tugas->file_tugas, $originalFilename);
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
