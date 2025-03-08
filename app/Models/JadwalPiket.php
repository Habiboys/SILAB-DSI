<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalPiket extends Model
{
    use HasFactory;

    protected $table = 'jadwal_piket';

    protected $fillable = [
        'hari',
        'kepengurusan_lab_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class, 'jadwal_piket');
    }
}