<?php

namespace App\Imports;

use App\Models\Praktikan;
use App\Models\User;
use App\Models\Laboratorium;
use App\Models\Kelas;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class PraktikanImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError
{
    use SkipsErrors;

    protected $praktikumId;

    public function __construct($praktikumId)
    {
        $this->praktikumId = $praktikumId;
    }

    public function model(array $row)
    {
        // Check if user already exists with this NIM
        $existingUser = User::whereHas('profile', function($query) use ($row) {
            $query->where('nomor_induk', $row['nim']);
        })->first();

        $userId = null;
        if ($existingUser) {
            $userId = $existingUser->id;
            
            // Check if user already has praktikan role
            if (!$existingUser->hasRole('praktikan')) {
                $existingUser->assignRole('praktikan');
            }
        } else {
            // Create new user if doesn't exist
            $email = $this->generateEmail($row['nim'], $row['nama']);
            
            $user = User::create([
                'name' => $row['nama'],
                'email' => $email,
                'password' => Hash::make($row['nim']), // Default password is NIM
            ]);
            
            // Assign praktikan role
            $user->assignRole('praktikan');
            
            $userId = $user->id;
        }

        // Check if praktikan already exists in this praktikum
        $existingPraktikan = Praktikan::where('praktikum_id', $this->praktikumId)
            ->where('nim', $row['nim'])
            ->first();
            
        if ($existingPraktikan) {
            // Update existing praktikan with new data
            $existingPraktikan->update([
                'nama' => $row['nama'],
                'no_hp' => $row['no_hp'] ?? null,
                'kelas_id' => $row['kelas_id'] ?? null,
                'user_id' => $userId
            ]);
            
            return null; // Skip creating new record
        }

        // Create new praktikan
        return new Praktikan([
            'nim' => $row['nim'],
            'nama' => $row['nama'],
            'no_hp' => $row['no_hp'] ?? null,
            'user_id' => $userId,
            'praktikum_id' => $this->praktikumId,
            'kelas_id' => $row['kelas_id'] ?? null,
            'status' => 'aktif'
        ]);
    }

    public function rules(): array
    {
        return [
            'nim' => 'required|string|max:20',
            'nama' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'kelas_id' => 'required|exists:kelas,id'
        ];
    }

    public function customValidationMessages()
    {
        return [
            'nim.required' => 'NIM wajib diisi',
            'nim.max' => 'NIM maksimal 20 karakter',
            'nama.required' => 'Nama wajib diisi',
            'nama.max' => 'Nama maksimal 255 karakter',
            'no_hp.max' => 'No HP maksimal 20 karakter',
            'kelas_id.required' => 'Kelas ID wajib diisi',
            'kelas_id.exists' => 'Kelas ID tidak valid atau tidak ditemukan'
        ];
    }

    private function generateEmail($nim, $nama)
    {
        // Generate email from NIM and first name
        $firstName = explode(' ', trim($nama))[0];
        $firstName = strtolower(preg_replace('/[^a-zA-Z]/', '', $firstName));
        
        return strtolower($nim . '_' . $firstName) . '@student.unand.ac.id';
    }
}
