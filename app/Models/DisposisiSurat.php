<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisposisiSurat extends Model
{
    use HasUuids;

    protected $table = 'disposisi_surat';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'surat_masuk_id',
        'dari_user_id',
        'kepada_user_id',
        'catatan',
        'status',
        'dibaca_at',
        'diselesaikan_at',
    ];

    protected $casts = [
        'dibaca_at'        => 'datetime',
        'diselesaikan_at'  => 'datetime',
    ];

    public function suratMasuk(): BelongsTo
    {
        return $this->belongsTo(SuratMasuk::class, 'surat_masuk_id');
    }

    public function dariUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dari_user_id');
    }

    public function kepadaUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kepada_user_id');
    }
}
