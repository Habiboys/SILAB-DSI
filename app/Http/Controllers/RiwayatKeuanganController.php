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
use Illuminate\Support\Facades\Auth;

class RiwayatKeuanganController extends Controller
{

    public function index(Request $request)
    {

        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        $jenis = $request->input('jenis');

        $kepengurusanlab = null;

        if ($kepengurusan_lab_id) {
            $kepengurusanlab = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepengurusanlab) {
                $lab_id = $kepengurusanlab->laboratorium_id;
                $tahun_id = $kepengurusanlab->tahun_kepengurusan_id;
            }
        }

        else {

            if (!$lab_id) {
                $user = Auth::user();
                $currentLab = $user ? $user->getCurrentLab() : null;
                if ($currentLab && isset($currentLab['id'])) {
                    $lab_id = $currentLab['id'];
                }
            }

            if (!$tahun_id && $lab_id) {
                $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('is_active', true)
                    ->first();
                $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
            }

            if ($lab_id && $tahun_id) {
                $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                    ->where('tahun_kepengurusan_id', $tahun_id)
                    ->with(['tahunKepengurusan', 'laboratorium'])
                    ->first();
            }
        }

        $tahunKepengurusan = collect();
        if ($lab_id) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($lab_id) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $lab_id);
            })->orderBy('tahun', 'desc')->get();
        }

        $laboratorium = Laboratorium::all();

        $riwayatKeuangan = [];
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $saldo = 0;

        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        if ($kepengurusanlab) {

            $pemasukanQuery = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with(['user', 'kepengurusanLab.tahunKepengurusan', 'nominalKas', 'dendaPiket', 'tagihanKas']);

            $pengeluaranQuery = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->with(['user', 'kepengurusanLab.tahunKepengurusan']);

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

                if ($search) {
                    $pemasukanQuery->where('deskripsi', 'like', "%{$search}%");
                    $pengeluaranQuery->where('deskripsi', 'like', "%{$search}%");
                }
                $allItems = $pemasukanQuery->orderBy('tanggal', 'desc')->get()
                    ->merge($pengeluaranQuery->orderBy('tanggal', 'desc')->get())
                    ->sortByDesc('tanggal')
                    ->values();

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

            $totalPemasukan = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->sum('nominal');

            $totalPengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                ->sum('nominal');

            $saldo = $totalPemasukan - $totalPengeluaran;
        }

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

        \Illuminate\Support\Facades\Log::info('Store request data:', $request->all());

        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:500',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string',
            'lab_id' => 'required|exists:laboratorium,id',
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'user_id' => 'nullable|string|exists:users,id',
            'nominal_kas_id' => 'nullable|uuid|exists:nominal_kas,id',
            'is_uang_kas' => 'nullable|boolean',
            'jenis_pembayaran_kas' => 'nullable|in:normal,lebih',
            'catatan_pembayaran' => 'nullable|string|max:500',
        ]);

        \Illuminate\Support\Facades\Log::info('Validated data:', $validatedData);

        $validatedData['is_uang_kas'] = $request->has('is_uang_kas') ? (bool)$request->is_uang_kas : false;

        if (!isset($validatedData['user_id'])) {
            $validatedData['user_id'] = Auth::id();
        }

        $validatedData['nominal_kas_id'] = $validatedData['nominal_kas_id'] ?? null;

        if ($validatedData['is_uang_kas'] === true) {

            if (!empty($validatedData['nominal_kas_id'])) {
                $nominalKas = NominalKas::where('id', $validatedData['nominal_kas_id'])
                    ->where('kepengurusan_lab_id', $validatedData['kepengurusan_lab_id'])
                    ->first();
            } else {
                $nominalKas = NominalKas::getActiveNominalKas($validatedData['kepengurusan_lab_id']);
            }

            if (!$nominalKas) {
                return back()->withErrors([
                    'nominal_kas_id' => 'Nominal kas tidak ditemukan untuk kepengurusan ini. Silakan pilih nominal kas yang valid.'
                ])->withInput();
            }

            $validatedData['nominal_kas_id'] = $nominalKas->id;

            \Illuminate\Support\Facades\Log::info('Nominal Kas Info:', [
                'nominal' => $nominalKas->nominal,
                'periode' => $nominalKas->periode,
                'payment_nominal' => $validatedData['nominal']
            ]);

            if ($validatedData['nominal'] < $nominalKas->nominal) {
                return back()->withErrors([
                    'nominal' => 'Nominal pembayaran uang kas minimal ' . number_format((float)$nominalKas->nominal, 0, ',', '.') . ' untuk periode ' . $nominalKas->periode
                ])->withInput();
            }

            if (!isset($validatedData['jenis_pembayaran_kas']) || empty($validatedData['jenis_pembayaran_kas'])) {
                if ($validatedData['nominal'] > $nominalKas->nominal) {

                    return back()->withErrors([
                        'jenis_pembayaran_kas' => 'Nominal pembayaran melebihi nominal kas. Silakan pilih jenis pembayaran: Normal (untuk periode selanjutnya) atau Lebih (bonus/tambahan)'
                    ])->withInput();
                } else {
                    $validatedData['jenis_pembayaran_kas'] = 'normal';
                }
            }

        } else {
            $validatedData['nominal_kas_id'] = null;
        }

        $validatedData['bukti'] = null;

        if ($request->filled('bukti') && preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {

            $buktiData = substr($request->bukti, strpos($request->bukti, ',') + 1);
            $buktiData = base64_decode($buktiData);

            $mimeType = explode(':', substr($request->bukti, 0, strpos($request->bukti, ';')))[1];
            $extension = explode('/', $mimeType)[1];

            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            if (!in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['bukti' => 'File harus berupa gambar (jpg, jpeg, png, gif)']);
            }

            $safeName = preg_replace('/[^a-z0-9]+/', '-', strtolower($validatedData['deskripsi']));
            $safeName = substr($safeName, 0, 30);
            $fileName = "bukti-" . time() . "-" . $safeName . "." . $extension;

            $directory = 'bukti';
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            $path = $directory . '/' . $fileName;

            Storage::disk('public')->put($path, $buktiData);

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

        $riwayatKeuangan = PemasukanKeuangan::find($id) ?? PengeluaranKeuangan::findOrFail($id);

        $validatedData = $request->validate([
            'tanggal' => 'required|date',
            'nominal' => 'required|numeric|min:0',
            'jenis' => 'required|in:masuk,keluar',
            'deskripsi' => 'required|string',
            'bukti' => 'nullable|string',

        ]);

        \Illuminate\Support\Facades\Log::info('Validated Data:', $validatedData);

        if ($request->filled('bukti')) {

            if ($request->bukti === 'hapus') {

                if ($riwayatKeuangan->bukti && Storage::disk('public')->exists($riwayatKeuangan->bukti)) {
                    Storage::disk('public')->delete($riwayatKeuangan->bukti);
                }
                $validatedData['bukti'] = null;
            }

            elseif (preg_match('/^data:image\/(\w+);base64,/', $request->bukti)) {

                $buktiData = substr($request->bukti, strpos($request->bukti, ',') + 1);
                $buktiData = base64_decode($buktiData);

                $mimeType = explode(':', substr($request->bukti, 0, strpos($request->bukti, ';')))[1];
                $extension = explode('/', $mimeType)[1];

                $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($extension, $allowedExtensions)) {
                    return back()->withErrors(['bukti' => 'File harus berupa gambar (jpg, jpeg, png, gif)']);
                }

                $safeName = preg_replace('/[^a-z0-9]+/', '-', strtolower($validatedData['deskripsi']));
                $safeName = substr($safeName, 0, 30);
                $fileName = "bukti-" . time() . "-" . $safeName . "." . $extension;

                $directory = 'bukti';
                if (!Storage::disk('public')->exists($directory)) {
                    Storage::disk('public')->makeDirectory($directory);
                }

                $path = $directory . '/' . $fileName;

                Storage::disk('public')->put($path, $buktiData);

                if ($riwayatKeuangan->bukti && Storage::disk('public')->exists($riwayatKeuangan->bukti)) {
                    Storage::disk('public')->delete($riwayatKeuangan->bukti);
                }

                $validatedData['bukti'] = $path;
            }
        } else {

            unset($validatedData['bukti']);
        }

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

        $selectedLabId = $request->input('lab_id');
        $selectedTahunId = $request->input('tahun_id');

        if (!$selectedLabId) {
            $user = Auth::user();
            $currentLab = $user ? $user->getCurrentLab() : null;
            if ($currentLab && isset($currentLab['id'])) {
                $selectedLabId = $currentLab['id'];
            }
        }

        if (!$selectedTahunId && $selectedLabId) {
            $kepAktif = KepengurusanLab::where('laboratorium_id', $selectedLabId)
                ->where('is_active', true)
                ->first();
            $selectedTahunId = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
        }

        if ($selectedLabId) {
            $tahunKepengurusan = TahunKepengurusan::whereIn('id', function ($query) use ($selectedLabId) {
                $query->select('tahun_kepengurusan_id')
                    ->from('kepengurusan_lab')
                    ->where('laboratorium_id', $selectedLabId);
            })->orderBy('tahun', 'desc')->get();
        } else {
            $tahunKepengurusan = collect();
        }

        $laboratorium = Laboratorium::all();

        $catatanKas = [];
        $anggota = [];
        $bulanData = [];
        $kepengurusanlab = null;

        if ($selectedLabId && $selectedTahunId) {

            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $selectedLabId)
                ->where('tahun_kepengurusan_id', $selectedTahunId)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            if ($kepengurusanlab) {

                $catatanKas = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->where('is_uang_kas', true)
                    ->orderBy('tanggal', 'asc')
                    ->get();

                $anggota = User::whereHas('profile', function ($query) {
                    $query->whereNotNull('nomor_anggota');
                })
                ->whereHas('kepengurusan', function ($query) use ($kepengurusanlab) {
                    $query->where('kepengurusan_lab_id', $kepengurusanlab->id);
                })
                ->with(['profile', 'kepengurusan.struktur'])
                ->get();

                $bulanData = $this->getOrderedMonths(
                    $kepengurusanlab->tahunKepengurusan->mulai,
                    $kepengurusanlab->tahunKepengurusan->selesai
                );

                foreach ($catatanKas as $kas) {
                    $date = Carbon::parse($kas->tanggal);
                    $bulan = $date->format('M Y');

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

                    $kas->bulan = $bulan;
                    $kas->minggu = $minggu;

                    if (isset($bulanData[$bulan])) {
                        $bulanData[$bulan][$minggu]++;
                    }
                }
            }
        }

        if (empty($bulanData)) {
            $currentMonth = Carbon::now()->format('M Y');
            $bulanData[$currentMonth] = [1 => 0, 2 => 0, 3 => 0, 4 => 0];
        }

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

        $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->first();

        if (!$kepengurusanLab) {
            return response()->json(['hasData' => false]);
        }

        $hasData = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->exists()
                || PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->exists();

        return response()->json(['hasData' => $hasData]);
    }

    public function export(Request $request)
    {

        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        if (!$lab_id || !$tahun_id) {
            return response()->json(['error' => 'Laboratorium dan Tahun harus dipilih'], 400);
        }

        $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->with(['tahunKepengurusan', 'laboratorium'])
            ->first();

        if (!$kepengurusanLab) {
            return response()->json(['error' => 'Data kepengurusan tidak ditemukan'], 404);
        }

        $pemasukan   = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->get();
        $pengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLab->id)->get();
        $riwayatKeuangan = $pemasukan->merge($pengeluaran)->sortByDesc('tanggal')->values();

        if ($riwayatKeuangan->isEmpty()) {
            return response()->json(['error' => 'Tidak ada riwayat keuangan'], 404);
        }

        $totalPemasukan = $pemasukan->sum('nominal');
        $totalPengeluaran = $pengeluaran->sum('nominal');
        $saldo = $totalPemasukan - $totalPengeluaran;

        $filename = 'laporan_keuangan_' . $kepengurusanLab->laboratorium->nama . '_' . $kepengurusanLab->tahunKepengurusan->nama . '.pdf';
        $filename = str_replace(' ', '_', $filename);

        $pdf = PDF::loadView('pdf.laporan-keuangan', [
            'laboratorium' => $kepengurusanLab->laboratorium,
            'tahun' => $kepengurusanLab->tahunKepengurusan,
            'riwayatKeuangan' => $riwayatKeuangan,
            'totalPemasukan' => $totalPemasukan,
            'totalPengeluaran' => $totalPengeluaran,
            'saldo' => $saldo,
        ]);

        return $pdf->download($filename);
    }


    private function getOrderedMonths($mulai, $selesai)
    {
        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret',
            4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September',
            10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $bulanData = [];

        $start = Carbon::parse($mulai)->startOfMonth();
        $end = Carbon::parse($selesai)->startOfMonth();

        $current = $start->copy();
        while ($current->lte($end)) {
            $monthName = $bulanNames[$current->month];
            $bulanData[$monthName] = [1 => 0, 2 => 0, 3 => 0, 4 => 0];
            $current->addMonth();
        }

        return $bulanData;
    }


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

    public function storeNominalKas(Request $request)
    {
        $request->validate([
            'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            'nominal' => 'required|numeric|min:0',
            'periode' => 'required|in:mingguan,bulanan',
            'deskripsi' => 'nullable|string|max:500',
        ]);

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

            NominalKas::where('kepengurusan_lab_id', $nominalKas->kepengurusan_lab_id)
                ->where('periode', $nominalKas->periode)
                ->update(['is_active' => false]);

            $nominalKas->update(['is_active' => true]);
        }

        return redirect()->back()->with('success', 'Status nominal kas berhasil diperbarui');
    }
}
