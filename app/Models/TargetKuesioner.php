<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetKuesioner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'target_kuesioner';

    protected $fillable = [
        'kuesioner_id',
        'tipe_target', // role, user, lab
        'nilai_target', // Role Name, User ID, Lab ID
    ];

    public function kuesioner()
    {
        return $this->belongsTo(Kuesioner::class, 'kuesioner_id');
    }
}
