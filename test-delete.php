<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\PeriodePiket;

// ID of the periode to delete
$id = 4; // Change this to the ID you're trying to delete

try {
    echo "Starting delete test for periode ID: {$id}\n";
    
    // Check if periode exists
    $periode = PeriodePiket::find($id);
    if (!$periode) {
        echo "ERROR: Periode with ID {$id} not found!\n";
        exit(1);
    }
    
    echo "Found periode: " . json_encode($periode->toArray()) . "\n";
    
    // Check for related records
    $jadwalCount = DB::table('jadwal_piket')->where('periode_piket_id', $id)->count();
    $absensiCount = DB::table('absensi')->where('periode_piket_id', $id)->count();
    
    echo "Related jadwal_piket records: {$jadwalCount}\n";
    echo "Related absensi records: {$absensiCount}\n";
    
    if ($jadwalCount > 0 || $absensiCount > 0) {
        echo "ERROR: Cannot delete periode because it has related records!\n";
        exit(1);
    }
    
    // Try different delete methods
    echo "\nTrying different delete methods:\n";
    
    // Method 1: Eloquent delete
    try {
        echo "Method 1: Eloquent delete...\n";
        $result = $periode->delete();
        echo "Result: " . ($result ? "Success" : "Failed") . "\n";
        
        // Check if still exists
        $stillExists = PeriodePiket::find($id);
        echo "Still exists after Method 1: " . ($stillExists ? "Yes" : "No") . "\n";
        
        if (!$stillExists) {
            echo "SUCCESS: Deleted with Method 1!\n";
            exit(0);
        }
    } catch (Exception $e) {
        echo "Exception in Method 1: " . $e->getMessage() . "\n";
    }
    
    // Method 2: Query Builder delete
    try {
        echo "\nMethod 2: Query Builder delete...\n";
        $result = DB::table('periode_piket')->where('id', $id)->delete();
        echo "Result: " . ($result ? "Success ({$result} rows)" : "Failed") . "\n";
        
        // Check if still exists
        $stillExists = PeriodePiket::find($id);
        echo "Still exists after Method 2: " . ($stillExists ? "Yes" : "No") . "\n";
        
        if (!$stillExists) {
            echo "SUCCESS: Deleted with Method 2!\n";
            exit(0);
        }
    } catch (Exception $e) {
        echo "Exception in Method 2: " . $e->getMessage() . "\n";
    }
    
    // Method 3: Raw SQL delete
    try {
        echo "\nMethod 3: Raw SQL delete...\n";
        $result = DB::statement('DELETE FROM periode_piket WHERE id = ?', [$id]);
        echo "Result: " . ($result ? "Success" : "Failed") . "\n";
        
        // Check if still exists
        $stillExists = PeriodePiket::find($id);
        echo "Still exists after Method 3: " . ($stillExists ? "Yes" : "No") . "\n";
        
        if (!$stillExists) {
            echo "SUCCESS: Deleted with Method 3!\n";
            exit(0);
        }
    } catch (Exception $e) {
        echo "Exception in Method 3: " . $e->getMessage() . "\n";
    }
    
    // If we get here, all methods failed
    echo "\nERROR: All delete methods failed!\n";
    
    // Check for foreign key constraints
    echo "\nChecking for foreign key constraints...\n";
    $constraints = DB::select("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                              FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                              WHERE REFERENCED_TABLE_NAME = 'periode_piket'
                              AND REFERENCED_COLUMN_NAME = 'id'
                              AND TABLE_SCHEMA = DATABASE()");
    
    if (count($constraints) > 0) {
        echo "Found " . count($constraints) . " foreign key constraints:\n";
        foreach ($constraints as $constraint) {
            echo "- Table: {$constraint->TABLE_NAME}, Column: {$constraint->COLUMN_NAME}, Constraint: {$constraint->CONSTRAINT_NAME}\n";
            
            // Check if there are any records in this table referencing our periode
            $count = DB::table($constraint->TABLE_NAME)
                      ->where($constraint->COLUMN_NAME, $id)
                      ->count();
            
            echo "  Records referencing periode ID {$id}: {$count}\n";
        }
    } else {
        echo "No foreign key constraints found.\n";
    }
    
} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
