<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TemplateSuratPeminjaman extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'template_surat_peminjaman';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nama_template',
        'file_path',
        'laboratorium_id',
        'deskripsi',
    ];

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratorium_id');
    }
}
