<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Surat extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
    
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