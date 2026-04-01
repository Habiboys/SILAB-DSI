<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuratMasuk extends Model
{
    use HasUuids;

    protected $table = 'surat_masuk';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kepengurusan_lab_id',
        'nomor_agenda',
        'nomor_surat_asal',
        'asal_surat',
        'perihal',
        'tanggal_surat',
        'tanggal_terima',
        'isi_ringkas',
        'file_surat',
        'diterima_oleh',
    ];

    protected $casts = [
        'tanggal_surat'  => 'date',
        'tanggal_terima' => 'date',
        'nomor_agenda'   => 'integer',
    ];

    public function kepengurusanLab(): BelongsTo
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function diterimaOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diterima_oleh');
    }

    public function disposisi(): HasMany
    {
        return $this->hasMany(DisposisiSurat::class, 'surat_masuk_id');
    }
}
