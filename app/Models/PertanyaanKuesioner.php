<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PertanyaanKuesioner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pertanyaan_kuesioner';

    protected $fillable = [
        'kuesioner_id',
        'pertanyaan',
        'tipe_pertanyaan', // text, textarea, radio, checkbox, scale
        'wajib_diisi',
        'urutan',
    ];

    protected $casts = [
        'wajib_diisi' => 'boolean',
        'urutan' => 'integer',
    ];

    public function kuesioner()
    {
        return $this->belongsTo(Kuesioner::class, 'kuesioner_id');
    }

    public function opsi()
    {
        return $this->hasMany(OpsiPertanyaan::class, 'pertanyaan_id')->orderBy('urutan');
    }

    public function jawaban()
    {
        return $this->hasMany(JawabanKuesioner::class, 'pertanyaan_id');
    }
}
