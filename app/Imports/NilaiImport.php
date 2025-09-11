<?php

namespace App\Imports;

use App\Models\TugasPraktikum;
use App\Models\PengumpulanTugas;
use App\Models\NilaiRubrik;
use App\Models\Praktikan;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NilaiImport implements ToModel, WithHeadingRow, SkipsOnError, WithValidation
{
    use SkipsErrors;
    
    protected $tugasId;
    protected $tugas;
    protected $komponenCache = [];
    protected $praktikanCache = [];

    public function __construct($tugasId)
    {
        $this->tugasId = $tugasId;
        $this->tugas = TugasPraktikum::with([
            'komponenRubriks' => function($query) {
                $query->orderBy('urutan');
            }
        ])->findOrFail($tugasId);
        
        // Build komponen cache
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $this->komponenCache[$komponen->nama_komponen] = $komponen;
        }
        
        Log::info('NilaiImport constructed', [
            'tugas_id' => $tugasId,
            'komponen_count' => count($this->komponenCache)
        ]);
    }

    public function model(array $row)
    {
        Log::info('Processing nilai row', ['row' => $row]);

        // Skip jika baris kosong atau tidak ada data penting
        if (empty($row['nim']) || empty($row['nama']) || 
            trim($row['nim']) === '' || trim($row['nama']) === '') {
            Log::info('Skipping empty or incomplete row', ['row' => $row]);
            return null;
        }

        // Convert NIM to string properly (Excel sometimes converts to number)
        $nim = $row['nim'];
        if (is_numeric($nim)) {
            $nim = (string) $nim;
        } else {
            $nim = trim((string) $nim);
        }
        
        $nama = trim((string) $row['nama']);

        // Additional validation for empty values after trimming
        if ($nim === '' || $nama === '') {
            Log::info('Skipping row with empty values after trimming', ['nim' => $nim, 'nama' => $nama]);
            return null;
        }

        // Find praktikan by NIM
        $praktikan = Praktikan::where('nim', $nim)->first();
        if (!$praktikan) {
            Log::warning('Praktikan not found', ['nim' => $nim]);
            return null;
        }

        $praktikanId = $praktikan->id;

        // Process nilai for each komponen
        $this->processNilaiForPraktikan($praktikanId, $row);

        return null; // We don't return a model, we process data directly
    }

    private function processNilaiForPraktikan($praktikanId, $row)
    {
        // Get or create pengumpulan tugas
        $pengumpulanTugas = PengumpulanTugas::firstOrCreate(
            [
                'tugas_praktikum_id' => $this->tugasId,
                'praktikan_id' => $praktikanId
            ],
            [
                'status' => 'dikumpulkan',
                'submitted_at' => now(),
                'nilai' => 0,
                'total_nilai_rubrik' => 0,
                'feedback' => null
            ]
        );

        $totalNilaiRubrik = 0;
        $hasNilai = false;

        // Process each komponen rubrik
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $nilaiValue = $this->getNilaiFromRow($row, $komponen->nama_komponen);
            
            Log::info('Processing komponen', [
                'praktikan_id' => $praktikanId,
                'komponen' => $komponen->nama_komponen,
                'nilai_value' => $nilaiValue,
                'row_keys' => array_keys($row)
            ]);
            
            if ($nilaiValue !== null && $nilaiValue !== '') {
                $nilai = floatval($nilaiValue);
                
                Log::info('Nilai found', [
                    'praktikan_id' => $praktikanId,
                    'komponen' => $komponen->nama_komponen,
                    'nilai' => $nilai,
                    'max' => $komponen->nilai_maksimal
                ]);
                
                // Validate nilai range
                if ($nilai >= 0 && $nilai <= $komponen->nilai_maksimal) {
                    // Update or create nilai rubrik
                    $nilaiRubrik = NilaiRubrik::updateOrCreate(
                        [
                            'pengumpulan_tugas_id' => $pengumpulanTugas->id,
                            'komponen_rubrik_id' => $komponen->id
                        ],
                        [
                            'praktikan_id' => $praktikanId,
                            'dinilai_oleh' => auth()->id(), // ID user yang sedang login
                            'nilai' => $nilai,
                            'catatan' => ''
                        ]
                    );
                    
                    $totalNilaiRubrik += $nilai;
                    $hasNilai = true;
                    
                    Log::info('Updated nilai rubrik', [
                        'praktikan_id' => $praktikanId,
                        'komponen' => $komponen->nama_komponen,
                        'nilai' => $nilai,
                        'nilai_rubrik_id' => $nilaiRubrik->id
                    ]);
                } else {
                    Log::warning('Nilai out of range', [
                        'praktikan_id' => $praktikanId,
                        'komponen' => $komponen->nama_komponen,
                        'nilai' => $nilai,
                        'max' => $komponen->nilai_maksimal
                    ]);
                }
            } else {
                Log::info('No nilai found for komponen', [
                    'praktikan_id' => $praktikanId,
                    'komponen' => $komponen->nama_komponen
                ]);
            }
        }

        // Update pengumpulan tugas with total nilai
        if ($hasNilai) {
            $pengumpulanTugas->update([
                'total_nilai_rubrik' => $totalNilaiRubrik,
                'nilai' => $totalNilaiRubrik
            ]);
            
            Log::info('Updated pengumpulan tugas', [
                'praktikan_id' => $praktikanId,
                'total_nilai_rubrik' => $totalNilaiRubrik
            ]);
        }
    }

    private function getNilaiFromRow($row, $komponenNama)
    {
        Log::info('Getting nilai from row', [
            'komponen_nama' => $komponenNama,
            'row_keys' => array_keys($row),
            'komponen_cache' => array_keys($this->komponenCache)
        ]);

        // Try different possible column names
        $possibleKeys = [
            $komponenNama, // Original name
            strtolower($komponenNama),
            strtoupper($komponenNama),
            str_replace(' ', '_', $komponenNama),
            str_replace(' ', '_', strtolower($komponenNama)),
            str_replace(' ', '_', strtoupper($komponenNama)),
            // Try with format from template: "nama_komponen (bobot% | Max: nilai_maksimal)"
            $komponenNama . ' (' . $this->komponenCache[$komponenNama]->bobot . '% | Max: ' . $this->komponenCache[$komponenNama]->nilai_maksimal . ')',
            // Try with different variations
            $komponenNama . ' (' . $this->komponenCache[$komponenNama]->bobot . '%',
            $komponenNama . ' (',
            // Try to find by partial match
        ];

        // First try exact matches
        foreach ($possibleKeys as $key) {
            if (isset($row[$key]) && $row[$key] !== null && $row[$key] !== '') {
                Log::info('Found exact match', ['key' => $key, 'value' => $row[$key]]);
                return $row[$key];
            }
        }

        // If no exact match, try to find by partial match (contains komponen name)
        foreach ($row as $columnName => $value) {
            if (strpos(strtolower($columnName), strtolower($komponenNama)) !== false && $value !== null && $value !== '') {
                Log::info('Found partial match', ['column' => $columnName, 'value' => $value, 'komponen' => $komponenNama]);
                return $value;
            }
        }

        Log::info('No match found', ['komponen' => $komponenNama]);
        return null;
    }

    private function isValidUuid($uuid)
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid);
    }

    public function rules(): array
    {
        $rules = [
            'nim' => 'nullable',
            'nama' => 'nullable|string'
        ];

        // Add rules for each komponen
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $rules[$komponen->nama_komponen] = 'nullable|numeric|min:0|max:' . $komponen->nilai_maksimal;
        }

        return $rules;
    }

    public function customValidationMessages()
    {
        $messages = [
            'nama.string' => 'Nama harus berupa string'
        ];

        // Add messages for each komponen
        foreach ($this->tugas->komponenRubriks as $komponen) {
            $messages[$komponen->nama_komponen . '.numeric'] = 'Nilai ' . $komponen->nama_komponen . ' harus berupa angka';
            $messages[$komponen->nama_komponen . '.min'] = 'Nilai ' . $komponen->nama_komponen . ' minimal 0';
            $messages[$komponen->nama_komponen . '.max'] = 'Nilai ' . $komponen->nama_komponen . ' maksimal ' . $komponen->nilai_maksimal;
        }

        return $messages;
    }

    public function onError(\Throwable $e)
    {
        Log::warning('Nilai import row validation failed', ['error' => $e->getMessage()]);
    }
}
