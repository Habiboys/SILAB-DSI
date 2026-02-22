<?php

namespace App\Policies;

use App\Models\Absensi;
use App\Models\User;

class AbsensiPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('absensi.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Absensi $absensi): bool
    {
        // Users can always view their own absensi
        if ($absensi->user_id === $user->id) {
            return true;
        }
        
        $labId = $absensi->jadwalPiket?->periodePiket?->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('absensi.view');
        }
        
        return $user->hasPermissionInLab('absensi.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('absensi.create-absensi');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Absensi $absensi): bool
    {
        // Users can update their own absensi (e.g., check-out)
        if ($absensi->user_id === $user->id) {
            return true;
        }
        
        $labId = $absensi->jadwalPiket?->periodePiket?->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('absensi.update-absensi');
        }
        
        return $user->hasPermissionInLab('absensi.update-absensi', $labId);
    }

    /**
     * Determine whether the user can verify absensi.
     * Position-based: Kalab only
     */
    public function verify(User $user, Absensi $absensi): bool
    {
        $labId = $absensi->jadwalPiket?->periodePiket?->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPositionPermission('absensi.verify');
        }
        
        // Must have position permission (Kalab) AND be in same lab
        return $user->hasPositionPermission('absensi.verify')
            && $user->hasPermissionInLab('absensi.verify', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     * Only superadmin can delete absensi records
     */
    public function delete(User $user, Absensi $absensi): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Absensi $absensi): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Absensi $absensi): bool
    {
        return $user->hasRole('superadmin');
    }
}
