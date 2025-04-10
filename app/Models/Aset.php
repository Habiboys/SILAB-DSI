<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class Aset extends Model
{
    use HasFactory;

    protected $table = 'aset';
    protected $fillable = ['nama', 'deskripsi', 'laboratorium_id'];

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class);
    }

    public function detailAset()
    {
        return $this->hasMany(DetailAset::class);
    }
    
    // Add an accessor to automatically calculate count
    public function getJumlahAttribute()
    {
        return $this->detailAset()->count();
    }
}