<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Proker extends Model
{
    use HasFactory, HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'proker';

    protected $fillable = [
        'struktur_id',
        'kepengurusan_lab_id',
        'deskripsi',
        'status',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
        'file_proker', // Tambahkan field file
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function struktur()
    {
        return $this->belongsTo(Struktur::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class);
    }

    // Status badge helper
    public function getStatusBadgeAttribute()
    {
        $badges = [
            'belum_mulai' => 'bg-gray-100 text-gray-800',
            'sedang_berjalan' => 'bg-blue-100 text-blue-800',
            'selesai' => 'bg-green-100 text-green-800',
            'ditunda' => 'bg-red-100 text-red-800',
        ];

        return $badges[$this->status] ?? 'bg-gray-100 text-gray-800';
    }

    // Status text helper
    public function getStatusTextAttribute()
    {
        $texts = [
            'belum_mulai' => 'Belum Mulai',
            'sedang_berjalan' => 'Sedang Berjalan',
            'selesai' => 'Selesai',
            'ditunda' => 'Ditunda',
        ];

        return $texts[$this->status] ?? 'Tidak Diketahui';
    }
}
