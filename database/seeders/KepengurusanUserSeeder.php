<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\KepengurusanUser;
use App\Models\User;
use App\Models\KepengurusanLab;
use App\Models\Struktur;

class KepengurusanUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil data yang diperlukan
        $users = User::with('profile')->get();
        $kepengurusanLabs = KepengurusanLab::all();
        $strukturs = Struktur::all();

        if ($users->isEmpty() || $kepengurusanLabs->isEmpty() || $strukturs->isEmpty()) {
            $this->command->warn('Data tidak lengkap untuk membuat KepengurusanUser');
            return;
        }

        $this->command->info('Memulai seeding KepengurusanUser...');
        $this->command->info('Users found: ' . $users->count());
        $this->command->info('KepengurusanLabs found: ' . $kepengurusanLabs->count());
        $this->command->info('Strukturs found: ' . $strukturs->count());

        // Buat data sample berdasarkan member yang sudah ada
        foreach ($kepengurusanLabs as $kepengurusanLab) {
            $this->command->info('Processing KepengurusanLab: ' . $kepengurusanLab->id);
            
            // Ambil user yang sudah ada di lab ini
            $labUsers = $users->where('laboratory_id', $kepengurusanLab->laboratorium_id);
            
            if ($labUsers->isEmpty()) {
                $this->command->warn('Tidak ada user untuk lab: ' . $kepengurusanLab->laboratorium_id);
                continue;
            }
            
            foreach ($labUsers as $user) {
                // Skip jika user sudah ada di kepengurusan ini
                $existing = KepengurusanUser::where('kepengurusan_lab_id', $kepengurusanLab->id)
                    ->where('user_id', $user->id)
                    ->exists();
                
                if (!$existing) {
                    // Gunakan struktur yang sudah ada di user, atau ambil random
                    $struktur = $user->struktur ?: $strukturs->random();
                    
                    $kepengurusanUser = KepengurusanUser::create([
                        'kepengurusan_lab_id' => $kepengurusanLab->id,
                        'user_id' => $user->id,
                        'struktur_id' => $struktur->id,
                        'is_active' => true,
                        'tanggal_bergabung' => now(),
                        'catatan' => 'Data dari member yang sudah ada',
                    ]);
                    
                    $this->command->info("Created: User {$user->name} -> Struktur {$struktur->struktur} -> Kepengurusan {$kepengurusanLab->id}");
                } else {
                    $this->command->info("Skipped: User {$user->name} sudah ada di kepengurusan ini");
                }
            }
        }

        $totalCreated = KepengurusanUser::count();
        $this->command->info("Total KepengurusanUser created: {$totalCreated}");
    }
}

