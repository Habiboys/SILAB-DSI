<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Struktur extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'struktur';

    protected $fillable = [
        'struktur',
        'jabatan_tunggal',
        'default_role_id',
        'parent_id',
    ];

    public function defaultRole()
    {
        return $this->belongsTo(\App\Models\Permission\Role::class, 'default_role_id');
    }

    /**
     * Parent struktur (koordinator/head of division).
     * If null, this record IS the parent.
     */
    public function parent()
    {
        return $this->belongsTo(Struktur::class, 'parent_id');
    }

    /**
     * Child struktuts (anggota/members) that belong to this parent.
     */
    public function children()
    {
        return $this->hasMany(Struktur::class, 'parent_id');
    }

    /**
     * Returns true if this struktur has no parent (i.e. it IS a coordinator/head).
     * Only parent struktuts can own a Proker.
     */
    public function isParent(): bool
    {
        return is_null($this->parent_id);
    }

    public function proker()
    {
        return $this->hasMany(Proker::class);
    }
}
