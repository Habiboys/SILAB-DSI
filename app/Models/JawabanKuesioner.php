<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JawabanKuesioner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'jawaban_kuesioner';

    protected $fillable = [
        'respon_id',
        'pertanyaan_id',
        'jawaban', // text or JSON
    ];

    public function respon()
    {
        return $this->belongsTo(ResponKuesioner::class, 'respon_id');
    }

    public function pertanyaan()
    {
        return $this->belongsTo(PertanyaanKuesioner::class, 'pertanyaan_id');
    }
}
