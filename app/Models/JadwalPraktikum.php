<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class JadwalPraktikum extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $table = 'jadwal_praktikum';
    protected $fillable = ['kelas_id', 'kelas', 
    'hari', 'jam_mulai', 'jam_selesai', 'ruangan'];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    // Helper to get Praktikum via Kelas
    public function praktikum()
    {
        return $this->hasOneThrough(
            Praktikum::class,
            Kelas::class,
            'id', // Foreign key on kelas table (id)
            'id', // Foreign key on praktikum table (id)
            'kelas_id', // Local key on jadwal table
            'praktikum_id' // Local key on kelas table
        );
    }
}