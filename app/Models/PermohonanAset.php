<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PermohonanAset extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'permohonan_aset';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_pemohon_id',
        'laboratorium_id',
        'nomor_permohonan',
        'tanggal_permohonan',
        'alasan_umum_pengadaan',
        'status_permohonan',
        'catatan_approval',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'tanggal_permohonan' => 'date',
        'approved_at' => 'datetime',
    ];

    public function userPemohon()
    {
        return $this->belongsTo(User::class, 'user_pemohon_id');
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratorium_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function wishlistAset()
    {
        return $this->hasMany(WishlistAset::class, 'permohonan_aset_id');
    }
}
