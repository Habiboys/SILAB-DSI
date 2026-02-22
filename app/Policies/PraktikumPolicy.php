<?php

namespace App\Policies;

use App\Models\Praktikum;
use App\Models\User;

class PraktikumPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('praktikum.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Praktikum $praktikum): bool
    {
        \Illuminate\Support\Facades\Log::info("PraktikumPolicy@view Check for User: {$user->id} ({$user->name}) on Praktikum: {$praktikum->id}");
        
        // User can view if they have general access to praktikum in this lab
        if ($user->canAccessPraktikum($praktikum->id)) {
            \Illuminate\Support\Facades\Log::info("PraktikumPolicy@view: ALLOWED via canAccessPraktikum");
            return true;
        }
        
        // Or if they have permission and are in the same lab
        $labId = $praktikum->kepengurusanLab->laboratorium_id;
        $hasPermInLab = $user->hasPermissionInLab('praktikum.view', $labId);
        
        \Illuminate\Support\Facades\Log::info("PraktikumPolicy@view: hasPermissionInLab('praktikum.view', $labId) = " . ($hasPermInLab ? 'TRUE' : 'FALSE'));
        
        return $hasPermInLab;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('praktikum.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Praktikum $praktikum): bool
    {
        $labId = $praktikum->kepengurusanLab->laboratorium_id;
        return $user->hasPermissionInLab('praktikum.update', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Praktikum $praktikum): bool
    {
        $labId = $praktikum->kepengurusanLab->laboratorium_id;
        return $user->hasPermissionInLab('praktikum.delete', $labId);
    }

    /**
     * Determine whether the user can assign aslab to praktikum.
     */
    public function assignAslab(User $user, Praktikum $praktikum): bool
    {
        $labId = $praktikum->kepengurusanLab->laboratorium_id;
        
        // Must have permission and be in same lab, and have position-based permission (kalab)
        return $user->hasPositionPermission('praktikum.assign-aslab') 
            && $user->hasPermissionInLab('praktikum.assign-aslab', $labId);
    }

    /**
     * Determine whether the user can restore (not used currently).
     */
    public function restore(User $user, Praktikum $praktikum): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete (not used currently).
     */
    public function forceDelete(User $user, Praktikum $praktikum): bool
    {
        return $user->hasRole('superadmin');
    }
}
