<?php

namespace Database\Seeders;

use App\Models\Praktikan;
use App\Models\User;
use App\Models\Laboratorium;
use App\Models\Praktikum;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PraktikanSeeder extends Seeder
{
    public function run()
    {
        // Ambil semua praktikan yang belum punya user_id
        $praktikans = Praktikan::whereNull('user_id')->get();
        
        foreach ($praktikans as $praktikan) {
            // Generate email unik untuk praktikan
            $email = $this->generateUniqueEmail($praktikan->nim, $praktikan->nama);
            
            // Get lab_id from praktikum
            $labId = $praktikan->praktikum->kepengurusanLab->laboratorium_id ?? null;
            
            // Buat user baru
            $user = User::create([
                'name' => $praktikan->nama,
                'email' => $email,
                'password' => Hash::make($praktikan->nim), // Password default: NIM
                'laboratory_id' => $labId // Assign ke lab yang sama
            ]);
            
            // Assign role praktikan
            $user->assignRole('praktikan');
            
            // Update praktikan dengan user_id
            $praktikan->update([
                'user_id' => $user->id
            ]);
            
            echo "Created user for praktikan: {$praktikan->nama} ({$praktikan->nim}) - Email: {$email}\n";
        }
        
        echo "\nTotal praktikan processed: " . $praktikans->count() . "\n";
    }
    
    /**
     * Generate unique email untuk praktikan
     */
    private function generateUniqueEmail($nim, $nama)
    {
        // Ambil kata pertama dari nama (nama awal)
        $nama_awal = strtok(strtolower($nama), ' ');
        // Bersihkan karakter khusus dan spasi
        $nama_awal = preg_replace('/[^a-zA-Z0-9]/', '', $nama_awal);
        
        $baseEmail = $nim . '_' . $nama_awal . '@student.unand.ac.id';
        
        // Jika email sudah ada, tambahkan counter
        $counter = 1;
        $email = $baseEmail;
        
        while (User::where('email', $email)->exists()) {
            $email = $nim . '_' . $nama_awal . '.' . $counter . '@student.unand.ac.id';
            $counter++;
        }
        
        return $email;
    }
}
