<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProkerPj extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
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
