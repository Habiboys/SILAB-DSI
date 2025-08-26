<?php

namespace App\Http\Controllers;

use App\Models\Surat;
use App\Models\User;
use App\Models\Struktur;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SuratController extends Controller
{
    /**
     * Display the letter creation form
     */
    public function createSurat()
    {
        // Get all users that could be letter recipients (with their roles)
        $penerima = User::with(['profile', 'struktur', 'laboratory'])
            ->whereHas('struktur') // Only get users with a role
            ->get();

        return Inertia::render('KirimSurat', [
            'penerima' => $penerima
        ]);
    }

    /**
     * Store a new letter in storage
     */
    public function storeSurat(Request $request)
    {
        $request->validate([
            'nomor_surat' => 'required|string|max:255',
            'tanggal_surat' => 'required|date',
            'penerima_id' => 'required|exists:users,id',
            'perihal' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf|max:5120', // Increased to 5MB
        ]);

        try {
            // Store the file
            $file = $request->file('file');
            $fileName = time() . '_' . Str::slug($request->perihal) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('surat', $fileName, 'public');

            // Create the letter record
            $surat = new Surat();
            $surat->nomor_surat = $request->nomor_surat;
            $surat->tanggal_surat = $request->tanggal_surat;
            $surat->pengirim = Auth::id(); // Current user is the sender
            $surat->penerima = $request->penerima_id;
            $surat->perihal = $request->perihal;
            $surat->file = $filePath;
            $surat->isread = false; // New letter is unread
            $surat->save();

            return redirect()->route('surat.kirim')->with('message', 'Surat berhasil dikirim');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengirim surat: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display incoming letters
     */
    public function suratMasuk(Request $request)
    {
        $query = Surat::where('penerima', Auth::id())
            ->with(['pengirim']);

        // Apply search if provided
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_surat', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
            });
        }

        // Apply date filter if provided
        if ($request->has('tanggal') && !empty($request->tanggal)) {
            $query->whereDate('tanggal_surat', $request->tanggal);
        }

        // Get the letters ordered by date
        $suratMasuk = $query->orderBy('tanggal_surat', 'desc')->get();

        return Inertia::render('SuratMasuk', [
            'suratMasuk' => $suratMasuk,
            'filters' => [
                'search' => $request->search ?? '',
                'tanggal' => $request->tanggal ?? '',
            ]
        ]);
    }

    /**
     * Display outgoing letters
     */
    public function suratKeluar(Request $request)
    {
        $query = Surat::where('pengirim', Auth::id())
            ->with(['penerima']);

        // Apply search if provided
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_surat', 'like', "%{$search}%")
                  ->orWhere('perihal', 'like', "%{$search}%");
            });
        }

        // Apply date filter if provided
        if ($request->has('tanggal') && !empty($request->tanggal)) {
            $query->whereDate('tanggal_surat', $request->tanggal);
        }

        // Get the letters ordered by date
        $suratKeluar = $query->orderBy('tanggal_surat', 'desc')->get();

        return Inertia::render('SuratKeluar', [
            'suratKeluar' => $suratKeluar,
            'filters' => [
                'search' => $request->search ?? '',
                'tanggal' => $request->tanggal ?? '',
            ]
        ]);
    }

    /**
     * View letter details
     */
    public function viewSurat($id)
    {
        $surat = Surat::with(['pengirim.profile', 'pengirim.struktur', 'penerima.profile', 'penerima.struktur'])
            ->findOrFail($id);

        // Check if user has access to this letter
        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk melihat surat ini');
        }

        // If viewing as recipient, mark as read
        if ($surat->penerima == Auth::id() && !$surat->isread) {
            $surat->isread = true;
            $surat->save();
        }

        return Inertia::render('DetailSurat', [
            'surat' => $surat
        ]);
    }

    /**
     * Download letter file
     */
    public function downloadSurat($id)
    {
        $surat = Surat::findOrFail($id);

        // Check if user has access to this letter
        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return response('Anda tidak memiliki akses untuk mengunduh surat ini', 403);
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($surat->file)) {
            return response('File surat tidak ditemukan', 404);
        }

        $filePath = storage_path('app/public/' . $surat->file);
        
        // Check if request wants to view inline or download
        if (request()->has('download')) {
            // Generate filename for download
            $downloadName = Str::slug($surat->perihal) . '_' . $surat->nomor_surat . '.pdf';
            return response()->download($filePath, $downloadName);
        } else {
            // For preview, display inline
            return response()->file($filePath);
        }
    }

    /**
     * Preview letter file
     */
    public function previewSurat($id)
    {
        $surat = Surat::findOrFail($id);

        // Check if user has access to this letter
        if ($surat->pengirim !== Auth::id() && $surat->penerima !== Auth::id()) {
            return response('Anda tidak memiliki akses untuk melihat surat ini', 403);
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($surat->file)) {
            return response('File surat tidak ditemukan', 404);
        }

        $filePath = storage_path('app/public/' . $surat->file);
        
        // Return the file as a response
        return response()->file($filePath);
    }

    /**
     * Mark a letter as read
     */
    public function markAsRead($id)
    {
        $surat = Surat::findOrFail($id);

        // Check if user is the recipient
        if ($surat->penerima !== Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk membaca surat ini');
        }

        // Mark as read
        $surat->isread = true;
        $surat->save();

        return redirect()->back()->with('message', 'Surat telah ditandai sebagai dibaca');
    }

    /**
     * Get count of unread letters for current user
     */
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