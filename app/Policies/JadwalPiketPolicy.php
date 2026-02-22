<?php

namespace App\Policies;

use App\Models\JadwalPiket;
use App\Models\User;

class JadwalPiketPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('piket.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, JadwalPiket $jadwalPiket): bool
    {
        $labId = $jadwalPiket->periodePiket->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('piket.view');
        }
        
        return $user->hasPermissionInLab('piket.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('piket.create-jadwal');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, JadwalPiket $jadwalPiket): bool
    {
        $labId = $jadwalPiket->periodePiket->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('piket.update-jadwal');
        }
        
        return $user->hasPermissionInLab('piket.update-jadwal', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, JadwalPiket $jadwalPiket): bool
    {
        $labId = $jadwalPiket->periodePiket->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPermissionTo('piket.delete-jadwal');
        }
        
        return $user->hasPermissionInLab('piket.delete-jadwal', $labId);
    }

    /**
     * Determine whether the user can approve jadwal swap (ganti jadwal).
     * This is position-based (Kalab only)
     */
    public function approveSwap(User $user, JadwalPiket $jadwalPiket): bool
    {
        $labId = $jadwalPiket->periodePiket->kepengurusanLab->laboratorium_id ?? null;
        
        if (!$labId) {
            return $user->hasPositionPermission('piket.approve-ganti-jadwal');
        }
        
        // Must have position permission (Kalab) AND be in same lab
        return $user->hasPositionPermission('piket.approve-ganti-jadwal')
            && $user->hasPermissionInLab('piket.approve-ganti-jadwal', $labId);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, JadwalPiket $jadwalPiket): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, JadwalPiket $jadwalPiket): bool
    {
        return $user->hasRole('superadmin');
    }
}
