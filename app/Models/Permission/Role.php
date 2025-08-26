<?php

namespace App\Models\Permission;

use Spatie\Permission\Models\Role as SpatieRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Role extends SpatieRole
{
    use HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
} 