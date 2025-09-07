<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use App\Models\Praktikan;
use App\Models\Kelas;
use App\Models\PraktikanPraktikum;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PraktikanImport implements ToModel, WithHeadingRow, SkipsOnError
{
    use SkipsErrors;
    
    protected $praktikumId;
    protected $kelasCache = [];
    protected $existingUsersCache = [];
    protected $existingPraktikanCache = [];

    public function __construct($praktikumId)
    {
        $this->praktikumId = $praktikumId;
        \Log::info('PraktikanImport constructed', ['praktikum_id' => $praktikumId]);
        
        // Pre-load semua kelas untuk praktikum ini
        $this->loadKelasCache();
        
        // Pre-load existing users dan praktikan untuk batch processing
        $this->loadExistingDataCache();
    }

    /**
     * Pre-load semua kelas untuk praktikum ini
     */
    private function loadKelasCache()
    {
        $kelas = Kelas::where('praktikum_id', $this->praktikumId)
            ->where('status', 'aktif')
            ->get(['id', 'nama_kelas']);
            
        foreach ($kelas as $k) {
            $this->kelasCache[$k->nama_kelas] = $k->id;
        }
        
        \Log::info('Loaded kelas cache', ['count' => count($this->kelasCache)]);
    }

    /**
     * Pre-load existing users dan praktikan untuk batch processing
     */
    private function loadExistingDataCache()
    {
        // Load existing users yang mungkin akan digunakan
        $existingUsers = User::whereHas('praktikan', function($query) {
            $query->where('nim', '!=', '');
        })->get(['id', 'email']);
        
        foreach ($existingUsers as $user) {
            $this->existingUsersCache[$user->email] = $user->id;
        }
        
        // Load existing praktikan berdasarkan NIM
        $existingPraktikan = Praktikan::where('nim', '!=', '')->get(['id', 'nim']);
        foreach ($existingPraktikan as $p) {
            $this->existingPraktikanCache[$p->nim] = $p->id;
        }
        
        \Log::info('Loaded existing data cache', [
            'users_count' => count($this->existingUsersCache),
            'praktikan_count' => count($this->existingPraktikanCache)
        ]);
    }

    /**
     * Generate email berdasarkan NIM dan nama (konsisten dengan controller)
     */
    private function generateEmail($nim, $nama)
    {
        $nama_awal = strtok(strtolower($nama), ' ');
        $nama_awal = preg_replace('/[^a-zA-Z0-9]/', '', $nama_awal);
        return $nim . '_' . $nama_awal . '@student.unand.ac.id';
    }

    public function model(array $row)
    {
        \Log::info('Processing row', ['row' => $row]);

        // Skip jika data tidak lengkap
        if (empty($row['nim']) || empty($row['nama'])) {
            \Log::info('Skipping incomplete row', ['row' => $row]);
            return null;
        }

        $nim = trim((string) $row['nim']);
        $nama = trim((string) $row['nama']);
        $noHp = !empty($row['no_hp']) ? trim((string) $row['no_hp']) : null;
        $kelas = !empty($row['kelas']) ? trim((string) $row['kelas']) : null;

        // Validasi manual
        if (strlen($nim) < 3 || strlen($nama) < 2) {
            \Log::warning('Data tidak valid', ['nim' => $nim, 'nama' => $nama]);
            return null;
        }

        // Resolve kelas dari cache
        $kelasId = $this->kelasCache[$kelas] ?? null;
        if (!$kelasId) {
            \Log::warning('Kelas tidak ditemukan', ['nama_kelas' => $kelas]);
            return null;
        }

        // Check existing praktikan dari cache
        $existingPraktikanId = $this->existingPraktikanCache[$nim] ?? null;

        if ($existingPraktikanId) {
            // Update existing praktikan dan enrollment
            $this->updateExistingPraktikan($existingPraktikanId, $nama, $noHp, $kelasId);
            return null;
        }

        // Create new praktikan dan user
        return $this->createNewPraktikan($nim, $nama, $noHp, $kelasId);
    }

    /**
     * Update existing praktikan dan enrollment
     */
    private function updateExistingPraktikan($praktikanId, $nama, $noHp, $kelasId)
    {
        // Update praktikan data
        Praktikan::where('id', $praktikanId)->update([
            'nama' => $nama,
            'no_hp' => $noHp ?? DB::raw('no_hp')
        ]);

        // Update atau create enrollment
        PraktikanPraktikum::updateOrCreate(
            [
                'praktikan_id' => $praktikanId,
                'praktikum_id' => $this->praktikumId
            ],
            [
                'kelas_id' => $kelasId,
                'status' => 'aktif'
            ]
        );
        
        \Log::info('Updated existing praktikan', ['praktikan_id' => $praktikanId]);
    }

    /**
     * Create new praktikan dan user
     */
    private function createNewPraktikan($nim, $nama, $noHp, $kelasId)
    {
        $email = $this->generateEmail($nim, $nama);
        $existingUserId = $this->existingUsersCache[$email] ?? null;
        
        $userId = null;
        
        if ($existingUserId) {
            \Log::info('Using existing user', ['user_id' => $existingUserId, 'email' => $email]);
            $userId = $existingUserId;
            
            // Assign praktikan role if not exists
            $user = User::find($existingUserId);
            if ($user && !$user->hasRole('praktikan')) {
                $user->assignRole('praktikan');
                \Log::info('Assigned praktikan role to existing user');
            }
        } else {
            // Create new user
            $user = User::create([
                'name' => $nama,
                'email' => $email,
                'password' => Hash::make($nim), // Password = NIM (konsisten dengan controller)
            ]);
            
            // Assign praktikan role
            $user->assignRole('praktikan');
            
            $userId = $user->id;
            \Log::info('Created new user', ['user_id' => $userId, 'email' => $email]);
        }
        
        // Create new praktikan
        $praktikan = new Praktikan([
            'nim' => $nim,
            'nama' => $nama,
            'no_hp' => $noHp,
            'user_id' => $userId,
        ]);

        // Save praktikan first to get ID
        $praktikan->save();
        \Log::info('Saved new praktikan', ['praktikan_id' => $praktikan->id, 'user_id' => $userId]);

        // Create enrollment in praktikan_praktikum
        $enrollment = PraktikanPraktikum::create([
            'praktikan_id' => $praktikan->id,
            'praktikum_id' => $this->praktikumId,
            'kelas_id' => $kelasId,
            'status' => 'aktif'
        ]);
        \Log::info('Created enrollment', ['enrollment_id' => $enrollment->id]);

        return $praktikan;
    }

    public function onError(\Throwable $e)
    {
        \Log::warning('Row validation failed', ['error' => $e->getMessage()]);
    }

    public function customValidationMessages()
    {
        return [
            'nim.required' => 'NIM wajib diisi',
            'nim.max' => 'NIM maksimal 20 karakter',
            'nama.required' => 'Nama wajib diisi',
            'nama.max' => 'Nama maksimal 255 karakter',
            'no_hp.max' => 'No HP maksimal 20 karakter',
            'kelas.required_without' => 'Isi kolom kelas (nama) atau kelas_id (UUID) salah satu',
            'kelas.exists' => 'Nama kelas tidak ditemukan di praktikum ini',
            'kelas_id.required_without' => 'Isi kolom kelas (nama) atau kelas_id (UUID) salah satu',
            'kelas_id.exists' => 'kelas_id tidak valid untuk praktikum ini'
        ];
    }
}
