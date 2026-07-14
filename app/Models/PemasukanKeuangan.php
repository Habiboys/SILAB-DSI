<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PemasukanKeuangan extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'pemasukan_keuangan';

    protected $fillable = [
        'tanggal',
        'nominal',
        'deskripsi',
        'bukti',
        'user_id',
        'kepengurusan_lab_id',
        'nominal_kas_id',
        'is_uang_kas',
        'jenis_pembayaran_kas',
        'catatan_pembayaran',
        'denda_piket_id',
        'tagihan_kas_id',
    ];

    protected $casts = [
        'tanggal'      => 'date',
        'is_uang_kas'  => 'boolean',
        'nominal'      => 'integer',
    ];

    protected $appends = ['jenis', 'sumber'];

    public function getJenisAttribute(): string
    {
        return 'masuk';
    }

    public function getSumberAttribute(): string
    {
        if ($this->denda_piket_id) {
            return 'Denda Piket';
        }
        if ($this->tagihan_kas_id) {
            return 'Tagihan Kas';
        }
        return '-';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function kepengurusanLab()
    {
        return $this->belongsTo(KepengurusanLab::class, 'kepengurusan_lab_id');
    }

    public function nominalKas()
    {
        return $this->belongsTo(NominalKas::class, 'nominal_kas_id');
    }

    public function dendaPiket()
    {
        return $this->belongsTo(DendaPiket::class, 'denda_piket_id');
    }

    public function tagihanKas()
    {
        return $this->belongsTo(TagihanKas::class, 'tagihan_kas_id');
    }
}
