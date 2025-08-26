<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class KepengurusanLab extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'kepengurusan_lab';

    protected $fillable = [
        'tahun_kepengurusan_id',
        'laboratorium_id',
        'sk'
    ];

    public function tahunKepengurusan()
    {
        return $this->belongsTo(TahunKepengurusan::class, 'tahun_kepengurusan_id');
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class);
    }

    public function periodePiket()
    {
        return $this->hasMany(PeriodePiket::class, 'kepengurusan_lab_id');
    }

    public function struktur()
    {
        return $this->hasMany(Struktur::class);
    }

    public function laporanKeuangan()
    {
        return $this->hasMany(LaporanKeuangan::class);
    }

    public function jadwalPiket()
    {
        return $this->hasMany(JadwalPiket::class);
    }

    public function riwayatKeuangan()
    {
        return $this->hasMany(RiwayatKeuangan::class);
    }
    
    public function praktikum()
    {
        return $this->hasMany(Praktikum::class);
    }

    public function proker()
    {
        return $this->hasMany(Proker::class);
    }

    public function anggota()
    {
        return $this->hasMany(KepengurusanUser::class);
    }

    public function anggotaAktif()
    {
        return $this->hasMany(KepengurusanUser::class)->active();
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'kepengurusan_user')
                    ->withPivot(['struktur_id', 'is_active', 'tanggal_bergabung', 'tanggal_keluar', 'catatan'])
                    ->withTimestamps();
    }
}