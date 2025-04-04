<?php

namespace App\Http\Controllers;

use App\Models\PeriodePiket;
use App\Models\JadwalPiket;
use App\Models\Absensi;
use App\Models\TahunKepengurusan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class PeriodePiketController extends Controller
{
    public function index(Request $request)
    {
        // Get all periods ordered by creation date
        $periodePiket = PeriodePiket::orderBy('created_at', 'asc')->get();
        
        // Get active tahun kepengurusan for reference
        $activeTahun = TahunKepengurusan::where('isactive', true)->first();
        
        return Inertia::render('PeriodePiket', [
            'periodes' => $periodePiket,
            'tahunKepengurusan' => TahunKepengurusan::orderBy('tahun', 'desc')->get(),
            'selectedTahun' => $activeTahun ? $activeTahun->id : null,
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
            ]);
            
            if (!isset($validated['isactive'])) {
                $validated['isactive'] = false;
            }
            
            $this->validateWeekdayPeriod($validated['tanggal_mulai'], $validated['tanggal_selesai']);
            
            $this->checkOverlappingPeriods(
                null, 
                $validated['tanggal_mulai'], 
                $validated['tanggal_selesai']
            );
            
            if ($validated['isactive']) {
                PeriodePiket::where('isactive', true)->update(['isactive' => false]);
            }
            
            PeriodePiket::create($validated);
            
            return redirect()->route('piket.periode-piket.index')
                ->with('success', 'Periode piket berhasil ditambahkan.');
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
            
            if ($request->has('isactive') && count($request->all()) === 1) {
                $isActive = (bool) $request->input('isactive');
                
                if ($isActive) {
                    PeriodePiket::where('isactive', true)->update(['isactive' => false]);
                }
                
                $periode->update(['isactive' => $isActive]);
                
                return redirect()->route('piket.periode-piket.index')
                    ->with('success', $isActive ? 'Periode piket berhasil diaktifkan.' : 'Periode piket berhasil dinonaktifkan.');
            }
            
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
            
            $this->checkOverlappingPeriods(
                $periode->id, 
                $validated['tanggal_mulai'], 
                $validated['tanggal_selesai']
            );
            
            if ($validated['isactive'] && !$periode->isactive) {
                PeriodePiket::where('isactive', true)->update(['isactive' => false]);
            }
            
            $periode->update($validated);
            
            return redirect()->route('piket.periode-piket.index')
                ->with('success', 'Periode piket berhasil diperbarui.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating periode piket: ' . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui periode piket: ' . $e->getMessage())->withInput();
        }
    }
    
    public function destroy($id)
    {
        try {
            $periode = PeriodePiket::findOrFail($id);
            
            $hasAbsensi = $periode->absensi()->exists();
            
            if ($hasAbsensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus periode yang memiliki absensi terkait.'
                ], 422);
            }
            
            if ($periode->isactive) {
                $newestPeriode = PeriodePiket::where('id', '!=', $id)
                    ->orderBy('tanggal_mulai', 'desc')
                    ->first();
                    
                if ($newestPeriode) {
                    $newestPeriode->update(['isactive' => true]);
                }
            }
            
            $periode->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Periode piket berhasil dihapus.'
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting periode: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus periode piket: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function checkOverlappingPeriods($excludeId, $startDate, $endDate)
    {
        $query = PeriodePiket::where(function($q) use ($startDate, $endDate) {
            $q->where('tanggal_mulai', '<=', $startDate)
              ->where('tanggal_selesai', '>=', $startDate);
        })->orWhere(function($q) use ($startDate, $endDate) {
            $q->where('tanggal_mulai', '<=', $endDate)
              ->where('tanggal_selesai', '>=', $endDate);
        })->orWhere(function($q) use ($startDate, $endDate) {
            $q->where('tanggal_mulai', '>=', $startDate)
              ->where('tanggal_selesai', '<=', $endDate);
        });
        
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
        
        $days = $end->diffInDays($start);
        
        if ($days > 5) {
            throw ValidationException::withMessages([
                'tanggal_selesai' => 'Periode tidak boleh lebih dari 5 hari.'
            ]);
        }
        
        if ($start->isWeekend() || $end->isWeekend()) {
            throw ValidationException::withMessages([
                'tanggal_mulai' => 'Periode harus dimulai dan diakhiri pada hari kerja (Senin-Jumat).'
            ]);
        }
        
        if ($start->dayOfWeek !== 1) { // 1 = Monday in Carbon
            Log::info('Periode piket dimulai pada ' . $start->locale('id')->dayName . ' bukan Senin');
        }
        
        if ($end->dayOfWeek !== 5) { // 5 = Friday in Carbon
            Log::info('Periode piket diakhiri pada ' . $end->locale('id')->dayName . ' bukan Jumat');
        }
    }
}
