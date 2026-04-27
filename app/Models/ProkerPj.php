<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProkerPj extends Model
{
    public $incrementing = false;
    public $timestamps = true;
    protected $table = 'proker_pj';

    protected $fillable = [
        'proker_id',
        'user_id',
    ];

    public function proker()
    {
        return $this->belongsTo(Proker::class, 'proker_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
