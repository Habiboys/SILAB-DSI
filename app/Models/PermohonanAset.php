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
        // Kalab review fields
        'reviewed_by',
        'reviewed_at',
        'catatan_review',
        // Kadep approval fields (reuses approved_by / approved_at)
        'approved_by',
        'approved_at',
        'catatan_approval',
    ];

    protected $casts = [
        'tanggal_permohonan' => 'date',
        'reviewed_at'        => 'datetime',
        'approved_at'        => 'datetime',
    ];

    public function userPemohon()
    {
        return $this->belongsTo(User::class, 'user_pemohon_id');
    }

    public function laboratorium()
    {
        return $this->belongsTo(Laboratorium::class, 'laboratorium_id');
    }

    /** Kalab yang mereview */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Kadep yang meng-ACC final */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function wishlistAset()
    {
        return $this->hasMany(WishlistAset::class, 'permohonan_aset_id');
    }
}
