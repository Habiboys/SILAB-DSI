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
        'praktikan_id',
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

    // Relasi ke Tugas Praktikum
    public function tugasPraktikum()
    {
        return $this->belongsTo(TugasPraktikum::class);
    }

    // Relasi ke Praktikan
    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    // Scope untuk pengumpulan berdasarkan status
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope untuk pengumpulan yang sudah dinilai
    public function scopeSudahDinilai($query)
    {
        return $query->whereNotNull('nilai');
    }

    // Scope untuk pengumpulan yang belum dinilai
    public function scopeBelumDinilai($query)
    {
        return $query->whereNull('nilai');
    }

    // Scope untuk pengumpulan terlambat
    public function scopeTerlambat($query)
    {
        return $query->where('status', 'terlambat');
    }

    // Accessor untuk status keterlambatan
    public function getIsTerlambatAttribute()
    {
        if ($this->tugasPraktikum && $this->submitted_at) {
            return $this->submitted_at->gt($this->tugasPraktikum->deadline);
        }
        return false;
    }

    // Mutator untuk status otomatis berdasarkan deadline
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

    // Relasi ke NilaiRubrik
    public function nilaiRubriks()
    {
        return $this->hasMany(NilaiRubrik::class);
    }

    // Method untuk menghitung total nilai berdasarkan rubrik
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
                // Hitung nilai berdasarkan bobot
                $nilaiTerbobot = ($nilaiRubrik->nilai / $komponen->nilai_maksimal) * $komponen->bobot;
                $totalNilai += $nilaiTerbobot;
            }
        }

        return $totalNilai;
    }

    // Relasi ke nilai tambahan
    public function nilaiTambahans()
    {
        return $this->hasManyThrough(
            NilaiTambahan::class,
            Praktikan::class,
            'id', // praktikan id
            'praktikan_id', // nilai tambahan praktikan_id
            'praktikan_id', // pengumpulan praktikan_id
            'id' // praktikan id
        )->where('nilai_tambahan.tugas_praktikum_id', $this->tugas_praktikum_id);
    }

    // Method untuk menghitung total nilai termasuk nilai tambahan (max 100)
    public function getTotalNilaiWithBonusAttribute()
    {
        // Ambil nilai dasar dari rubrik atau nilai manual
        $nilaiDasar = $this->total_nilai_rubrik ?? $this->nilai ?? 0;
        
        // Hitung total nilai tambahan
        $totalBonus = $this->nilaiTambahans()->sum('nilai');
        
        // Jumlahkan dan cap di 100
        $total = $nilaiDasar + $totalBonus;
        
        return min($total, 100);
    }
}
