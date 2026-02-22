<?php

namespace App\Policies;

use App\Models\PermohonanAset;
use App\Models\User;

class PermohonanAsetPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PermohonanAset $permohonanAset): bool
    {
        // Get lab from kepengurusan_lab
        $labId = $permohonanAset->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('inventaris.view');
        }
        
        return $user->hasPermissionInLab('inventaris.view', $labId);
    }

    /**
     * Determine whether the user can create models (request permohonan).
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.manage-permohonan');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PermohonanAset $permohonanAset): bool
    {
        $labId = $permohonanAset->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('inventaris.manage-permohonan');
        }
        
        return $user->hasPermissionInLab('inventaris.manage-permohonan', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PermohonanAset $permohonanAset): bool
    {
        // Only creator or superadmin can delete
        if ($user->id === $permohonanAset->user_id || $user->hasRole('superadmin')) {
            return true;
        }
        
        return false;
    }

    /**
     * Determine whether the user can approve/reject permohonan.
     * This is ONLY for Kalab/Superadmin.
     */
    public function approve(User $user, PermohonanAset $permohonanAset): bool
    {
        $labId = $permohonanAset->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPositionPermission('inventaris.approve-permohonan');
        }
        
        // Must have position permission (Kalab) AND be in same lab
        return $user->hasPositionPermission('inventaris.approve-permohonan')
            && $user->hasPermissionInLab('inventaris.approve-permohonan', $labId);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasRole('superadmin');
    }
}
