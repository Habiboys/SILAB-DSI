<?php

namespace App\Http\Controllers;

use App\Models\KategoriAset;
use App\Models\DetailAset;
use App\Models\Praktikum;
use App\Models\Surat;
use App\Models\JadwalPiket;
use App\Models\User;
use App\Models\PemasukanKeuangan;
use App\Models\PengeluaranKeuangan;
use App\Models\ModulPraktikum;
use App\Models\KepengurusanLab;
use App\Models\Struktur;
use App\Models\Laboratorium;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Kegiatan;
//
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Ambil filter lab/kepengurusan dari request
        $selectedLabId = $request->input('lab_id');
        $kepengurusanLabId = $request->input('kepengurusan_lab_id');
        $search = $request->input('search');

        $kepengurusanLab = null;

        // 1. Jika kepengurusan_lab_id diberikan, cari pengurusan spesifik ini
        if ($kepengurusanLabId) {
            $kepengurusanLab = KepengurusanLab::with(['laboratorium', 'tahunKepengurusan'])
                ->find($kepengurusanLabId);

            if ($kepengurusanLab) {
                // Update selectedLabId dari kepengurusan yang ditemukan
                $selectedLabId = $kepengurusanLab->laboratorium_id;
            }
        }

        // 2. Fallback: Jika belum ketemu, cari berdasarkan lab_id dan tahun aktif
        if (!$kepengurusanLab && $selectedLabId) {
            $kepengurusanLab = KepengurusanLab::where('laboratorium_id', $selectedLabId)
                ->where('is_active', true)
                ->with(['laboratorium', 'tahunKepengurusan'])
                ->first();

            if ($kepengurusanLab) {
                $kepengurusanLabId = $kepengurusanLab->id;
            }
        }

        // Jika lab belum dipilih dan tidak ada kepengurusan, tampilkan dashboard kosong
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



        // Data jumlah untuk lab yang dipilih
        $summaryData = [
            'nama_lab' => $laboratorium->nama,
            'total_aset' => DetailAset::where('laboratorium_id', $selectedLabId)->count(),
            'total_praktikum' => $kepengurusanLab ? Praktikum::where('kepengurusan_lab_id', $kepengurusanLabId)->count() : 0,
            'total_anggota' => $kepengurusanLab ? User::whereHas('kepengurusan', function($query) use ($kepengurusanLab) {
                $query->where('kepengurusan_lab_id', $kepengurusanLab->id);
            })
                ->whereHas('profile') // Only count users with complete profile
                // ->where('laboratory_id', $selectedLabId) // REMOVED: Assistants don't have laboratory_id/access_lab_id
                ->count() : 0,
        ];

        // Mengambil statistik inventaris
        $baikCount  = DetailAset::where('laboratorium_id', $selectedLabId)->where('keadaan', 'baik')->count();
        $rusakCount = DetailAset::where('laboratorium_id', $selectedLabId)->where('keadaan', 'rusak')->count();
        $totalAset  = DetailAset::where('laboratorium_id', $selectedLabId)->count();

        $inventarisPerLab = [
            [
                'id'          => $laboratorium->id,
                'nama_lab'    => $laboratorium->nama,
                'total'       => $totalAset,
                'barang_baik' => $baikCount,
                'barang_rusak'=> $rusakCount,
            ]
        ];

        // Mengambil data praktikum
        $praktikumData = null;

        if ($kepengurusanLab) {
            $praktikumData = [
                'id' => $laboratorium->id,
                'nama_lab' => $laboratorium->nama,
                'total_praktikum' => Praktikum::where('kepengurusan_lab_id', $kepengurusanLabId)->count(),
                'total_modul' => ModulPraktikum::whereHas('pertemuan.kelas.praktikum', function ($query) use ($kepengurusanLabId) {
                    $query->where('kepengurusan_lab_id', $kepengurusanLabId);
                })->count(),
            ];
        }

        $praktikumPerLab = $praktikumData ? [$praktikumData] : [];

        // Mengambil data jadwal piket hari ini untuk lab yang dipilih
        $hariIni = strtolower(Carbon::now()->locale('id')->dayName);
        $jadwalPiketHariIni = [];

        if ($kepengurusanLabId) {
            $jadwalQuery = JadwalPiket::with(['user.kepengurusan.struktur'])
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
                            'jabatan' => $jadwal->user->kepengurusan->first()?->struktur->struktur ?? 'Anggota'
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
            $totalPemasukan = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)->sum('nominal');

            $totalPengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)->sum('nominal');

            $saldo = $totalPemasukan - $totalPengeluaran;

            // Ambil data 6 bulan terakhir
            for ($i = 0; $i < 6; $i++) {
                $bulan = Carbon::now()->subMonths($i);
                $namaBulan = $bulan->locale('id')->format('M');
                $tahun = $bulan->year;

                $pemasukan = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->whereMonth('tanggal', $bulan->month)
                    ->whereYear('tanggal', $bulan->year)
                    ->sum('nominal');

                $pengeluaran = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
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
                'total_transaksi' => PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)->count()
                    + PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)->count(),
                'bulan_ini' => [
                    'pemasukan' => (int) PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->sum('nominal'),
                    'pengeluaran' => (int) PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->sum('nominal'),
                    'transaksi' => PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
                        ->whereMonth('tanggal', $bulanIni)
                        ->whereYear('tanggal', $tahunIni)
                        ->count()
                        + PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
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
            // Hitung jumlah user per struktur melalui kepengurusan
            $strukturStats = Struktur::all()->map(function($struktur) use ($kepengurusanLabId) {
                $userCount = \App\Models\KepengurusanUser::where('struktur_id', $struktur->id)
                    ->where('kepengurusan_lab_id', $kepengurusanLabId)
                    ->where('is_active', true)
                    ->count();

                return [
                    'status' => $struktur->struktur ?? 'Undefined',
                    'total' => $userCount
                ];
            })->filter(function($item) {
                return $item['total'] > 0; // Hanya tampilkan struktur yang ada anggotanya
            })->sortByDesc('total')
            ->values();

            $statistikAnggota = $strukturStats;
            $statistikAnggota = $strukturStats;
        }

        // Kegiatan Mendatang
        $kegiatanMendatang = [];
        if ($kepengurusanLabId) {
            $kegiatanMendatang = Kegiatan::with('proker')
                ->whereHas('proker', function($q) use ($kepengurusanLabId) {
                    $q->where('kepengurusan_lab_id', $kepengurusanLabId);
                })
                ->where('status_approval', 'disetujui')
                ->where('tanggal_selesai', '>=', now()->toDateString()) // Show if not ended yet
                ->orderBy('tanggal_mulai', 'asc')
                ->take(5)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'selectedLab' => [
                'id' => $laboratorium->id,
                'nama' => $laboratorium->nama,
                'logo' => $laboratorium->logo
            ],
            'summaryData' => $summaryData,
            'inventarisPerLab' => $inventarisPerLab,
            'praktikumPerLab' => $praktikumPerLab,
            'jadwalPiketHariIni' => $jadwalPiketHariIni,
            'ringkasanKeuangan' => $ringkasanKeuangan,
            'statistikAnggota' => $statistikAnggota,
            'lastUpdate' => Carbon::now()->format('Y-m-d H:i:s'),
            'laboratorium' => Laboratorium::select('id', 'nama', 'logo')->get(),
            'filters' => [
                'search' => $search,
                'lab_id' => $selectedLabId,
                'kepengurusan_lab_id' => $kepengurusanLabId
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
        ]);
    }
}
