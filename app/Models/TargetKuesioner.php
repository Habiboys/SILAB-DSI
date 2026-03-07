<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Permission\Role;

class TargetKuesioner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'target_kuesioner';

    protected $fillable = [
        'kuesioner_id',
        'role_id',
    ];

    public function kuesioner()
    {
        return $this->belongsTo(Kuesioner::class, 'kuesioner_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
