<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Proker extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'proker';

    protected $fillable = [
        'struktur_id',
        'kepengurusan_lab_id',
        'nama_proker',
        'deskripsi',
        'tujuan',
        'sasaran',
        'output_kegiatan',
        'status',
        'status_pengajuan',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
        'kendala',
        'solusi',
        'saran',
        'file_proker',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function struktur()
    {
        return $this->belongsTo(Struktur::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function parameter()
    {
        return $this->hasMany(ProkerParameter::class, 'proker_id')->orderBy('urutan');
    }

    public function dokumentasi()
    {
        return $this->hasMany(ProkerDokumentasi::class, 'proker_id')->latest();
    }

    public function pjs()
    {
        return $this->hasMany(ProkerPj::class, 'proker_id')->with('user');
    }

    public function kegiatan()
    {
        return $this->hasMany(Kegiatan::class, 'proker_id');
    }

    /** Total bobot of all parameters (should equal 100 when complete). */
    public function getTotalBobotAttribute(): int
    {
        return (int) $this->parameter->sum('bobot');
    }

    /**
     * Weighted achievement percentage for LPJ.
     * Calculated as sum of (bobot * capaian / 100) for each parameter with a filled capaian.
     */
    public function getPersentaseCapaianAttribute(): ?float
    {
        $params = $this->parameter;
        if ($params->isEmpty()) {
            return null;
        }
        $filled = $params->whereNotNull('capaian');
        if ($filled->isEmpty()) {
            return null;
        }
        $total = 0;
        foreach ($filled as $p) {
            $total += ($p->bobot * $p->capaian) / 100;
        }
        return round($total, 1);
    }

    /** Display name: prefer nama_proker, fall back to deskripsi. */
    public function getNamaDisplayAttribute(): string
    {
        return $this->nama_proker ?: ($this->deskripsi ?: '-');
    }

    // ── Status execution helpers ──────────────────────────────────────────────

    public function getStatusBadgeAttribute(): string
    {
        return [
            'belum_mulai'     => 'bg-gray-100 text-gray-800',
            'sedang_berjalan' => 'bg-blue-100 text-blue-800',
            'selesai'         => 'bg-green-100 text-green-800',
            'ditunda'         => 'bg-red-100 text-red-800',
        ][$this->status] ?? 'bg-gray-100 text-gray-800';
    }

    public function getStatusTextAttribute(): string
    {
        return [
            'belum_mulai'     => 'Belum Mulai',
            'sedang_berjalan' => 'Sedang Berjalan',
            'selesai'         => 'Selesai',
            'ditunda'         => 'Ditunda',
        ][$this->status] ?? 'Tidak Diketahui';
    }

    // ── Status pengajuan helpers ──────────────────────────────────────────────

    public function getStatusPengajuanBadgeAttribute(): string
    {
        return [
            'draft'     => 'bg-gray-100 text-gray-700',
            'diajukan'  => 'bg-yellow-100 text-yellow-800',
            'disetujui' => 'bg-green-100 text-green-800',
            'ditolak'   => 'bg-red-100 text-red-800',
        ][$this->status_pengajuan] ?? 'bg-gray-100 text-gray-700';
    }

    public function getStatusPengajuanTextAttribute(): string
    {
        return [
            'draft'     => 'Draft',
            'diajukan'  => 'Diajukan',
            'disetujui' => 'Disetujui',
            'ditolak'   => 'Ditolak',
        ][$this->status_pengajuan] ?? 'Draft';
    }
}
