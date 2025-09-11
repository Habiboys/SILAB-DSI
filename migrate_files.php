<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\Storage;
use App\Models\PengumpulanTugas;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Starting file migration...\n";

// Source and destination paths
$sourcePath = storage_path('app/private/public/pengumpulan_tugas');
$destPath = storage_path('app/private/pengumpulan_tugas');

// Create destination directory if it doesn't exist
if (!is_dir($destPath)) {
    mkdir($destPath, 0755, true);
    echo "Created destination directory: $destPath\n";
}

// Get all files from source directory
$files = glob($sourcePath . '/*');
$movedCount = 0;
$updatedCount = 0;

foreach ($files as $file) {
    if (is_file($file)) {
        $filename = basename($file);
        $newPath = $destPath . '/' . $filename;
        
        // Move file
        if (rename($file, $newPath)) {
            echo "Moved: $filename\n";
            $movedCount++;
            
            // Update database records
            $oldPath = 'public/pengumpulan_tugas/' . $filename;
            $newPath = 'pengumpulan_tugas/' . $filename;
            
            // Update single file records
            $singleFileRecords = PengumpulanTugas::where('file_pengumpulan', 'like', '%' . $oldPath . '%')->get();
            foreach ($singleFileRecords as $record) {
                $record->file_pengumpulan = str_replace($oldPath, $newPath, $record->file_pengumpulan);
                $record->save();
                $updatedCount++;
            }
            
            // Update JSON array records
            $jsonRecords = PengumpulanTugas::where('file_pengumpulan', 'like', '%' . $oldPath . '%')->get();
            foreach ($jsonRecords as $record) {
                $filePaths = json_decode($record->file_pengumpulan, true);
                if (is_array($filePaths)) {
                    $updated = false;
                    foreach ($filePaths as $key => $path) {
                        if (strpos($path, $oldPath) !== false) {
                            $filePaths[$key] = str_replace($oldPath, $newPath, $path);
                            $updated = true;
                        }
                    }
                    if ($updated) {
                        $record->file_pengumpulan = json_encode($filePaths);
                        $record->save();
                        $updatedCount++;
                    }
                }
            }
        } else {
            echo "Failed to move: $filename\n";
        }
    }
}

// Remove empty source directory
if (is_dir($sourcePath) && count(glob($sourcePath . '/*')) === 0) {
    rmdir($sourcePath);
    echo "Removed empty source directory: $sourcePath\n";
}

echo "\nMigration completed!\n";
echo "Files moved: $movedCount\n";
echo "Database records updated: $updatedCount\n";

