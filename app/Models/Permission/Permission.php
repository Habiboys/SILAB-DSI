<?php

namespace App\Models\Permission;

use Spatie\Permission\Models\Permission as SpatiePermission;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Permission extends SpatiePermission
{
    use HasUuids;
    
    public $incrementing = false;
    protected $keyType = 'string';
} 