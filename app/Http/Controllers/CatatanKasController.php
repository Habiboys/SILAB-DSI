<?php

namespace App\Http\Controllers;

use App\Models\RiwayatKeuangan;
use App\Models\User;
use App\Models\Laboratorium;
use App\Models\TahunKepengurusan;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;


class CatatanKasController extends Controller
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
        
        // Initialize variables to prevent undefined errors
        $users = collect([]);
        $transformedData = [];
        $kepengurusanlab = null;
        $bulanData = [];
        
        if ($tahun_id) {
            // Get the selected year data to determine month range
            $selectedTahunKepengurusan = TahunKepengurusan::find($tahun_id);
            
            if ($selectedTahunKepengurusan) {
                // Get the ordered month list based on mulai and selesai
                $bulanData = $this->getOrderedMonths(
                    $selectedTahunKepengurusan->mulai,
                    $selectedTahunKepengurusan->selesai
                );
            } else {
                // Fallback to standard month order
                $bulanData = $this->getStandardMonthOrder();
            }
        } else {
            // Fallback to standard month order
            $bulanData = $this->getStandardMonthOrder();
        }
    
        if ($lab_id && $tahun_id) {
            // Find lab management based on lab_id and year_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();
    
            if ($kepengurusanlab) {
                // Get all active users from the selected lab
                // Modified to get only assistant users
                $users = User::whereHas('struktur', function($query) use ($kepengurusanlab) {
                    $query->where('kepengurusan_lab_id', $kepengurusanlab->id)
                          ->where('tipe_jabatan', 'asisten');
                })
                ->where('laboratorium_id', $lab_id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']);
                
                // Initialize transformed data structure for each user
                $userPaymentData = [];
                foreach ($users as $user) {
                    $userPaymentData[$user->id] = [
                        'user_id' => $user->id,
                        'name' => $user->name,
                        'payments' => [] // Will hold all payment records for this user
                    ];
                }
                
                // Get all payment records for the selected lab and kepengurusan
                $uangKasData = RiwayatKeuangan::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->where('is_uang_kas', 1)
                    ->select(
                        'id',
                        'user_id',
                        'tanggal',
                        DB::raw('MONTH(tanggal) as bulan_angka'),
                        DB::raw('CEIL(DAY(tanggal) / 7) as minggu')
                    )
                    ->get();
                
                // Process all payment records
                foreach ($uangKasData as $record) {
                    $bulan = $this->getIndonesianMonth($record->bulan_angka);
                    $minggu = $record->minggu > 4 ? 4 : $record->minggu; // Cap at 4 weeks
                    
                    // Add this payment to the user's payment array
                    if (isset($userPaymentData[$record->user_id])) {
                        $userPaymentData[$record->user_id]['payments'][] = [
                            'id' => $record->id,
                            'bulan' => $bulan,
                            'bulan_angka' => $record->bulan_angka,
                            'minggu' => $minggu,
                            'tanggal' => $record->tanggal,
                        ];
                    }
                }
                
                // Transform data for easier consumption in frontend
                $transformedData = [];
                foreach ($bulanData as $bulanName => $bulanAngka) {
                    foreach (range(1, 4) as $minggu) {
                        foreach ($userPaymentData as $userId => $userData) {
                            // Check if user has payment for this month and week
                            $hasPaid = false;
                            foreach ($userData['payments'] as $payment) {
                                if ($payment['bulan'] === $bulanName && $payment['minggu'] === $minggu) {
                                    $hasPaid = true;
                                    break;
                                }
                            }
                            
                            // Add this cell to the transformed data
                            $transformedData[] = [
                                'user_id' => $userId,
                                'user_name' => $userData['name'],
                                'bulan' => $bulanName,
                                'minggu' => $minggu,
                                'status' => $hasPaid,
                                // Count how many payments this user has made
                                'payment_count' => count($userData['payments'])
                            ];
                        }
                    }
                }
                
                // Optional: Restructure into user-centric format if needed
                $userCentricData = [];
                foreach ($users as $user) {
                    $userCentricData[$user->id] = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'payment_count' => $userPaymentData[$user->id]['payments'] ? count($userPaymentData[$user->id]['payments']) : 0,
                        'months' => []
                    ];
                    
                    // Add month data for this user
                    foreach ($bulanData as $bulanName => $bulanAngka) {
                        $userCentricData[$user->id]['months'][$bulanName] = [
                            'weeks' => []
                        ];
                        
                        foreach (range(1, 4) as $minggu) {
                            $hasPaid = false;
                            foreach ($userPaymentData[$user->id]['payments'] as $payment) {
                                if ($payment['bulan'] === $bulanName && $payment['minggu'] === $minggu) {
                                    $hasPaid = true;
                                    break;
                                }
                            }
                            
                            $userCentricData[$user->id]['months'][$bulanName]['weeks'][$minggu] = $hasPaid;
                        }
                    }
                }
            }
        }
        
        // Tambahkan di akhir metode index sebelum return
