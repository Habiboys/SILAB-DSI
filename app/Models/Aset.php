<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Aset extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

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
    
    // Add an accessor to automatically calculate total jumlah
    public function getJumlahAttribute()
    {
        return $this->detailAset()->count();
    }
}