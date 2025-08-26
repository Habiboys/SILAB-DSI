<?php
namespace App\Http\Controllers;
use App\Models\ModulPraktikum;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ModulPraktikumController extends Controller
{
    public function index(Praktikum $praktikum)
    {
        // Parameter berubah dari $praktikum_id menjadi model Praktikum
        $praktikum->load('modulPraktikum');
        
        return Inertia::render('ModulPraktikum', [
            'praktikum' => $praktikum,
            'modulPraktikum' => $praktikum->modulPraktikum
        ]);
    }
    
   
    public function store(Request $request, Praktikum $praktikum)
    {
        // Debug logging
        \Log::info('ModulPraktikum store called', [
            'request_data' => $request->all(),
            'has_file' => $request->hasFile('modul'),
            'file_size' => $request->file('modul') ? $request->file('modul')->getSize() : 'no file',
            'max_upload_size' => ini_get('upload_max_filesize'),
            'max_post_size' => ini_get('post_max_size')
        ]);
        
        $request->validate([
            'pertemuan' => 'required|integer|min:1',
            'judul' => 'required|string|max:255',
            'modul' => 'required|file|mimes:pdf|max:10240', // PDF only, Max 10MB
        ]);
        
        try {
            // Get mata_kuliah from praktikum table
            $mataKuliah = $praktikum->mata_kuliah;
            
            // Clean up the mata_kuliah, pertemuan, and judul for filename
            $cleanMataKuliah = str_replace(' ', '_', $mataKuliah);
            $cleanPertemuan = $request->pertemuan;
            $cleanJudul = str_replace(' ', '_', $request->judul);
            
            // Create a unique filename using the specified format
            $fileName = $cleanMataKuliah . '_' . $cleanPertemuan . '_' . $cleanJudul . '.' . $request->file('modul')->extension();
            
            \Log::info('Attempting to store file', [
                'filename' => $fileName,
                'storage_path' => 'modul_praktikum'
            ]);
            
            // Store file with custom filename
            $filePath = $request->file('modul')->storeAs('modul_praktikum', $fileName, 'public');
            
            \Log::info('File stored successfully', ['file_path' => $filePath]);
            
            // Generate hash for public access if needed
            $hash = null;
            if ($request->input('is_public', false)) {
                $hash = \Str::random(32);
            }

            // Create the database record with the file path
            ModulPraktikum::create([
                'praktikum_id' => $praktikum->id,
                'pertemuan' => $request->pertemuan,
                'judul' => $request->judul,
                'modul' => $filePath, // Store the path
                'is_public' => $request->input('is_public', false), // Default false
                'hash' => $hash,
            ]);
            
            \Log::info('Database record created successfully');
            
            // Redirect with success message
            return redirect()->route('praktikum.modul.index', $praktikum)
                ->with('success', 'Modul praktikum berhasil ditambahkan.');
                
        } catch (\Exception $e) {
            \Log::error('Error in ModulPraktikum store', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['modul' => 'Gagal upload file: ' . $e->getMessage()]);
        }
    }
    
    public function update(Request $request, $praktikumId, $modulId)
    {
        $request->validate([
            'pertemuan' => 'required|integer|min:1',
            'judul' => 'required|string|max:255',
            'modul' => 'nullable|file|mimes:pdf|max:10240', // PDF only, Max 10MB
        ]);
        
        // Find the records
        $modulPraktikum = ModulPraktikum::findOrFail($modulId);
        $praktikum = Praktikum::findOrFail($praktikumId);
        
        // Check if pertemuan or judul have changed
        $pertemuanChanged = $modulPraktikum->pertemuan != $request->pertemuan;
        $judulChanged = $modulPraktikum->judul != $request->judul;
        
        // Update basic fields
        $modulPraktikum->pertemuan = $request->pertemuan;
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
        $cleanPertemuan = $request->pertemuan;
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
    
    // For PDFs, return a response that will display in the browser
    if ($mimeType === 'application/pdf') {
        return response()->file(
            storage_path('app/public/' . $filePath),
            [
                'Content-Disposition' => 'inline; filename="' . $originalFilename . '"',
            ]
        );
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
        
        // Return the PDF viewer view
        return view('pdf-viewer', compact('modul', 'praktikum', 'filePath', 'isPdf'));
    }
}