<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpsiPertanyaan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'opsi_pertanyaan';

    protected $fillable = [
        'pertanyaan_id',
        'teks',
        'urutan',
    ];

    protected $casts = [
        'urutan' => 'integer',
    ];

    public function pertanyaan()
    {
        return $this->belongsTo(PertanyaanKuesioner::class, 'pertanyaan_id');
    }
}
