<?php

namespace App\Http\Controllers;

use App\Models\PeriodePiket;
use App\Models\JadwalPiket;
use App\Models\Absensi;
use App\Models\TahunKepengurusan;
use App\Models\Laboratorium;
use App\Models\KepengurusanLab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class PeriodePiketController extends Controller
{
    public function index(Request $request)
    {
        $lab_id = $request->input('lab_id');
        $tahun_id = $request->input('tahun_id');
        
        // If no year selected, use active year
        if (!$tahun_id) {
            $tahunAktif = TahunKepengurusan::where('isactive', true)->first();
            $tahun_id = $tahunAktif ? $tahunAktif->id : null;
        }
    
        // Get all years for dropdown
        $tahunKepengurusan = TahunKepengurusan::orderBy('tahun', 'desc')->get();
    
        // Get all labs for dropdown
        $laboratorium = Laboratorium::all();
    
        $periodePiket = collect([]);
        $kepengurusanlab = null;
    
        if ($lab_id && $tahun_id) {
            // Find lab management based on lab_id and tahun_id
            $kepengurusanlab = KepengurusanLab::where('laboratorium_id', $lab_id)
                ->where('tahun_kepengurusan_id', $tahun_id)
                ->with(['tahunKepengurusan', 'laboratorium'])
                ->first();
    
            if ($kepengurusanlab) {
                // Important: Only show periods for this specific kepengurusan_lab
                $periodePiket = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanlab->id)
                    ->orderBy('tanggal_mulai', 'desc')
                    ->get();
                    
                Log::info('Found ' . $periodePiket->count() . ' periods for kepengurusan_lab_id ' . $kepengurusanlab->id);
            } else {
                Log::warning('No kepengurusan_lab found for lab_id: ' . $lab_id . ' and tahun_id: ' . $tahun_id);
            }
        }
        
        return Inertia::render('PeriodePiket', [
            'periodes' => $periodePiket,
            'kepengurusanlab' => $kepengurusanlab,
            'tahunKepengurusan' => $tahunKepengurusan,
            'laboratorium' => $laboratorium,
            'filters' => [
                'lab_id' => $lab_id,
                'tahun_id' => $tahun_id,
            ]
        ]);
    }
    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
                'isactive' => 'boolean',
                'kepengurusan_lab_id' => 'required|exists:kepengurusan_lab,id',
            ]);
            
            if (!isset($validated['isactive'])) {
                $validated['isactive'] = false;
            }
            
            $this->validateWeekdayPeriod($validated['tanggal_mulai'], $validated['tanggal_selesai']);
            
            // Pass the kepengurusan_lab_id to only check for overlap within the same lab
            $this->checkOverlappingPeriods(
                null, 
                $validated['tanggal_mulai'], 
                $validated['tanggal_selesai'],
                $validated['kepengurusan_lab_id']
            );
            
            if ($validated['isactive']) {
                // Only deactivate periods within the same kepengurusan_lab
                PeriodePiket::where('kepengurusan_lab_id', $validated['kepengurusan_lab_id'])
                    ->where('isactive', true)
                    ->update(['isactive' => false]);
            }
            
            $periodePiket = PeriodePiket::create($validated);
            
            // Keep the selected lab and year when redirecting
            return redirect()->route('piket.periode-piket.index', [
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id')
            ])->with('success', 'Periode piket berhasil ditambahkan.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating periode piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan periode piket: ' . $e->getMessage())->withInput();
        }
    }
    
    public function update(Request $request, $id)
    {
        try {
            $periode = PeriodePiket::findOrFail($id);
            
            // Special handling for just toggling active status
            if ($request->has('isactive') && count($request->all()) <= 3) {
                // Count can be up to 3 because lab_id and tahun_id might be included
                $isActive = (bool) $request->input('isactive');
                
                if ($isActive) {
                    // Only deactivate periods within the same kepengurusan_lab
                    PeriodePiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
                        ->where('isactive', true)
                        ->update(['isactive' => false]);
                }
                
                $periode->update(['isactive' => $isActive]);
                
                // Keep the selected lab and year when redirecting
                return redirect()->route('piket.periode-piket.index', [
                    'lab_id' => $request->input('lab_id'),
                    'tahun_id' => $request->input('tahun_id')
                ])->with('success', $isActive ? 'Periode piket berhasil diaktifkan.' : 'Periode piket berhasil dinonaktifkan.');
            }
            
            // For full updates, validate all fields
            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
                'isactive' => 'boolean',
            ]);
            
            if (!isset($validated['isactive'])) {
                $validated['isactive'] = false;
            }
            
            $this->validateWeekdayPeriod($validated['tanggal_mulai'], $validated['tanggal_selesai']);
            
            // Pass the kepengurusan_lab_id to only check for overlap within the same lab
            $this->checkOverlappingPeriods(
                $periode->id, 
                $validated['tanggal_mulai'], 
                $validated['tanggal_selesai'],
                $periode->kepengurusan_lab_id
            );
            
            if ($validated['isactive'] && !$periode->isactive) {
                // Only deactivate periods within the same kepengurusan_lab
                PeriodePiket::where('kepengurusan_lab_id', $periode->kepengurusan_lab_id)
                    ->where('isactive', true)
                    ->update(['isactive' => false]);
            }
            
            $periode->update($validated);
            
            // Keep the selected lab and year when redirecting
            return redirect()->route('piket.periode-piket.index', [
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id')
            ])->with('success', 'Periode piket berhasil diperbarui.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating periode piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui periode piket: ' . $e->getMessage())->withInput();
        }
    }
    
    public function destroy(Request $request, $id)
    {
        try {
            $periode = PeriodePiket::findOrFail($id);
            
            $hasAbsensi = $periode->absensi()->exists();
            
            if ($hasAbsensi) {
                // Return Inertia response for error case
                return back()->with('error', 'Tidak dapat menghapus periode yang memiliki absensi terkait.');
            }
            
            if ($periode->isactive) {
                // Find newest period in the same lab to make active
                $newestPeriode = PeriodePiket::where('id', '!=', $id)
                    ->where('kepengurusan_lab_id', $periode->kepengurusan_lab_id) // Only look in the same lab
                    ->orderBy('tanggal_mulai', 'desc')
                    ->first();
                    
                if ($newestPeriode) {
                    $newestPeriode->update(['isactive' => true]);
                }
            }
            
            $periode->delete();
            
            // Return Inertia response with success message and keep the current lab and year
            return redirect()->route('piket.periode-piket.index', [
                'lab_id' => $request->input('lab_id'),
                'tahun_id' => $request->input('tahun_id')
            ])->with('success', 'Periode piket berhasil dihapus.');
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting periode: ' . $e->getMessage());
            
            // Return Inertia response for error case
            return back()->with('error', 'Gagal menghapus periode piket: ' . $e->getMessage());
        }
    }
    
    private function checkOverlappingPeriods($excludeId, $startDate, $endDate, $kepengurusanLabId = null)
    {
        // This is the key change - only check for overlaps within the same kepengurusan_lab_id
        if (!$kepengurusanLabId) {
            // If no kepengurusan_lab_id is provided, we don't need to check for overlaps
            return;
        }
        
        // Build a query to check for overlapping periods within the same lab
        $query = PeriodePiket::where('kepengurusan_lab_id', $kepengurusanLabId)
            ->where(function($q) use ($startDate, $endDate) {
                $q->where(function($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '<=', $startDate)
                      ->where('tanggal_selesai', '>=', $startDate);
                })->orWhere(function($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '<=', $endDate)
                      ->where('tanggal_selesai', '>=', $endDate);
                })->orWhere(function($q) use ($startDate, $endDate) {
                    $q->where('tanggal_mulai', '>=', $startDate)
                      ->where('tanggal_selesai', '<=', $endDate);
                });
            });
        
        // Exclude current record when updating
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        $overlapping = $query->first();
        
        if ($overlapping) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode ini tumpang tindih dengan periode ' . $overlapping->nama . ' (' . 
                    $overlapping->tanggal_mulai->format('d/m/Y') . ' - ' . 
                    $overlapping->tanggal_selesai->format('d/m/Y') . ')'
            ]);
        }
    }
    
    private function validateWeekdayPeriod($startDate, $endDate)
    {
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        // Check if start date is a Monday
        if ($start->dayOfWeek !== 1) { // 1 = Monday in Carbon
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode harus dimulai pada hari Senin.'
            ]);
        }
        
        // Check if end date is a Friday
        if ($end->dayOfWeek !== 5) { // 5 = Friday in Carbon
            throw ValidationException::withMessages([
                'tanggal_selesai' => 'Periode harus diakhiri pada hari Jumat.'
            ]);
        }
        
        // Ensure end date is the Friday of the same week as the start date
        $expectedEnd = (clone $start)->next(5); // Get Friday of the same week
        if ($end->format('Y-m-d') !== $expectedEnd->format('Y-m-d')) {
            throw ValidationException::withMessages([
                'tanggal_selesai' => 'Tanggal selesai harus hari Jumat di minggu yang sama dengan tanggal mulai.'
            ]);
        }
        
        // Check for weekends
        if ($start->isWeekend() || $end->isWeekend()) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode harus dimulai dan diakhiri pada hari kerja (Senin-Jumat).'
            ]);
        }
    }
}
