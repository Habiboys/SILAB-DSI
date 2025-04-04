<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\PeriodePiket;

class FixPeriodePiketDelete extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:periode-piket-delete {id : The ID of the periode to delete}'
                           . ' {--force : Force delete even if there are related records}'
                           . ' {--check : Only check for related records without deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix delete functionality for PeriodePiket';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $id = $this->argument('id');
        $force = $this->option('force');
        $checkOnly = $this->option('check');
        
        $this->info("Working with periode ID: {$id}");
        
        // Check if periode exists
        $periode = PeriodePiket::find($id);
        if (!$periode) {
            $this->error("Periode with ID {$id} not found!");
            return 1;
        }
        
        $this->info("Found periode: {$periode->nama} ({$periode->tanggal_mulai} - {$periode->tanggal_selesai})");
        
        // Check for related records
        $this->info("\nChecking for related records...");
        
        // Check jadwal_piket
        $jadwalCount = DB::table('jadwal_piket')->where('periode_piket_id', $id)->count();
        $this->info("Related jadwal_piket records: {$jadwalCount}");
        
        // Check absensi
        $absensiCount = DB::table('absensi')->where('periode_piket_id', $id)->count();
        $this->info("Related absensi records: {$absensiCount}");
        
        // Check for foreign key constraints
        $this->info("\nChecking database foreign key constraints...");
        $constraints = DB::select("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                                WHERE REFERENCED_TABLE_NAME = 'periode_piket'
                                AND REFERENCED_COLUMN_NAME = 'id'
                                AND TABLE_SCHEMA = DATABASE()");
        
        if (count($constraints) > 0) {
            $this->info("Found " . count($constraints) . " foreign key constraints:");
            foreach ($constraints as $constraint) {
                $this->info("- Table: {$constraint->TABLE_NAME}, Column: {$constraint->COLUMN_NAME}, Constraint: {$constraint->CONSTRAINT_NAME}");
                
                // Check if there are any records in this table referencing our periode
                $count = DB::table($constraint->TABLE_NAME)
                          ->where($constraint->COLUMN_NAME, $id)
                          ->count();
                
                $this->info("  Records referencing periode ID {$id}: {$count}");
            }
        } else {
            $this->info("No foreign key constraints found.");
        }
        
        if ($checkOnly) {
            $this->info("\nCheck only mode - not deleting anything.");
            return 0;
        }
        
        // If there are related records and force is not enabled, stop
        if (($jadwalCount > 0 || $absensiCount > 0) && !$force) {
            $this->error("\nCannot delete periode because it has related records. Use --force to override.");
            return 1;
        }
        
        // If force is enabled and there are related records, delete them first
        if ($force && ($jadwalCount > 0 || $absensiCount > 0)) {
            $this->warn("\nForce option enabled - deleting related records first.");
            
            if ($jadwalCount > 0) {
                $this->info("Deleting {$jadwalCount} related jadwal_piket records...");
                $deleted = DB::table('jadwal_piket')->where('periode_piket_id', $id)->delete();
                $this->info("Deleted {$deleted} jadwal_piket records.");
            }
            
            if ($absensiCount > 0) {
                $this->info("Deleting {$absensiCount} related absensi records...");
                $deleted = DB::table('absensi')->where('periode_piket_id', $id)->delete();
                $this->info("Deleted {$deleted} absensi records.");
            }
        }
        
        // If active period is being deleted, activate the newest period
        if ($periode->isactive) {
            $this->info("\nThis is an active period - finding a new period to activate...");
            $newestPeriode = PeriodePiket::where('id', '!=', $id)
                ->orderBy('tanggal_mulai', 'desc')
                ->first();
                
            if ($newestPeriode) {
                $this->info("Activating newest periode: {$newestPeriode->nama}");
                $newestPeriode->update(['isactive' => true]);
            } else {
                $this->warn("No other periods found to activate.");
            }
        }
        
        // Try different delete methods
        $this->info("\nAttempting to delete periode...");
        
        try {
            // Try direct DB delete first
            $this->info("Method 1: Using DB::delete()...");
            $deleted = DB::delete('DELETE FROM periode_piket WHERE id = ?', [$id]);
            $this->info("Result: " . ($deleted ? "Success ({$deleted} rows)" : "Failed"));
            
            // Check if it worked
            $stillExists = PeriodePiket::find($id);
            if (!$stillExists) {
                $this->info("\nSUCCESS: Periode successfully deleted!");
                return 0;
            }
            
            // If that didn't work, try Eloquent delete
            $this->info("\nMethod 2: Using Eloquent delete()...");
            $result = $periode->delete();
            $this->info("Result: " . ($result ? "Success" : "Failed"));
            
            // Check if it worked
            $stillExists = PeriodePiket::find($id);
            if (!$stillExists) {
                $this->info("\nSUCCESS: Periode successfully deleted!");
                return 0;
            }
            
            // If that didn't work, try force delete
            $this->info("\nMethod 3: Using Eloquent forceDelete()...");
            $result = $periode->forceDelete();
            $this->info("Result: " . ($result ? "Success" : "Failed"));
            
            // Final check
            $stillExists = PeriodePiket::find($id);
            if (!$stillExists) {
                $this->info("\nSUCCESS: Periode successfully deleted!");
                return 0;
            }
            
            $this->error("\nAll delete methods failed!");
            return 1;
            
        } catch (\Exception $e) {
            $this->error("\nError during delete: " . $e->getMessage());
            return 1;
        }
    }
}