dd([
    'lab_id' => $lab_id,
    'tahun_id' => $tahun_id,
    'kepengurusanlab' => $kepengurusanlab,
    'user_count' => count($users),
    'transformed_data_count' => count($transformedData),
    'userCentricData' => $userCentricData ?? []
]);
        return Inertia::render('CatatanKas', [
            'catatanKas' => $transformedData,
            'userCentricData' => $userCentricData ?? [], // Alternative data structure
            'anggota' => $users,
            'bulanData' => $bulanData,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id
            ],
        ]);
    }
    
    /**
     * Helper to convert month number to Indonesian month name
     */
    private function getIndonesianMonth($monthNumber)
    {
        $months = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];
        
        return $months[$monthNumber] ?? '';
    }
    
    /**
     * Get ordered months based on start and end months
     */
    private function getOrderedMonths($startMonth, $endMonth)
    {
        // Convert month names to numbers
        $monthNameToNumber = [
            'Januari' => 1,
            'Februari' => 2,
            'Maret' => 3,
            'April' => 4,
            'Mei' => 5,
            'Juni' => 6,
            'Juli' => 7,
            'Agustus' => 8,
            'September' => 9,
            'Oktober' => 10,
            'November' => 11,
            'Desember' => 12
        ];
        
        $monthNumberToName = array_flip($monthNameToNumber);
        
        $startMonthNum = $monthNameToNumber[$startMonth] ?? 1;
        $endMonthNum = $monthNameToNumber[$endMonth] ?? 12;
        
        $orderedMonths = [];
        
        // If start month comes before end month (e.g., March to June)
        if ($startMonthNum <= $endMonthNum) {
            for ($i = $startMonthNum; $i <= $endMonthNum; $i++) {
                $orderedMonths[$monthNumberToName[$i]] = $i;
            }
        }
        // If start month comes after end month (e.g., March to February - crossing year boundary)
        else {
            // Add months from start month to December
            for ($i = $startMonthNum; $i <= 12; $i++) {
                $orderedMonths[$monthNumberToName[$i]] = $i;
            }
            
            // Then add months from January to end month
            for ($i = 1; $i <= $endMonthNum; $i++) {
                $orderedMonths[$monthNumberToName[$i]] = $i;
            }
        }
        
        return $orderedMonths;
    }
    
    /**
     * Get standard calendar month order (Jan-Dec)
     */
    private function getStandardMonthOrder()
    {
        return [
            'Januari' => 1,
            'Februari' => 2,
            'Maret' => 3,
            'April' => 4,
            'Mei' => 5,
            'Juni' => 6,
            'Juli' => 7,
            'Agustus' => 8,
            'September' => 9,
            'Oktober' => 10,
            'November' => 11,
            'Desember' => 12
        ];
    }
}