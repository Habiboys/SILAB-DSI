<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FaceChallenge extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'purpose', 'actions', 'expires_at', 'consumed_at'];

    protected $casts = [
        'actions' => 'array',
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];
}
