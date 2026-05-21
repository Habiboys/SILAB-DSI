<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class JadwalPiket extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'jadwal_piket';

    protected $fillable = [
        'hari',
        'kepengurusan_lab_id',
        'kepengurusan_user_id',
    ];

    protected $appends = ['user'];

    public function kepengurusanUser()
    {
        return $this->belongsTo(KepengurusanUser::class, 'kepengurusan_user_id');
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    public function absensi()
    {
        return $this->hasMany(Absensi::class, 'jadwal_piket_id');
    }

    public function getUserAttribute()
    {
        return $this->kepengurusanUser?->user;
    }
}
