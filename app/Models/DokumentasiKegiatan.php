<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokumentasiKegiatan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'dokumentasi_kegiatan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kegiatan_id',
        'judul',
        'file_path',
        'uploaded_by',
    ];

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class, 'kegiatan_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
