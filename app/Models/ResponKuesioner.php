<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResponKuesioner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'respon_kuesioner';

    protected $fillable = [
        'kuesioner_id',
        'user_id',
        'tanggal_submit',
    ];

    protected $casts = [
        'tanggal_submit' => 'datetime',
    ];

    public function kuesioner()
    {
        return $this->belongsTo(Kuesioner::class, 'kuesioner_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function jawaban()
    {
        return $this->hasMany(JawabanKuesioner::class, 'respon_id');
    }
}
