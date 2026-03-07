<?php

namespace App\Policies;

use App\Models\KepengurusanUser;
use App\Models\User;

class KepengurusanUserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('kepengurusan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, KepengurusanUser $kepengurusanUser): bool
    {
        $labId = $kepengurusanUser->kepengurusanLab->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('kepengurusan.view');
        }

        return $user->hasPermissionInLab('kepengurusan.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     * Requires position-based permission (Kalab, Sekretaris, or admin)
     */
    public function create(User $user): bool
    {
        // Position-based permission (Kalab, Sekretaris)
        return $user->hasPositionPermission('kepengurusan.manage-anggota');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, KepengurusanUser $kepengurusanUser): bool
    {
        $labId = $kepengurusanUser->kepengurusanLab->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPositionPermission('kepengurusan.manage-anggota');
        }

        // Must have position permission AND be in same lab
        return $user->hasPositionPermission('kepengurusan.manage-anggota')
            && $user->hasPermissionInLab('kepengurusan.manage-anggota', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, KepengurusanUser $kepengurusanUser): bool
    {
        $labId = $kepengurusanUser->kepengurusanLab->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPositionPermission('kepengurusan.manage-anggota');
        }

        // Must have position permission AND be in same lab
        return $user->hasPositionPermission('kepengurusan.manage-anggota')
            && $user->hasPermissionInLab('kepengurusan.manage-anggota', $labId);
    }

    /**
     * Determine whether the user can transfer anggota from previous year.
     * Special permission for yearly transitions (Kalab/Admin only)
     */
    public function transfer(User $user): bool
    {
        // Kalab, superadmin/admin, or users with explicit transfer permission
        return $user->isKalab()
            || $user->hasRole(['superadmin', 'admin'])
            || $user->hasPermissionTo('kepengurusan.transfer-anggota');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, KepengurusanUser $kepengurusanUser): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, KepengurusanUser $kepengurusanUser): bool
    {
        return $user->hasRole('superadmin');
    }
}
