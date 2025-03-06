<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailKepengurusan extends Model
{
    protected $table = 'detail_kepengurusan';
    protected $fillable = ['kepengurusan_id', 'anggota'];

    public function kepengurusan()
    {
        return $this->belongsTo(Kepengurusan::class);
    }

    public function anggota()
    {
        return $this->belongsTo(User::class, 'anggota');
    }
}
