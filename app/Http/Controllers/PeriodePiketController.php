<?php

namespace App\Http\Controllers;

use App\Models\PeriodePiket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodePiketController extends Controller
{
    /**
     * Show attendance periods page (Periode Piket)
     */
    public function periodePiket()
    {
        $periodePiket = PeriodePiket::orderBy('created_at', 'desc')->get();
        
        return Inertia::render('PeriodePiket', [
            'periodePiket' => $periodePiket
        ]);
    }
    
    /**
     * Store new attendance period
     */
    public function storePeriode(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'isactive' => 'boolean',
        ]);
        
        // If setting as active, deactivate all other periods
        if ($request->isactive) {
            PeriodePiket::where('isactive', true)->update(['isactive' => false]);
        }
        
        PeriodePiket::create($validated);
        
        return redirect('/piket/periode-piket')->with('success', 'Periode piket berhasil ditambahkan.');
    }
    
    /**
     * Update attendance period
     */
    public function updatePeriode(Request $request, PeriodePiket $periode)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'isactive' => 'boolean',
        ]);
        
        // If setting as active, deactivate all other periods
        if ($request->isactive && !$periode->isactive) {
            PeriodePiket::where('isactive', true)->update(['isactive' => false]);
        }
        
        $periode->update($validated);
        
        return redirect('/piket/periode-piket')->with('success', 'Periode piket berhasil diperbarui.');
    }
    
    /**
     * Delete attendance period
     */
    public function destroyPeriode(PeriodePiket $periode)
    {
        // Check if this period has associated records
        if ($periode->jadwalPiket()->count() > 0 || $periode->absensi()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus periode yang memiliki jadwal atau absensi terkait.');
        }
        
        // If active period is being deleted, activate the newest period
        if ($periode->isactive) {
            $newestPeriode = PeriodePiket::where('id', '!=', $periode->id)
                ->orderBy('tanggal_mulai', 'desc')
                ->first();
                
            if ($newestPeriode) {
                $newestPeriode->update(['isactive' => true]);
            }
        }
        
        $periode->delete();
        
        return redirect('/piket/periode-piket')->with('success', 'Periode piket berhasil dihapus.');
    }
}