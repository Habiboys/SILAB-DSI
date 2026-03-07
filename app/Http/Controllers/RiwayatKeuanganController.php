<?php

namespace App\Http\Controllers;


use App\Models\KepengurusanLab;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use App\Models\PemasukanKeuangan;
use App\Models\PengeluaranKeuangan;
use App\Models\User;
use App\Models\NominalKas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class RiwayatKeuanganController extends Controller
{
    // Note: Authorization handled via route middleware

    public function index(Request $request)
    {
        // NEW: Accept kepengurusan_lab_id directly (preferred)
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        // BACKWARD COMPATIBILITY: Also accept lab_id + tahun_id
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $jenis = $request->input('jenis');

        $kepengurusanlab = null;

        // Try to get kepengurusan_lab by ID first (most efficient)
        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }
        // Fallback: lookup by lab_id + tahun_id
        else {
            if (!$tahun_id) {
                $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
                $tahun_id = $tahunAktif ? $tahunAktif->id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();

        $riwayatKeuangan = [];
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $saldo = 0;

        // Ambil filter tambahan
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        // Jika kepengurusan lab ditemukan, ambil riwayat keuangannya
        if ($kepengurusanlab) {
            // Pemasukan query
            $pemasukanQuery = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with(['user', 'kepengurusanLab.tahunKepengurusan']);

            // Pengeluaran query
            $pengeluaranQuery = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with(['user', 'kepengurusanLab.tahunKepengurusan']);

            // Filter jenis
            if ($jenis === 'masuk') {
                if ($search) $pemasukanQuery->where('deskripsi', 'like', "%{$search}%");
                $riwayatKeuangan = $pemasukanQuery->orderBy('tanggal', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage)
                    ->withQueryString();
            } elseif ($jenis === 'keluar') {
                if ($search) $pengeluaranQuery->where('deskripsi', 'like', "%{$search}%");
                $riwayatKeuangan = $pengeluaranQuery->orderBy('tanggal', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage)
                    ->withQueryString();
            } else {
                // Merge both: get all and manually paginate
                if ($search) {
                    $pemasukanQuery->where('deskripsi', 'like', "%{$search}%");
                    $pengeluaranQuery->where('deskripsi', 'like', "%{$search}%");
                }
                $allItems = $pemasukanQuery->orderBy('tanggal', 'desc')->get()
                    ->merge($pengeluaranQuery->orderBy('tanggal', 'desc')->get())
                    ->sortByDesc('tanggal')
                    ->values();

                // Manual pagination
                $page = request()->get('page', 1);
                $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
                    $allItems->forPage($page, $perPage),
                    $allItems->count(),
                    $perPage,
                    $page,
                    ['path' => request()->url(), 'query' => request()->query()]
                );
                $riwayatKeuangan = $paginator;
            }

            // Hitung total pemasukan dan pengeluaran
            $totalPemasukan = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->sum('nominal');

            $totalPengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->sum('nominal');

            $saldo = $totalPemasukan - $totalPengeluaran;
        }

        // Get only assistant users for the dropdown based on laboratory
        $asisten = collect([]);
        if ($kepengurusanlab) {
            $asisten = User::whereHas('kepengurusan', function ($query) use ($kepengurusanlab) {
                $query->where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->whereHas('struktur', function ($q) {
                        $q->whereHas('defaultRole', function ($r) {
                            $r->where('name', 'asisten');
                        });
                    });
            })

                ->with('profile')
                ->orderBy('name')
                ->get();
        }

        // Ambil data nominal kas jika kepengurusan lab ada
        $nominalKas = [];
        if ($kepengurusanlab) {
            $nominalKas = NominalKas::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('RiwayatKeuangan', [
            'riwayatKeuangan' => $riwayatKeuangan,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'asisten' => $asisten,
            'nominalKas' => $nominalKas,
            'totalPemasukan' => $totalPemasukan,
            'totalPengeluaran' => $totalPengeluaran,
            'saldo' => $saldo,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
                'kepengurusan_lab_id' => $kepengurusanlab ? $kepengurusanlab->id : null,
                'search' => $search,
                'perPage' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        // Debug: Log request data
        \Illuminate\Support\Facades\Log::info('Store request data:', $request->all());

        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:500',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string',
            'lab_id' => 'required|exists:laboratorium,id', // Tambahkan validasi lab_id
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'user_id' => 'nullable|string|exists:users,id',
            'is_uang_kas' => 'nullable|boolean',
            'jenis_pembayaran_kas' => 'nullable|in:normal,lebih',
            'catatan_pembayaran' => 'nullable|string|max:500',
        ]);

        // Debug: Log validated data
        \Illuminate\Support\Facades\Log::info('Validated data:', $validatedData);

        // Set is_uang_kas default value to false if not present
        $validatedData['is_uang_kas'] = $request->has('is_uang_kas') ? (bool)$request->is_uang_kas : false;

        if (!isset($validatedData['user_id'])) {
            $validatedData['user_id'] = auth()->id();
        }

        // Check if this is a kas payment and validate based on nominal kas
        if ($validatedData['is_uang_kas'] === true) {
            // Get active nominal kas for this kepengurusan
            $nominalKas = \App\Models\NominalKas::getActiveNominalKas($validatedData['kepengurusan_lab_id']);

            if (!$nominalKas) {
                return back()->withErrors([
                    'is_uang_kas' => 'Nominal kas belum ditetapkan untuk kepengurusan ini. Silakan hubungi admin untuk menetapkan nominal kas.'
                ])->withInput();
            }

            // Debug: Log nominal kas info
            \Illuminate\Support\Facades\Log::info('Nominal Kas Info:', [
                'nominal' => $nominalKas->nominal,
                'periode' => $nominalKas->periode,
                'payment_nominal' => $validatedData['nominal']
            ]);

            // Validate minimum payment amount
            if ($validatedData['nominal'] < $nominalKas->nominal) {
                return back()->withErrors([
                    'nominal' => 'Nominal pembayaran uang kas minimal ' . number_format((float)$nominalKas->nominal, 0, ',', '.') . ' untuk periode ' . $nominalKas->periode
                ])->withInput();
            }

            // Set default jenis pembayaran jika tidak diisi
            if (!isset($validatedData['jenis_pembayaran_kas']) || empty($validatedData['jenis_pembayaran_kas'])) {
                if ($validatedData['nominal'] > $nominalKas->nominal) {
                    // Jika nominal lebih besar dari nominal kas, tanyakan jenis pembayaran
                    return back()->withErrors([
                        'jenis_pembayaran_kas' => 'Nominal pembayaran melebihi nominal kas. Silakan pilih jenis pembayaran: Normal (untuk periode selanjutnya) atau Lebih (bonus/tambahan)'
                    ])->withInput();
                } else {
                    $validatedData['jenis_pembayaran_kas'] = 'normal';
                }
            }

            // Tidak ada cek duplikasi - sistem mengizinkan pembayaran kapan saja
            // Logika pembayaran berlebih akan dihitung di halaman catatan kas
        }

        // Default bukti null
        $validatedData['bukti'] = null;

        // Handle bukti jika dikirim sebagai base64
        if ($request->filled('bukti') && preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {

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

            // Simpan file
            Storage::disk('public')->put($path, $buktiData);

            // Simpan path ke database
            $validatedData['bukti'] = $path;
        }

        if ($validatedData['jenis'] === 'masuk') {
            PemasukanKeuangan::create($validatedData);
        } else {
            PengeluaranKeuangan::create($validatedData);
        }

        return back()->with('message', 'Riwayat keuangan berhasil ditambahkan');
    }

    public function update(Request $request, string $id)
    {
        // Find in pemasukan or pengeluaran
        $riwayatKeuangan = PemasukanKeuangan::find($id) ?? PengeluaranKeuangan::findOrFail($id);

        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:0',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string',
            // User ID and kepengurusan_lab_id tidak diganti
        ]);


        \Illuminate\Support\Facades\Log::info('Validated Data:', $validatedData);

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

        // Update data
        $result = $riwayatKeuangan->update($validatedData);


        \Illuminate\Support\Facades\Log::info('Update result:', ['success' => $result]);

        return back()->with('message', 'Riwayat keuangan berhasil diperbarui');
    }

    public function destroy(string $id)
    {
        $riwayatKeuangan = PemasukanKeuangan::find($id) ?? PengeluaranKeuangan::findOrFail($id);
        $riwayatKeuangan->delete();

        return back()->with('message', 'Riwayat keuangan berhasil dihapus');
    }

    public function catatanKas(Request $request)
    {
        // Ambil data filter
        $selectedLabId = $request->input('lab_id');
        $selectedTahunId = $request->input('tahun_id');

        // Jika tidak ada tahun yang dipilih, gunakan tahun aktif
        if (!$selectedTahunId) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $selectedTahunId = $tahunAktif ? $tahunAktif->id : null;
        }

        // Ambil semua tahun kepengurusan untuk dropdown
        if ($selectedLabId) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($selectedLabId) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $selectedLabId);
            })->orderBy('tahun', 'desc')->get();
        } else {
            $tahunKepengurusan = collect(); // kosongkan jika lab belum dipilih
        }

        // Ambil semua laboratorium untuk dropdown
        $laboratorium = Laboratorium::all();

        $catatanKas = [];
        $anggota = [];
        $bulanData = [];
        $kepengurusanlab = null;

        if ($selectedLabId && $selectedTahunId) {
            // Cari kepengurusan lab berdasarkan lab_id dan tahun_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $selectedLabId)
                ->where('tahun_kepengurusan_id', $selectedTahunId)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            if ($kepengurusanlab) {
                // Ambil data catatan kas berdasarkan kepengurusan (pemasukan uang kas saja)
                $catatanKas = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->where('is_uang_kas', true)
                    ->orderBy('tanggal', 'asc')
                    ->get();

                // Ambil daftar anggota/asisten berdasarkan kepengurusan lab
                $anggota = User::whereHas('profile', function ($query) {
                    $query->whereNotNull('nomor_anggota');
                })
                ->whereHas('kepengurusan', function ($query) use ($kepengurusanlab) {
                    $query->where('kepengurusan_lab_id', $kepengurusanlab->id);
                })
                ->with(['profile', 'kepengurusan.struktur'])
                ->get();

                // Buat bulanData berdasarkan periode kepengurusan yang aktif
                $bulanData = $this->getOrderedMonths(
                    $kepengurusanlab->tahunKepengurusan->mulai,
                    $kepengurusanlab->tahunKepengurusan->selesai
                );

                // Ekstrak bulan dari data kas dan update struktur bulan
                foreach ($catatanKas as $kas) {
                    $date = Carbon::parse($kas->tanggal);
                    $bulan = $date->format('M Y'); // Format: Sep 2025

                    // Tentukan minggu ke berapa dalam bulan (1-4)
                    $tanggal = $date->day;
                    if ($tanggal <= 7) {
                        $minggu = 1;
                    } elseif ($tanggal <= 14) {
                        $minggu = 2;
                    } elseif ($tanggal <= 21) {
                        $minggu = 3;
                    } else {
                        $minggu = 4;
                    }

                    // Tambahkan informasi bulan dan minggu ke objek kas
                    $kas->bulan = $bulan;
                    $kas->minggu = $minggu;

                    // Update counter untuk bulan dan minggu ini jika bulan ada di bulanData
                    if (isset($bulanData[$bulan])) {
                        $bulanData[$bulan][$minggu]++;
                    }
                }
            }
        }

        // Jika bulanData kosong, tambahkan bulan terakhir untuk tampilan struktur tabel
        if (empty($bulanData)) {
            $currentMonth = Carbon::now()->format('M Y');
            $bulanData[$currentMonth] = [1 => 0, 2 => 0, 3 => 0, 4 => 0];
        }

        // Ambil data nominal kas jika kepengurusan lab ada
        $nominalKas = [];
        if ($kepengurusanlab) {
            $nominalKas = \App\Models\NominalKas::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('CatatanKas', [
            'catatanKas' => $catatanKas,
            'anggota' => $anggota,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'bulanData' => $bulanData,
            'kepengurusanlab' => $kepengurusanlab,
            'nominalKas' => $nominalKas,
            'filters' => [
                'lab_id' => $selectedLabId,
                'tahun_id' => $selectedTahunId,
            ],
            // Debug data
            'debug' => [
                'bulanData_keys' => array_keys($bulanData),
                'bulanData_count' => count($bulanData),
                'kepengurusanlab_found' => $kepengurusanlab ? 'YES' : 'NO',
                'users_count' => count($anggota),
                'bulanData_full' => $bulanData
            ],
            'flash' => [
                'message' => session('message'),
                'error' => session('error'),
            ],
        ]);
    }

    public function checkData(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        // Find the kepengurusan lab
        $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->first();

        if (!$kepengurusanLab) {
            return response()->json(['hasData' => false]);
        }

        // Check if there's any financial history in either table
        $hasData = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->exists()
                || PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->exists();

        return response()->json(['hasData' => $hasData]);
    }

    public function export(Request $request)
    {
        // Ambil parameter dari request
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        // Validasi lab_id dan tahun_id
        if (!$lab_id || !$tahun_id) {
            return response()->json(['error' => 'Laboratorium dan Tahun harus dipilih'], 400);
        }

        // Cari kepengurusan lab
        $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->with(['tahunKepengurusan', 'laboratorium'])
            ->first();

        if (!$kepengurusanLab) {
            return response()->json(['error' => 'Data kepengurusan tidak ditemukan'], 404);
        }

        // Ambil riwayat keuangan dari kedua tabel
        $pemasukan   = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->get();
        $pengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->get();
        $riwayatKeuangan = $pemasukan->merge($pengeluaran)->sortByDesc('tanggal')->values();

        // Cek apakah ada data riwayat keuangan
        if ($riwayatKeuangan->isEmpty()) {
            return response()->json(['error' => 'Tidak ada riwayat keuangan'], 404);
        }

        // Hitung total keuangan
        $totalPemasukan = $pemasukan->sum('nominal');
        $totalPengeluaran = $pengeluaran->sum('nominal');
        $saldo = $totalPemasukan - $totalPengeluaran;

        // Create a filename with lab and year info
        $filename = 'laporan_keuangan_' . $kepengurusanLab->laboratorium->nama . '_' . $kepengurusanLab->tahunKepengurusan->nama . '.pdf';
        $filename = str_replace(' ', '_', $filename); // Replace spaces with underscores

        // Generate PDF
        $pdf = PDF::loadView('pdf.laporan-keuangan', [
            'laboratorium' => $kepengurusanLab->laboratorium,
            'tahun' => $kepengurusanLab->tahunKepengurusan,
            'riwayatKeuangan' => $riwayatKeuangan,
            'totalPemasukan' => $totalPemasukan,
            'totalPengeluaran' => $totalPengeluaran,
            'saldo' => $saldo,
        ]);

        // Set headers to force download
        return $pdf->stream($filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Get ordered months based on kepengurusan start date until end date
     * Now accepts Carbon date objects instead of month name strings
     */
    private function getOrderedMonths($mulai, $selesai)
    {
        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $bulanData = [];

        // Pastikan $mulai dan $selesai adalah Carbon instances
        $start = Carbon::parse($mulai)->startOfMonth();
        $end = Carbon::parse($selesai)->startOfMonth();

        // Iterasi dari bulan mulai sampai bulan selesai
        $current = $start->copy();
        while ($current->lte($end)) {
            $monthName = $bulanNames[$current->month];
            $bulanData[$monthName] = [1 => 0, 2 => 0, 3 => 0, 4 => 0];
            $current->addMonth();
        }

        return $bulanData;
    }

    /**
     * Convert English month to Indonesian month
     */
    private function getIndonesianMonth($englishMonth)
    {
        $monthMap = [
            'January' => 'Januari',
            'February' => 'Februari',
            'March' => 'Maret',
            'April' => 'April',
            'May' => 'Mei',
            'June' => 'Juni',
            'July' => 'Juli',
            'August' => 'Agustus',
            'September' => 'September',
            'October' => 'Oktober',
            'November' => 'November',
            'December' => 'Desember'
        ];

        return $monthMap[$englishMonth] ?? $englishMonth;
    }

    // Method untuk mengelola nominal kas
    public function storeNominalKas(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'nominal' => 'required|numeric|min:0',
            'periode' => 'required|in:mingguan,bulanan',
            'deskripsi' => 'nullable|string|max:500',
        ]);

        // Satu kepengurusan hanya punya satu nominal kas — update jika sudah ada
        NominalKas::updateOrCreate(
            ['kepengurusan_lab_id' => $request->kepengurusan_lab_id],
            [
                'nominal'          => $request->nominal,
                'periode'          => $request->periode,
                'periode_mulai'    => $request->periode_mulai ?: null,
                'periode_berakhir' => $request->periode_berakhir ?: null,
                'deskripsi'        => $request->deskripsi,
                'is_active'        => true,
            ]
        );

        return redirect()->back()->with('success', 'Nominal kas berhasil disimpan');
    }

    public function updateNominalKas(Request $request, NominalKas $nominalKas)
    {
        $request->validate([
            'nominal' => 'required|numeric|min:0',
            'periode' => 'required|in:mingguan,bulanan',
            'deskripsi' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        // Jika is_active true, nonaktifkan yang lain
        if ($request->is_active) {
            NominalKas::where('kepengurusan_lab_id', $nominalKas->kepengurusan_lab_id)
                ->where('periode', $request->periode)
                ->where('id', '!=', $nominalKas->id)
                ->update(['is_active' => false]);
        }

        $nominalKas->update($request->all());

        return redirect()->back()->with('success', 'Nominal kas berhasil diperbarui');
    }

    public function destroyNominalKas(NominalKas $nominalKas)
    {
        $nominalKas->delete();
        return redirect()->back()->with('success', 'Nominal kas berhasil dihapus');
    }

    public function toggleActiveNominalKas(NominalKas $nominalKas)
    {
        if ($nominalKas->is_active) {
            $nominalKas->update(['is_active' => false]);
        } else {
            // Nonaktifkan yang lain dulu
            NominalKas::where('kepengurusan_lab_id', $nominalKas->kepengurusan_lab_id)
                ->where('periode', $nominalKas->periode)
                ->update(['is_active' => false]);

            $nominalKas->update(['is_active' => true]);
        }

        return redirect()->back()->with('success', 'Status nominal kas berhasil diperbarui');
    }
}
