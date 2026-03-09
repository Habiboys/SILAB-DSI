<?php
namespace App\Http\Controllers;
use App\Models\ModulPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ModulPraktikumController extends Controller
{
    // Note: Authorization handled via route middleware

    public function studentIndex()
    {
        $user = auth()->user();

        // Find praktikan profile for current user
        $praktikan = \App\Models\Praktikan::where('user_id', $user->id)->first();

        $praktikumList = [];

        if ($praktikan) {
            // Get practicums where student is enrolled with pivot data
            $praktikumList = $praktikan->praktikums()
                ->get()
                ->map(function ($praktikum) {
                    // Get student's class for this praktikum
                    $kelasId = $praktikum->pivot->kelas_id;

                    // Load modul untuk kelas ini (langsung query, bukan via relationship)
                    $modul = \App\Models\ModulPraktikum::where(function($q) use ($kelasId) {
                            $q->whereNull('pertemuan_id') // Modul global tanpa pertemuan
                              ->orWhereHas('pertemuan', function ($q2) use ($kelasId) {
                                  $q2->where('kelas_id', $kelasId)->orWhereNull('kelas_id');
                              });
                        })
                        ->with('pertemuan')
                        ->orderBy('created_at', 'desc')
                        ->get();
                    $praktikum->setRelation('modulPraktikum', $modul);

                    return $praktikum;
                });
        }

        return Inertia::render('Student/ModulIndex', [
            'praktikumList' => $praktikumList
        ]);
    }

    public function index(Request $request, Praktikum $praktikum)
    {
        $praktikum->load(['kelas' => fn($q) => $q->where('status', 'aktif')->orderBy('nama_kelas')]);

        $query = ModulPraktikum::whereHas('pertemuan', function ($q) use ($praktikum) {
                $q->whereHas('kelas', function ($q2) use ($praktikum) {
                    $q2->where('praktikum_id', $praktikum->id);
                });
            })
            ->with(['pertemuan.kelas'])
            ->orderBy('created_at', 'desc');

        // Search
        if ($request->has('search')) {
            $query->where('judul', 'like', '%' . $request->search . '%');
        }

        // Filter by Class
        if ($request->has('kelas_id') && $request->kelas_id != 'all') {
            $query->whereHas('pertemuan', function ($q) use ($request) {
                $q->where('kelas_id', $request->kelas_id);
            });
        }

        // Filter by Meeting
        if ($request->has('pertemuan_id') && $request->pertemuan_id) {
            $query->where('pertemuan_id', $request->pertemuan_id);
        }

        $modulPraktikum = $query->get();

        // Get list of pertemuan for dropdown (grouped by class if needed)
        // Format date for better display
        $pertemuanList = $praktikum->pertemuan()
            ->with('kelas')
            ->orderBy('tanggal', 'asc')
            ->get()
            ->map(function ($pertemuan) {
                $pertemuan->formatted_tanggal = \Carbon\Carbon::parse($pertemuan->tanggal)->format('d M Y');
                return $pertemuan;
            });

        // Use praktikum.kelas for hierarchy (parent + subkelas)
        $kelas = $praktikum->kelas;

        return Inertia::render('ModulPraktikum', [
            'praktikum' => $praktikum,
            'modulPraktikum' => $modulPraktikum,
            'pertemuanList' => $pertemuanList,
            'kelas' => $kelas,
            'filters' => $request->only(['search', 'kelas_id', 'pertemuan_id']),
            'flash' => [
                'message' => session('message'),
                'error' => session('error')
            ]
        ]);
    }


    private function validateEnrollmentKelas(?string $kelasId): ?string
    {
        if (!$kelasId) return null;
        $hasSubKelas = \App\Models\Kelas::where('parent_kelas_id', $kelasId)->exists();
        if ($hasSubKelas) {
            return 'Pertemuan ini masih di kelas induk yang punya sub-kelas. Pilih pertemuan dari sub-kelas.';
        }
        return null;
    }

    public function store(Request $request, Praktikum $praktikum)
    {
        $request->validate([
            'pertemuan_id' => 'required|exists:pertemuan_praktikum,id',
            'judul' => 'required|string|max:255',
            'modul' => 'required|file|mimes:pdf|max:10240', // PDF only, Max 10MB
        ]);

        try {
            $pertemuan = \App\Models\PertemuanPraktikum::with('kelas')->findOrFail($request->pertemuan_id);
            if ($pertemuan->kelas_id && ($err = $this->validateEnrollmentKelas($pertemuan->kelas_id))) {
                return back()->withErrors(['pertemuan_id' => $err])->withInput();
            }
            $mataKuliah = $praktikum->mata_kuliah;

            // Cleanup filename
            $cleanMataKuliah = str_replace(' ', '_', $mataKuliah);
            $cleanJudul = str_replace(' ', '_', $request->judul);
            // Use pertemuan tanggal or id for uniqueness since 'pertemuan ke-X' is not strictly stored anymore
            $cleanPertemuan = $pertemuan->id;

            $fileName = "{$cleanMataKuliah}_{$cleanPertemuan}_{$cleanJudul}." . $request->file('modul')->extension();

            $filePath = $request->file('modul')->storeAs('modul_praktikum', $fileName, 'public');

            // Generate hash
            $hash = null;
            if ($request->input('is_public', false)) {
                $hash = \Str::random(32);
            }

            ModulPraktikum::create([
                'pertemuan_id' => $pertemuan->id,
                'judul' => $request->judul,
                'modul' => $filePath,
                'is_public' => $request->input('is_public', false),
                'hash' => $hash,
            ]);

            return redirect()->back()->with('success', 'Modul praktikum berhasil ditambahkan.');

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal upload file: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $praktikumId, $modulId)
    {
        $request->validate([
            'pertemuan_id' => 'required|exists:pertemuan_praktikum,id',
            'judul' => 'required|string|max:255',
            'modul' => 'nullable|file|mimes:pdf|max:10240', // PDF only, Max 10MB
        ]);

        // Find the records
        $modulPraktikum = ModulPraktikum::findOrFail($modulId);
        $praktikum = Praktikum::findOrFail($praktikumId);
        $pertemuan = \App\Models\PertemuanPraktikum::with('kelas')->findOrFail($request->pertemuan_id);

        if ($pertemuan->kelas_id && ($err = $this->validateEnrollmentKelas($pertemuan->kelas_id))) {
            return back()->withErrors(['pertemuan_id' => $err])->withInput();
        }

        // Check if pertemuan or judul have changed
        $pertemuanChanged = $modulPraktikum->pertemuan_id != $request->pertemuan_id;
        $judulChanged = $modulPraktikum->judul != $request->judul;

        // Update basic fields
        $modulPraktikum->pertemuan_id = $request->pertemuan_id;
        $modulPraktikum->judul = $request->judul;

        // Update is_public and hash
        $isPublic = $request->input('is_public', false);
        $modulPraktikum->is_public = $isPublic;

        // Generate or remove hash based on public status
        if ($isPublic && !$modulPraktikum->hash) {
            $modulPraktikum->hash = \Str::random(32);
        } elseif (!$isPublic) {
            $modulPraktikum->hash = null;
        }

        // Get mata_kuliah from praktikum table
        $mataKuliah = $praktikum->mata_kuliah;

        // Clean up values for filename
        $cleanMataKuliah = str_replace(' ', '_', $mataKuliah);
        $cleanPertemuan = $pertemuan->id; // Use pertemuan UUID for uniqueness
        $cleanJudul = str_replace(' ', '_', $request->judul);

        // Create the base filename format (without extension)
        $baseFileName = $cleanMataKuliah . '_' . $cleanPertemuan . '_' . $cleanJudul;

        // If a new file is uploaded
        if ($request->hasFile('modul')) {
            // Delete the old file if it exists
            if ($modulPraktikum->modul) {
                Storage::disk('public')->delete($modulPraktikum->modul);
            }

            // Get extension from the uploaded file
            $extension = $request->file('modul')->extension();

            // Create full filename with extension
            $fileName = $baseFileName . '.' . $extension;

            // Store the new file
            $filePath = $request->file('modul')->storeAs('modul_praktikum', $fileName, 'public');

            // Update the file path in the database
            $modulPraktikum->modul = $filePath;
        }
        // If no new file but pertemuan or judul changed, rename the existing file
        else if ($pertemuanChanged || $judulChanged) {
            if ($modulPraktikum->modul) {
                // Get current file path and details
                $oldPath = $modulPraktikum->modul;
                $extension = pathinfo(Storage::path('public/' . $oldPath), PATHINFO_EXTENSION);

                // Create new filename with updated values
                $newFileName = $baseFileName . '.' . $extension;
                $newFilePath = 'modul_praktikum/' . $newFileName;

                // Rename the file in storage
                if (Storage::disk('public')->exists($oldPath)) {
                    // Copy and delete approach for renaming
                    Storage::disk('public')->copy($oldPath, $newFilePath);
                    Storage::disk('public')->delete($oldPath);

                    // Update the path in the database
                    $modulPraktikum->modul = $newFilePath;
                }
            }
        }

        $modulPraktikum->save();

        return redirect()->route('praktikum.modul.index', $praktikumId)
            ->with('success', 'Modul praktikum berhasil diperbarui.');
    }

    public function destroy(Praktikum $praktikum, ModulPraktikum $modul)
    {
        // Delete the file
        if ($modul->modul) {
            $filePath = str_replace('/storage/', '', $modul->modul);
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }
        }

        $modul->delete();

        return redirect()->route('praktikum.modul.index', $praktikum);
    }

public function view(Praktikum $praktikum, ModulPraktikum $modul)
{
    // Check if the file exists
    if (!$modul->modul) {
        abort(404, 'File tidak ditemukan');
    }

    $filePath = str_replace('/storage/', '', $modul->modul);

    if (!Storage::disk('public')->exists($filePath)) {
        abort(404, 'File tidak ditemukan');
    }

    // Get the original filename from the path
    $originalFilename = basename($modul->modul);

    // Get the file's MIME type
    $mimeType = Storage::disk('public')->mimeType($filePath);

    // For PDFs, return the custom React component viewer to prevent downloading
    if ($mimeType === 'application/pdf') {
        $fileUrl = asset('storage/' . $filePath);

        return Inertia::render('PublicModulViewer', [
            'modul' => $modul,
            'praktikum' => $praktikum,
            'fileUrl' => $fileUrl,
            'isPdf' => true
        ]);
    }

    // For other file types, you might want to force download instead
    return response()->download(
        storage_path('app/public/' . $filePath),
        $originalFilename
    );
}

    /**
     * Toggle share link status
     */
    public function toggleShareLink(Request $request, Praktikum $praktikum, ModulPraktikum $modul)
    {
        $isPublic = !$modul->is_public;

        // Generate or remove hash based on public status
        $hash = null;
        if ($isPublic) {
            $hash = \Str::random(32);
        }

        $modul->update([
            'is_public' => $isPublic,
            'hash' => $hash
        ]);

        return back()->with([
            'success' => true,
            'is_public' => $isPublic,
            'hash' => $hash,
            'message' => $isPublic ? 'Link berhasil dibuka' : 'Link berhasil ditutup'
        ]);
    }

    /**
     * View public modul with hash (view only, no download)
     */
    public function viewPublic($hash)
    {
        $modul = ModulPraktikum::where('hash', $hash)
            ->where('is_public', true)
            ->first();

        if (!$modul) {
            abort(404, 'Modul tidak ditemukan atau tidak tersedia untuk publik');
        }

        // Check if the file exists
        if (!$modul->modul) {
            abort(404, 'File tidak ditemukan');
        }

        $filePath = str_replace('/storage/', '', $modul->modul);

        if (!Storage::disk('public')->exists($filePath)) {
            abort(404, 'File tidak ditemukan');
        }

        // Get the file's MIME type
        $mimeType = Storage::disk('public')->mimeType($filePath);
        $isPdf = $mimeType === 'application/pdf';

        // Get praktikum data for the view
        $praktikum = $modul->praktikum;

        // Build the file URL for the PDF viewer - use direct storage URL
        $fileUrl = asset('storage/' . $filePath);

        // Return the React component using Inertia
        return Inertia::render('PublicModulViewer', [
            'modul' => $modul,
            'praktikum' => $praktikum,
            'fileUrl' => $fileUrl,
            'isPdf' => $isPdf
        ]);
    }
}
