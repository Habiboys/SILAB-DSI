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

    protected $fillable = [
        'nomor_surat', 'tanggal_surat',
        'pengirim', 'penerima', 'perihal', 'file', 'isread',
        'tipe_surat', 'lab_id', 'penerima_nama_luar',
    ];

    protected $casts = [
        'isread' => 'boolean',
    ];

    // ─── Relasi ──────────────────────────────────────────────────────────────

    /** User pengirim */
    public function pengirim()
    {
        return $this->belongsTo(User::class, 'pengirim');
    }

    /** User penerima (nullable — null jika penerima_nama_luar diisi) */
    public function penerima()
    {
        return $this->belongsTo(User::class, 'penerima');
    }

    /** Lab pengirim (untuk surat resmi) */
    public function lab()
    {
        return $this->belongsTo(Laboratorium::class, 'lab_id');
    }

    // ─── Scope ───────────────────────────────────────────────────────────────

    public function scopePribadi($query)
    {
        return $query->where('tipe_surat', 'pribadi');
    }

    public function scopeResmi($query)
    {
        return $query->where('tipe_surat', 'resmi');
    }
}
