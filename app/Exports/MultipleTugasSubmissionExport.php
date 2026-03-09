<?php

namespace App\Exports;

use App\Models\TugasPraktikum;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class MultipleTugasSubmissionExport implements WithMultipleSheets
{
    protected $tugasIds;
    /** @var string 'kelas' = satu sheet per tugas (gabung induk+subkelas) | 'subkelas' = satu sheet per subkelas */
    protected $groupBy;

    public function __construct($tugasIds, $groupBy = 'kelas')
    {
        $this->tugasIds = $tugasIds;
        $this->groupBy = $groupBy === 'subkelas' ? 'subkelas' : 'kelas';
    }

    public function sheets(): array
    {
        $sheets = [];

        foreach ($this->tugasIds as $tugasId) {
            $tugas = TugasPraktikum::with(['kelas.subKelas'])->find($tugasId);
            if (!$tugas) {
                continue;
            }

            if ($this->groupBy === 'subkelas' && $tugas->kelas_id && $tugas->kelas && $tugas->kelas->subKelas->isNotEmpty()) {
                foreach ($tugas->kelas->subKelas as $sub) {
                    $label = $tugas->kelas->nama_kelas . ' - ' . $sub->nama_kelas;
                    $sheets[] = new TugasSubmissionExportForKelas($tugasId, $sub->id, $label);
                }
            } else {
                $sheets[] = new TugasSubmissionExport($tugasId);
            }
        }

        return $sheets;
    }
}
