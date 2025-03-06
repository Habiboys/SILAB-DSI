<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kepengurusan extends Model
{
    protected $table = 'kepengurusan';
    protected $fillable = ['struktur_id', 'tahun_kepengurusan_id', 'koor', 'sk'];

    public function struktur()
    {
        return $this->belongsTo(Struktur::class);
    }

    public function tahunKepengurusan()
    {
        return $this->belongsTo(TahunKepengurusan::class);
    }

    public function koor()
    {
        return $this->belongsTo(User::class, 'koor');
    }

    public function jadwalPiket()
    {
        return $this->hasMany(JadwalPiket::class);
    }

    public function programKerja()
    {
        return $this->hasMany(ProgramKerja::class);
    }

    public function laporanKeuangan()
    {
        return $this->hasMany(LaporanKeuangan::class);
    }

    public function detailKepengurusan()
    {
        return $this->hasMany(DetailKepengurusan::class);
    }
}