<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuratKeluar extends Model
{
    use HasUuids;

    protected $table = 'surat_keluar';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kepengurusan_lab_id',
        'nomor_urut',
        'nomor_surat',
        'perihal',
        'tujuan',
        'tanggal_surat',
        'isi_ringkas',
        'file_surat',
        'kode_klasifikasi',
        'dibuat_oleh',
    ];

    protected $casts = [
        'tanggal_surat' => 'date',
        'nomor_urut'    => 'integer',
    ];

    public function kepengurusanLab(): BelongsTo
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
