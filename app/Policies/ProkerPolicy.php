<?php

namespace App\Policies;

use App\Models\Proker;
use App\Models\User;

class ProkerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('kegiatan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Proker $proker): bool
    {
        $labId = $proker->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('kegiatan.view');
        }
        
        return $user->hasPermissionInLab('kegiatan.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('kegiatan.manage-proker');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Proker $proker): bool
    {
        $labId = $proker->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('kegiatan.manage-proker');
        }
        
        return $user->hasPermissionInLab('kegiatan.manage-proker', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Proker $proker): bool
    {
        $labId = $proker->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('kegiatan.manage-proker');
        }
        
        return $user->hasPermissionInLab('kegiatan.manage-proker', $labId);
    }

    /**
     * Determine whether the user can update status.
     * Anyone with kegiatan.manage-proker can update status
     */
    public function updateStatus(User $user, Proker $proker): bool
    {
        return $this->update($user, $proker);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Proker $proker): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Proker $proker): bool
    {
        return $user->hasRole('superadmin');
    }
}
