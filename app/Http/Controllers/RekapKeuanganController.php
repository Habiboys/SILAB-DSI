<?php

namespace App\Http\Controllers;

use App\Models\KepengurusanLab;
use App\Models\Laboratorium;
use App\Models\RiwayatKeuangan;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RekapKeuanganController extends Controller
{
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        // If no year is selected, use the active year
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }
    
        // Get all years for dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
        
        // Get all laboratories for dropdown
        $laboratorium = Laboratorium::all();
        
        $rekapKeuangan = [];
        $kepengurusanlab = null;
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $saldoAkhir = 0;
    
        if ($lab_id && $tahun_id) {
            // Find lab management based on lab_id and year_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();
    
            // If lab management is found, get financial history
            if ($kepengurusanlab) {
                // Get monthly summary using DB::raw for SQL aggregation
                $rekapKeuangan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->select(
                        DB::raw('MONTH(tanggal) as bulan'),
                        DB::raw('YEAR(tanggal) as tahun'),
                        DB::raw('SUM(CASE WHEN jenis = "masuk" THEN nominal ELSE 0 END) as pemasukan'),
                        DB::raw('SUM(CASE WHEN jenis = "keluar" THEN nominal ELSE 0 END) as pengeluaran')
                    )
                    ->groupBy('tahun', 'bulan')
                    ->orderBy('tahun')
                    ->orderBy('bulan')
                    ->get();
                
                // Calculate running balance (saldo)
                $saldoBerjalan = 0;
                $rekapKeuangan = $rekapKeuangan->map(function ($item) use (&$saldoBerjalan) {
                    $saldoBulan = $item->pemasukan - $item->pengeluaran;
                    $saldoBerjalan += $saldoBulan;
                    $item->saldo = $saldoBerjalan;
                    
                    // Add month name (in Indonesian)
                    $bulanNames = [
                        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                    ];
                    $item->nama_bulan = $bulanNames[$item->bulan];
                    
                    return $item;
                });
                
                // Calculate totals
                $totalPemasukan = $rekapKeuangan->sum('pemasukan');
                $totalPengeluaran = $rekapKeuangan->sum('pengeluaran');
                $saldoAkhir = $totalPemasukan - $totalPengeluaran;
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
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ]
        ]);
    }
    
    public function export(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        if (!$lab_id || !$tahun_id) {
            return back()->with('error', 'Pilih laboratorium dan tahun kepengurusan terlebih dahulu');
        }
        
        // Find lab management
        $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
            ->where('tahun_kepengurusan_id', $tahun_id)
            ->with(['tahunKepengurusan', 'laboratorium'])
            ->first();
            
        if (!$kepengurusanlab) {
            return back()->with('error', 'Data kepengurusan lab tidak ditemukan');
        }
        
        // Get monthly summary
        $rekapKeuangan = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
            ->select(
                DB::raw('MONTH(tanggal) as bulan'),
                DB::raw('YEAR(tanggal) as tahun'),
                DB::raw('SUM(CASE WHEN jenis = "masuk" THEN nominal ELSE 0 END) as pemasukan'),
                DB::raw('SUM(CASE WHEN jenis = "keluar" THEN nominal ELSE 0 END) as pengeluaran')
            )
            ->groupBy('tahun', 'bulan')
            ->orderBy('tahun')
            ->orderBy('bulan')
            ->get();
            
        // Calculate running balance
        $saldoBerjalan = 0;
        $rekapKeuangan = $rekapKeuangan->map(function ($item) use (&$saldoBerjalan) {
            $saldoBulan = $item->pemasukan - $item->pengeluaran;
            $saldoBerjalan += $saldoBulan;
            $item->saldo = $saldoBerjalan;
            
            // Add month name (in Indonesian)
            $bulanNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            $item->nama_bulan = $bulanNames[$item->bulan];
            
            return $item;
        });
        
        // Calculate totals
        $totalPemasukan = $rekapKeuangan->sum('pemasukan');
        $totalPengeluaran = $rekapKeuangan->sum('pengeluaran');
        $saldoAkhir = $totalPemasukan - $totalPengeluaran;
        
        // Create filename for export
        $filename = 'Rekap_Keuangan_' . $kepengurusanlab->laboratorium->nama . '_' . 
                    $kepengurusanlab->tahunKepengurusan->tahun . '.pdf';
        
        // Logic for generating PDF can be added here
        // Example: return PDF::loadView('pdf.rekap-keuangan', [...])->download($filename);
        
        // Since this is just an example, we'll return a response
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
}