<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\PemasukanKeuangan;
use App\Models\PengeluaranKeuangan;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RekapKeuanganController extends Controller
{
    public function index(Request $request)
    {
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        if ($kepengurusan_lab_id) {
            $kepById = KepengurusanLab::with(['tahunKepengurusan', 'laboratorium'])
                ->find($kepengurusan_lab_id);

            if ($kepById) {
                $lab_id = $kepById->laboratorium_id;
                $tahun_id = $kepById->tahun_kepengurusan_id;
            }
        }

        if (!$tahun_id && $lab_id) {
            $kepAktif = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('is_active', true)
                ->first();
            $tahun_id = $kepAktif ? $kepAktif->tahun_kepengurusan_id : null;
        }

        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();

        $laboratorium = Laboratorium::all();

        $rekapKeuangan = [];
        $kepengurusanlab = null;
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $saldoAkhir = 0;

        if ($lab_id && $tahun_id) {

            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();

            if ($kepengurusanlab) {

                $tahunKepengurusan = $kepengurusanlab->tahunKepengurusan->tahun;

                $pemasukanByMonth = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->whereYear('tanggal', $tahunKepengurusan)
                    ->select(
                        DB::raw('MONTH(tanggal) as bulan'),
                        DB::raw('YEAR(tanggal) as tahun'),
                        DB::raw('SUM(nominal) as pemasukan'),
                        DB::raw('0 as pengeluaran')
                    )
                    ->groupBy('tahun', 'bulan');

                $pengeluaranByMonth = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->whereYear('tanggal', $tahunKepengurusan)
                    ->select(
                        DB::raw('MONTH(tanggal) as bulan'),
                        DB::raw('YEAR(tanggal) as tahun'),
                        DB::raw('0 as pemasukan'),
                        DB::raw('SUM(nominal) as pengeluaran')
                    )
                    ->groupBy('tahun', 'bulan');

                $rekapRaw = $pemasukanByMonth->get()->concat($pengeluaranByMonth->get())
                    ->groupBy(fn($row) => $row->tahun . '-' . $row->bulan)
                    ->map(function ($rows) {
                        $bulan = $rows->first()->bulan;
                        $tahun = $rows->first()->tahun;
                        return (object) [
                            'bulan'       => $bulan,
                            'tahun'       => $tahun,
                            'pemasukan'   => $rows->sum('pemasukan'),
                            'pengeluaran' => $rows->sum('pengeluaran'),
                        ];
                    })
                    ->sortBy(fn($row) => $row->tahun * 100 + $row->bulan)
                    ->values();

                $rekapKeuangan = collect($rekapRaw);

                $saldoBerjalan = 0;
                $rekapKeuangan = $rekapKeuangan->map(function ($item) use (&$saldoBerjalan) {
                    $saldoBulan = $item->pemasukan - $item->pengeluaran;
                    $saldoBerjalan += $saldoBulan;
                    $item->saldo = $saldoBerjalan;

                    $bulanNames = [
                        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                    ];
                    $item->nama_bulan = $bulanNames[$item->bulan];

                    return $item;
                });

                $totalPemasukan = $rekapKeuangan->sum('pemasukan');
                $totalPengeluaran = $rekapKeuangan->sum('pengeluaran');
                $saldoAkhir = $totalPemasukan - $totalPengeluaran;

                $kasPaymentSummary = $this->calculateKasPaymentSummary($kepengurusanlab->id);
            }
        }

        return Inertia::render('RekapKeuangan', [
            'rekapKeuangan' => $rekapKeuangan,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'keuanganSummary' => [
                'totalPemasukan' => $totalPemasukan,
                'totalPengeluaran' => $totalPengeluaran,
                'saldoAkhir' => $saldoAkhir
            ],
            'kasPaymentSummary' => $kasPaymentSummary ?? null,
            'filters' => [
                'kepengurusan_lab_id' => $kepengurusan_lab_id,
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ]
        ]);
    }

    public function export(Request $request)
    {
        $kepengurusan_lab_id = $request->input('kepengurusan_lab_id');
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');

        if ($kepengurusan_lab_id) {
            $kepById = KepengurusanLab::find($kepengurusan_lab_id);
            if ($kepById) {
                $lab_id = $kepById->laboratorium_id;
                $tahun_id = $kepById->tahun_kepengurusan_id;
            }
        }

        if (!$lab_id || !$tahun_id) {
            return back()->with('error', 'Pilih laboratorium dan tahun kepengurusan terlebih dahulu');
        }

        $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->with(['tahunKepengurusan', 'laboratorium'])
            ->first();

        if (!$kepengurusanlab) {
            return back()->with('error', 'Data kepengurusan lab tidak ditemukan');
        }

        $tahunKepengurusan = $kepengurusanlab->tahunKepengurusan->tahun;

        $pemasukanByMonth = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
            ->whereYear('tanggal', $tahunKepengurusan)
            ->select(
                DB::raw('MONTH(tanggal) as bulan'),
                DB::raw('YEAR(tanggal) as tahun'),
                DB::raw('SUM(nominal) as pemasukan'),
                DB::raw('0 as pengeluaran')
            )
            ->groupBy('tahun', 'bulan');

        $pengeluaranByMonth = PengeluaranKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
            ->whereYear('tanggal', $tahunKepengurusan)
            ->select(
                DB::raw('MONTH(tanggal) as bulan'),
                DB::raw('YEAR(tanggal) as tahun'),
                DB::raw('0 as pemasukan'),
                DB::raw('SUM(nominal) as pengeluaran')
            )
            ->groupBy('tahun', 'bulan');

        $rekapKeuangan = collect(
            $pemasukanByMonth->get()->concat($pengeluaranByMonth->get())
                ->groupBy(fn($row) => $row->tahun . '-' . $row->bulan)
                ->map(function ($rows) {
                    $bulan = $rows->first()->bulan;
                    $tahun = $rows->first()->tahun;
                    return (object) [
                        'bulan'       => $bulan,
                        'tahun'       => $tahun,
                        'pemasukan'   => $rows->sum('pemasukan'),
                        'pengeluaran' => $rows->sum('pengeluaran'),
                    ];
                })
                ->sortBy(fn($row) => $row->tahun * 100 + $row->bulan)
                ->values()
        );

        $saldoBerjalan = 0;
        $rekapKeuangan = $rekapKeuangan->map(function ($item) use (&$saldoBerjalan) {
            $saldoBulan = $item->pemasukan - $item->pengeluaran;
            $saldoBerjalan += $saldoBulan;
            $item->saldo = $saldoBerjalan;

            $bulanNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            $item->nama_bulan = $bulanNames[$item->bulan];

            return $item;
        });

        $totalPemasukan = $rekapKeuangan->sum('pemasukan');
        $totalPengeluaran = $rekapKeuangan->sum('pengeluaran');
        $saldoAkhir = $totalPemasukan - $totalPengeluaran;

        $filename = 'Rekap_Keuangan_' . $kepengurusanlab->laboratorium->nama . '_' .
                    $kepengurusanlab->tahunKepengurusan->tahun . '.pdf';

        return response()->json([
            'message' => 'Export fitur belum diimplementasikan',
            'data' => [
                'lab' => $kepengurusanlab->laboratorium->nama,
                'tahun' => $kepengurusanlab->tahunKepengurusan->tahun,
                'total_records' => count($rekapKeuangan),
                'total_pemasukan' => $totalPemasukan,
                'total_pengeluaran' => $totalPengeluaran,
                'saldo_akhir' => $saldoAkhir
            ]
        ]);
    }


    private function calculateKasPaymentSummary($kepengurusanLabId)
    {

        $nominalKas = \App\Models\NominalKas::getActiveNominalKas($kepengurusanLabId);

        if (!$nominalKas) {
            return [
                'nominal_kas' => null,
                'total_payments' => 0,
                'total_amount' => 0,
                'periods_paid' => 0,
                'remaining_amount' => 0
            ];
        }

        $kasPayments = PemasukanKeuangan::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->where('is_uang_kas', true)
            ->get();

        $totalAmount = $kasPayments->sum('nominal');
        $periodsPaid = $nominalKas->calculatePeriodsPaid($totalAmount);
        $remainingAmount = $nominalKas->calculateRemainingAmount($totalAmount);

        return [
            'nominal_kas' => $nominalKas,
            'total_payments' => $kasPayments->count(),
            'total_amount' => $totalAmount,
            'periods_paid' => $periodsPaid,
            'remaining_amount' => $remainingAmount,
            'payments_by_user' => $kasPayments->groupBy('user_id')->map(function ($payments) use ($nominalKas) {
                $userTotal = $payments->sum('nominal');
                return [
                    'user_name' => $payments->first()->user->name ?? 'Unknown',
                    'total_amount' => $userTotal,
                    'periods_paid' => $nominalKas->calculatePeriodsPaid($userTotal),
                    'remaining_amount' => $nominalKas->calculateRemainingAmount($userTotal)
                ];
            })
        ];
    }
}
