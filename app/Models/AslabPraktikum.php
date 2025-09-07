<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AslabPraktikum extends Model
{
    use HasFactory;

    protected $table = 'aslab_praktikum';

    protected $fillable = [
        'praktikum_id',
        'user_id',
        'catatan'
    ];

    public function praktikum()
    {
        return $this->belongsTo(Praktikum::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
