<?php

namespace App\Exports;

use App\Models\TugasPraktikum;
use App\Models\PengumpulanTugas;
use App\Models\NilaiTambahan;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class MultipleTugasSubmissionExport implements WithMultipleSheets
{
    protected $tugasIds;

    public function __construct($tugasIds)
    {
        $this->tugasIds = $tugasIds;
    }

    public function sheets(): array
    {
        $sheets = [];
        
        foreach ($this->tugasIds as $tugasId) {
            $sheets[] = new TugasSubmissionExport($tugasId);
        }
        
        return $sheets;
    }
}
