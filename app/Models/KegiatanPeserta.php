<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class KegiatanPeserta extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'kegiatan_peserta';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kegiatan_id',
        'user_id',
        'peran',
        'is_lulus',
        'no_sertifikat',
        'file_sertifikat',
    ];

    protected $casts = [
        'is_lulus' => 'boolean',
    ];

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class, 'kegiatan_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
