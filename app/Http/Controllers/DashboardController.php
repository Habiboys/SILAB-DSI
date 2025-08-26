<?php

namespace App\Http\Controllers;

use App\Models\Aset;
use App\Models\DetailAset;
use App\Models\Praktikum;
use App\Models\Surat;
use App\Models\JadwalPiket;
use App\Models\User;
use App\Models\RiwayatKeuangan;
use App\Models\ModulPraktikum;
use App\Models\KepengurusanLab;
use App\Models\Struktur;
use App\Models\Laboratorium;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Ambil filter lab dari request
        $selectedLabId = $request->input('lab_id');
        $search = $request->input('search');
        
        // Jika lab belum dipilih, tampilkan halaman dashboard kosong
        if (!$selectedLabId) {
            return Inertia::render('Dashboard', [
                'selectedLab' => null,
                'summaryData' => [],
                'inventarisPerLab' => [],
                'praktikumPerLab' => [],
                'suratMasukTerbaru' => [],
                'jadwalPiketHariIni' => [],
                'ringkasanKeuangan' => [
                    'total_pemasukan' => 0,
                    'total_pengeluaran' => 0,
                    'total_transaksi' => 0,
                    'saldo' => 0, 
                    'bulan_ini' => [
                        'pemasukan' => 0,
                        'pengeluaran' => 0,
                        'transaksi' => 0
                    ],
                    'data_bulanan' => [
                        'labels' => [],
                        'pemasukan' => [],
                        'pengeluaran' => []
                    ]
                ],
                'statistikAnggota' => [],
                'lastUpdate' => Carbon::now()->format('Y-m-d H:i:s'),
                'laboratorium' => Laboratorium::select('id', 'nama')->get(),
                'filters' => [
                    'search' => $search,
                    'lab_id' => $selectedLabId
                ]
            ]);
        }
        
        // Data jumlah untuk lab yang dipilih
        $laboratorium = Laboratorium::find($selectedLabId);
        
        if (!$laboratorium) {
            return Inertia::render('Dashboard', [
                'selectedLab' => null,
                'summaryData' => [],
                'inventarisPerLab' => [],
                'praktikumPerLab' => [],
                'suratMasukTerbaru' => [],
                'jadwalPiketHariIni' => [],
                'ringkasanKeuangan' => [
                    'total_pemasukan' => 0,
                    'total_pengeluaran' => 0,
                    'total_transaksi' => 0,
                    'saldo' => 0, 
                    'bulan_ini' => [
                        'pemasukan' => 0,
                        'pengeluaran' => 0,
                        'transaksi' => 0
                    ],
                    'data_bulanan' => [
                        'labels' => [],
                        'pemasukan' => [],
                        'pengeluaran' => []
                    ]
                ],
                'statistikAnggota' => [],
                'lastUpdate' => Carbon::now()->format('Y-m-d H:i:s'),
                'laboratorium' => Laboratorium::select('id', 'nama')->get()
            ]);
        }
        
        // Cari kepengurusan lab aktif
        $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $selectedLabId)
            ->whereHas('tahunKepengurusan', function ($query) {
                $query->where('isactive', true);
            })
            ->first();
        
        // Ambil ID kepengurusan lab
        $kepengurusanLabId = $kepengurusanLab ? $kepengurusanLab->id : null;
        
        // Data jumlah untuk lab yang dipilih
        $summaryData = [
            'nama_lab' => $laboratorium->nama,
            'total_aset' => Aset::where('laboratorium_id', $selectedLabId)->count(),
            'total_praktikum' => $kepengurusanLab ? Praktikum::where('kepengurusan_lab_id', $kepengurusanLabId)->count() : 0,
            'total_anggota' => $kepengurusanLab ? User::whereHas('struktur')
                ->whereHas('profile') // Only count users with complete profile
                ->where('laboratory_id', $selectedLabId)
                ->count() : 0,
        ];

        // Mengambil statistik inventaris
        $inventarisData = Aset::where('laboratorium_id', $selectedLabId)
            ->with('detailAset')
            ->get();

        $baikCount = 0;
        $rusakCount = 0;
        
        foreach ($inventarisData as $aset) {
            $baikCount += $aset->detailAset()->where('keadaan', 'baik')->count();
            $rusakCount += $aset->detailAset()->where('keadaan', 'rusak')->count();
        }
        
        $inventarisPerLab = [
            [
                'id' => $laboratorium->id,
                'nama_lab' => $laboratorium->nama,
                'total' => $inventarisData->count(),
                'barang_baik' => $baikCount,
                'barang_rusak' => $rusakCount
            ]
        ];

        // Mengambil data praktikum
        $praktikumData = null;
        
        if ($kepengurusanLab) {
            $praktikumData = [
                'id' => $laboratorium->id,
                'nama_lab' => $laboratorium->nama,
                'total_praktikum' => Praktikum::where('kepengurusan_lab_id', $kepengurusanLabId)->count(),
                'total_modul' => ModulPraktikum::whereHas('praktikum', function ($query) use ($kepengurusanLabId) {
                    $query->where('kepengurusan_lab_id', $kepengurusanLabId);
                })->count(),
            ];
        }
        
        $praktikumPerLab = $praktikumData ? [$praktikumData] : [];

        // Mengambil data jadwal piket hari ini untuk lab yang dipilih
        $hariIni = strtolower(Carbon::now()->locale('id')->dayName);
        $jadwalPiketHariIni = [];
        
        if ($kepengurusanLabId) {
            $jadwalQuery = JadwalPiket::with(['user.struktur'])
                ->where('hari', $hariIni)
                ->where('kepengurusan_lab_id', $kepengurusanLabId);

            // Apply search filter if provided
            if ($search) {
                $jadwalQuery->whereHas('user', function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                });
            }
            
            $jadwalPiketHariIni = $jadwalQuery->get()
                ->map(function($jadwal) {
                    return [
                        'id' => $jadwal->id,
                        'anggota' => [
                            'nama' => $jadwal->user->name ?? 'Tidak diketahui',
                            'jabatan' => $jadwal->user->struktur->struktur ?? 'Anggota'
                        ],
                        'lab' => $jadwal->kepengurusanLab->laboratorium->nama ?? 'Tidak diketahui',
                        'shift' => ucfirst($jadwal->hari),
                        'status' => 'Aktif'
                    ];
                });
        }

        // Apply search filter to inventarisData if provided
        if ($search && $inventarisData) {
            $inventarisData = $inventarisData->filter(function($aset) use ($search) {
                return strpos(strtolower($aset->nama), strtolower($search)) !== false;
            });
            
            // Recalculate counts
            $baikCount = 0;
            $rusakCount = 0;
            
            foreach ($inventarisData as $aset) {
                $baikCount += $aset->detailAset()->where('keadaan', 'baik')->count();
                $rusakCount += $aset->detailAset()->where('keadaan', 'rusak')->count();
            }
            
            $inventarisPerLab = [
                [
                    'id' => $laboratorium->id,
                    'nama_lab' => $laboratorium->nama,
                    'total' => $inventarisData->count(),
                    'barang_baik' => $baikCount,
                    'barang_rusak' => $rusakCount
                ]
            ];
        }

        // Data keuangan
        $bulanIni = Carbon::now()->month;
        $tahunIni = Carbon::now()->year;
        $dataPemasukan = [];
        $dataPengeluaran = [];
        
        $ringkasanKeuangan = [
            'total_pemasukan' => 0,
            'total_pengeluaran' => 0,
            'total_transaksi' => 0,
            'saldo' => 0,
            'bulan_ini' => [
                'pemasukan' => 0,
                'pengeluaran' => 0,
                'transaksi' => 0
            ],
            'data_bulanan' => [
                'labels' => [],
                'pemasukan' => [],
                'pengeluaran' => []
            ]
        ];
        
        if ($kepengurusanLabId) {
            // Ambil total pemasukan dan pengeluaran sepanjang waktu (untuk saldo)
            $totalPemasukan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('jenis', 'masuk')
                ->sum('nominal');
                
            $totalPengeluaran = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                ->where('jenis', 'keluar')
                ->sum('nominal');
                
            $saldo = $totalPemasukan - $totalPengeluaran;
            
            // Ambil data 6 bulan terakhir
            for ($i = 0; $i < 6; $i++) {
                $bulan = Carbon::now()->subMonths($i);
                $namaBulan = $bulan->locale('id')->format('M');
                $tahun = $bulan->year;
                
                $pemasukan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->where('jenis', 'masuk')
                    ->whereMonth('tanggal', $bulan->month)
                    ->whereYear('tanggal', $bulan->year)
                    ->sum('nominal');
                    
                $pengeluaran = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->where('jenis', 'keluar')
                    ->whereMonth('tanggal', $bulan->month)
                    ->whereYear('tanggal', $bulan->year)
                    ->sum('nominal');
                    
                $dataPemasukan[] = [
                    'bulan' => $namaBulan . ' ' . $tahun,
                    'nominal' => (int) $pemasukan
                ];
                
                $dataPengeluaran[] = [
                    'bulan' => $namaBulan . ' ' . $tahun,
                    'nominal' => (int) $pengeluaran
                ];
            }
            
            // Urutkan dari bulan lama ke baru
            $dataPemasukan = array_reverse($dataPemasukan);
            $dataPengeluaran = array_reverse($dataPengeluaran);
            
            // Ringkasan keuangan bulan ini
            $ringkasanKeuangan = [
                'total_pemasukan' => (int) $totalPemasukan,
                'total_pengeluaran' => (int) $totalPengeluaran,
                'saldo' => (int) $saldo, 
                'total_transaksi' => RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)->count(),
                'bulan_ini' => [
                    'pemasukan' => (int) RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->where('jenis', 'masuk')
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->sum('nominal'),
                    'pengeluaran' => (int) RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->where('jenis', 'keluar')
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->sum('nominal'),
                    'transaksi' => RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->count()
                ],
                'data_bulanan' => [
                    'labels' => array_column($dataPemasukan, 'bulan'),
                    'pemasukan' => array_column($dataPemasukan, 'nominal'),
                    'pengeluaran' => array_column($dataPengeluaran, 'nominal')
                ]
            ];
        }

        // Statistik anggota berdasarkan struktur untuk lab yang dipilih
        $statistikAnggota = [];
        
        if ($kepengurusanLabId) {
            $statistikAnggota = Struktur::withCount(['users' => function($query) use ($selectedLabId) {
                $query->where('laboratory_id', $selectedLabId)
                      ->whereHas('profile'); // Only count users with complete profile
            }])
                ->orderBy('users_count', 'desc')
                ->get()
                ->map(function($struktur) {
                    return [
                        'status' => $struktur->struktur ?? 'Undefined',
                        'total' => $struktur->users_count
                    ];
                });
        }

        return Inertia::render('Dashboard', [
            'selectedLab' => $laboratorium,
            'summaryData' => $summaryData,
            'inventarisPerLab' => $inventarisPerLab,
            'praktikumPerLab' => $praktikumPerLab,
            'jadwalPiketHariIni' => $jadwalPiketHariIni,
            'ringkasanKeuangan' => $ringkasanKeuangan,
            'statistikAnggota' => $statistikAnggota,
            'lastUpdate' => Carbon::now()->format('Y-m-d H:i:s'),
            'laboratorium' => Laboratorium::select('id', 'nama')->get(),
            'filters' => [
                'search' => $search,
                'lab_id' => $selectedLabId
            ]
        ]);
    }
}
