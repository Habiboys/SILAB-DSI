<?php

namespace App\Http\Controllers;


use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use App\Models\RiwayatKeuangan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class RiwayatKeuanganController extends Controller
{
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $jenis = $request->input('jenis');
        
        // Jika tidak ada tahun yang dipilih, gunakan tahun aktif
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();
        
        $riwayatKeuangan = [];
        $kepengurusanlab = null;
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $saldo = 0;

        if ($lab_id && $tahun_id) {
            // Cari kepengurusan lab berdasarkan lab_id dan tahun_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            // Jika kepengurusan lab ditemukan, ambil riwayat keuangannya
            if ($kepengurusanlab) {
                $query = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->with('user');
                
                // Filter berdasarkan jenis jika ada
                if ($jenis) {
                    $query->where('jenis', $jenis);
                }
                
                $riwayatKeuangan = $query
                ->orderBy('tanggal', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
                
                // Hitung total pemasukan dan pengeluaran
                $totalPemasukan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->where('jenis', 'masuk')
                    ->sum('nominal');
                    
                $totalPengeluaran = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->where('jenis', 'keluar')
                    ->sum('nominal');
                    
                $saldo = $totalPemasukan - $totalPengeluaran;
            }
        }
        $asisten = User::whereHas('struktur', function($query) use ($kepengurusanlab) {
            $query->where('kepengurusan_lab_id', $kepengurusanlab ? $kepengurusanlab->id : null);
        })
        ->whereHas('profile', function($query) {
            $query->whereNotNull('nomor_anggota');
        })
        ->with(['profile', 'struktur'])
        ->get();


        // dd($asisten);
        return Inertia::render('RiwayatKeuangan', [
            'riwayatKeuangan' => $riwayatKeuangan,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'asisten'=> $asisten,
            'keuanganSummary' => [
                'totalPemasukan' => $totalPemasukan,
                'totalPengeluaran' => $totalPengeluaran,
                'saldo' => $saldo
            ],
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'jenis' => $jenis,
            ]
        ]);
    }
    
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:500',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string', // Menerima base64 string
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
        ]);
        
        // Add the authenticated user's ID automatically
        $validatedData['user_id'] = auth()->id();
        
        // Default bukti to null atau '-' sesuai kebutuhan
        $validatedData['bukti'] = null;
        
        // Handle bukti jika dikirim sebagai base64
        if ($request->filled('bukti') && preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {
            // Decode base64 data
            $buktiData = substr($request->bukti, strpos($request->bukti, ',') + 1);
            $buktiData = base64_decode($buktiData);
            
            // Tentukan ekstensi file
            $mimeType = explode(':', substr($request->bukti, 0, strpos($request->bukti, ';')))[1];
            $extension = explode('/', $mimeType)[1];
            
            // Validasi ekstensi file gambar yang diperbolehkan
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            if (!in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['bukti' => 'File harus berupa gambar (jpg, jpeg, png, gif)']);
            }
            
            // Buat nama file dengan format: bukti-timestamp-original_name
            // Gunakan deskripsi sebagai nama original (dengan sanitasi)
            $safeName = preg_replace('/[^a-z0-9]+/', '-', strtolower($validatedData['deskripsi']));
            $safeName = substr($safeName, 0, 30); // Batasi panjang nama file
            $fileName = "bukti-" . time() . "-" . $safeName . "." . $extension;
            
            // Pastikan direktori bukti ada
            $directory = 'bukti';
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }
            
            // Path lengkap untuk file
            $path = $directory . '/' . $fileName;
            
            // Simpan file
            Storage::disk('public')->put($path, $buktiData);
            
            // Simpan path ke database
            $validatedData['bukti'] = $path;
        }
    
        RiwayatKeuangan::create($validatedData);
    
        return back()->with('message', 'Riwayat keuangan berhasil ditambahkan');
    }

    public function update(Request $request, RiwayatKeuangan $riwayatKeuangan)
    {
        // Validate with clear rules
        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:0',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string', // Untuk menerima base64 string atau teks "hapus" untuk menghapus bukti
            // User ID and kepengurusan_lab_id are usually not changed
        ]);
        
        // Log validated data for debugging
        \Log::info('Validated Data:', $validatedData);
        
        // Handle bukti jika ada
        if ($request->filled('bukti')) {
            // Jika ada permintaan untuk menghapus bukti
            if ($request->bukti === 'hapus') {
                // Hapus file lama jika ada
                if ($riwayatKeuangan->bukti && Storage::disk('public')->exists($riwayatKeuangan->bukti)) {
                    Storage::disk('public')->delete($riwayatKeuangan->bukti);
                }
                $validatedData['bukti'] = null;
            }
            // Jika ada upload bukti baru (base64)
            elseif (preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {
                // Decode base64 data
                $buktiData = substr($request->bukti, strpos($request->bukti, ',') + 1);
                $buktiData = base64_decode($buktiData);
                
                // Tentukan ekstensi file
                $mimeType = explode(':', substr($request->bukti, 0, strpos($request->bukti, ';')))[1];
                $extension = explode('/', $mimeType)[1];
                
                // Validasi ekstensi file gambar yang diperbolehkan
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($extension, $allowedExtensions)) {
                    return back()->withErrors(['bukti' => 'File harus berupa gambar (jpg, jpeg, png, gif)']);
                }
                
                // Buat nama file dengan format: bukti-timestamp-original_name
                $safeName = preg_replace('/[^a-z0-9]+/', '-', strtolower($validatedData['deskripsi']));
                $safeName = substr($safeName, 0, 30); // Batasi panjang nama file
                $fileName = "bukti-" . time() . "-" . $safeName . "." . $extension;
                
                // Pastikan direktori bukti ada
                $directory = 'bukti';
                if (!Storage::disk('public')->exists($directory)) {
                    Storage::disk('public')->makeDirectory($directory);
                }
                
                // Path lengkap untuk file
                $path = $directory . '/' . $fileName;
                
                // Simpan file baru
                Storage::disk('public')->put($path, $buktiData);
                
                // Hapus file lama jika ada
                if ($riwayatKeuangan->bukti && Storage::disk('public')->exists($riwayatKeuangan->bukti)) {
                    Storage::disk('public')->delete($riwayatKeuangan->bukti);
                }
                
                // Update path di data yang akan disimpan
                $validatedData['bukti'] = $path;
            }
        } else {
            // Jika tidak ada perubahan bukti, jangan update field bukti
            unset($validatedData['bukti']);
        }
        
        // Update the record
        $result = $riwayatKeuangan->update($validatedData);
        
        // Log the result for debugging
        \Log::info('Update result:', ['success' => $result]);
    
        return back()->with('message', 'Riwayat keuangan berhasil diperbarui');
    }
    
    public function destroy(RiwayatKeuangan $riwayatKeuangan)
    {
        $riwayatKeuangan->delete();

        return back()->with('message', 'Riwayat keuangan berhasil dihapus');
    }
    
    public function export(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        if (!$lab_id || !$tahun_id) {
            return back()->with('error', 'Pilih laboratorium dan tahun kepengurusan terlebih dahulu');
        }
        
        // Cari kepengurusan lab
        $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->with(['tahunKepengurusan', 'laboratorium'])
            ->first();
            
        if (!$kepengurusanlab) {
            return back()->with('error', 'Data kepengurusan lab tidak ditemukan');
        }
        
        // Ambil semua riwayat keuangan
        $riwayatKeuangan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
            ->with('user')
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')  // Menambahkan pengurutan berdasarkan waktu pembuatan
            ->get();
            
        // Hitung total pemasukan, pengeluaran, dan saldo
        $totalPemasukan = $riwayatKeuangan->where('jenis', 'masuk')->sum('nominal');
        $totalPengeluaran = $riwayatKeuangan->where('jenis', 'keluar')->sum('nominal');
        $saldo = $totalPemasukan - $totalPengeluaran;
        
        // Buat nama file untuk export
        $filename = 'Laporan_Keuangan_' . $kepengurusanlab->laboratorium->nama . '_' . 
                    $kepengurusanlab->tahunKepengurusan->tahun . '.pdf';
        
        // Logic untuk generate PDF bisa ditambahkan di sini
        // Contoh: return PDF::loadView('pdf.laporan-keuangan', [...])->download($filename);
        
        // Karena ini hanya contoh, kita kembalikan response saja
        return response()->json([
            'message' => 'Export fitur belum diimplementasikan',
            'data' => [
                'lab' => $kepengurusanlab->laboratorium->nama,
                'tahun' => $kepengurusanlab->tahunKepengurusan->tahun,
                'total_records' => count($riwayatKeuangan),
                'total_pemasukan' => $totalPemasukan,
                'total_pengeluaran' => $totalPengeluaran,
                'saldo' => $saldo
            ]
        ]);
    }
}