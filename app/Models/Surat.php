<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Surat extends Model
{
    protected $table = 'surat';
    
    protected $fillable = ['nomor_surat', 'tanggal_surat', 
    'pengirim', 'penerima', 'perihal', 'file', 'isread'];

    public function pengirim()
    {
        return $this->belongsTo(User::class, 'pengirim');
    }

    public function penerima()
    {
        return $this->belongsTo(User::class, 'penerima');
    }
}