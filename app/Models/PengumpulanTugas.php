<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengumpulanTugas extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pengumpulan_tugas';

    protected $fillable = [
        'tugas_praktikum_id',
        'praktikan_praktikum_id',
        'file_pengumpulan',
        'catatan',
        'feedback',
        'nilai',
        'status',
        'submitted_at',
        'dinilai_at'
    ];

    protected $casts = [
        'nilai' => 'decimal:2',
        'status' => 'string',
        'submitted_at' => 'datetime',
        'dinilai_at' => 'datetime'
    ];

    public function tugasPraktikum()
    {
        return $this->belongsTo(TugasPraktikum::class);
    }

    public function praktikanPraktikum()
    {
        return $this->belongsTo(PraktikanPraktikum::class, 'praktikan_praktikum_id');
    }

    public function praktikan()
    {
        return $this->hasOneThrough(
            Praktikan::class,
            PraktikanPraktikum::class,
            'id',
            'id',
            'praktikan_praktikum_id',
            'praktikan_id'
        );
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSudahDinilai($query)
    {
        return $query->whereNotNull('nilai');
    }

    public function scopeBelumDinilai($query)
    {
        return $query->whereNull('nilai');
    }

    public function scopeTerlambat($query)
    {
        return $query->where('status', 'terlambat');
    }

    public function getIsTerlambatAttribute()
    {
        if ($this->tugasPraktikum && $this->submitted_at) {
            return $this->submitted_at->gt($this->tugasPraktikum->deadline);
        }
        return false;
    }

    public function setStatusAttribute($value)
    {
        if ($this->tugasPraktikum && $this->submitted_at) {
            if ($this->submitted_at->gt($this->tugasPraktikum->deadline)) {
                $this->attributes['status'] = 'terlambat';
            } else {
                $this->attributes['status'] = $value;
            }
        } else {
            $this->attributes['status'] = $value;
        }
    }

    public function nilaiRubriks()
    {
        return $this->hasMany(NilaiRubrik::class);
    }

    public function getTotalNilaiRubrikAttribute()
    {
        if (!$this->tugasPraktikum->komponenRubriks || $this->tugasPraktikum->komponenRubriks->isEmpty()) {
            return null;
        }

        $komponenRubriks = $this->tugasPraktikum->komponenRubriks;
        $totalNilai = 0;

        foreach ($komponenRubriks as $komponen) {
            $nilaiRubrik = $this->nilaiRubriks()
                ->where('komponen_rubrik_id', $komponen->id)
                ->first();

            if ($nilaiRubrik) {

                $nilaiTerbobot = ($nilaiRubrik->nilai / $komponen->nilai_maksimal) * $komponen->bobot;
                $totalNilai += $nilaiTerbobot;
            }
        }

        return $totalNilai;
    }

    public function nilaiTambahans()
    {
        return $this->hasMany(
            NilaiTambahan::class,
            'pengumpulan_tugas_id'
        );
    }

    public function getTotalNilaiWithBonusAttribute()
    {

        $nilaiDasar = $this->total_nilai_rubrik ?? $this->nilai ?? 0;

        $totalBonus = $this->nilaiTambahans()->sum('nilai');

        $total = $nilaiDasar + $totalBonus;

        return min($total, 100);
    }

    public function getSubmissionDataAttribute()
    {
        if (!$this->file_pengumpulan) {
            return [];
        }

        $data = json_decode($this->file_pengumpulan, true);
        return is_array($data) ? $data : [];
    }

    public function getFilesAttribute()
    {
        return collect($this->submission_data)
            ->filter(function ($item) {
                return isset($item['type']) && $item['type'] === 'file';
            })
            ->values()
            ->toArray();
    }

    public function getLinksAttribute()
    {
        return collect($this->submission_data)
            ->filter(function ($item) {
                return isset($item['type']) && $item['type'] === 'link';
            })
            ->values()
            ->toArray();
    }

    public function hasFiles()
    {
        return count($this->files) > 0;
    }

    public function hasLinks()
    {
        return count($this->links) > 0;
    }
}
