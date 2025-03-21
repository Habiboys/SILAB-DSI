<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodePiket extends Model
{
    protected $table = "periode_piket";
    protected $fillable = ['nama', 'tanggal_mulai', 'tanggal_selesai', 'isactive'];

    public function absensi()
    {
        return $this->hasMany(Absensi::class);
    }
}