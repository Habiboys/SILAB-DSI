<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalPraktikum extends Model
{
    protected $table = 'jadwal_praktikum';
    protected $fillable = [ 'praktikum_id','kelas', 
    'hari', 'jam_mulai', 'jam_selesai', 'ruangan'];

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class, 'praktikum_id');
    }
}