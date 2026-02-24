<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProkerDokumentasi extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'proker_dokumentasi';

    protected $fillable = [
        'proker_id',
        'judul',
        'file_path',
        'uploaded_by',
    ];

    public function proker()
    {
        return $this->belongsTo(Proker::class, 'proker_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
