<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProkerParameter extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'proker_parameter';

    protected $fillable = [
        'proker_id',
        'nama_parameter',
        'bobot',
        'capaian',
        'urutan',
    ];

    protected $casts = [
        'bobot'   => 'integer',
        'capaian' => 'integer',
        'urutan'  => 'integer',
    ];

    public function proker()
    {
        return $this->belongsTo(Proker::class, 'proker_id');
    }
}
