<?php

namespace App\Policies;

use App\Models\Inventaris;
use App\Models\User;

class InventarisPolicy
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
    public function view(User $user, Inventaris $inventaris): bool
    {
        // laboratorium_id now lives directly on detail_aset
        $labId = $inventaris->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('inventaris.view');
        }

        return $user->hasPermissionInLab('inventaris.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.manage-items');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Inventaris $inventaris): bool
    {
        $labId = $inventaris->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('inventaris.manage-items');
        }

        return $user->hasPermissionInLab('inventaris.manage-items', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Inventaris $inventaris): bool
    {
        $labId = $inventaris->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('inventaris.manage-items');
        }

        return $user->hasPermissionInLab('inventaris.manage-items', $labId);
    }

    /**
     * Determine whether the user can manage categories.
     */
    public function manageKategori(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.manage-kategori');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Inventaris $inventaris): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Inventaris $inventaris): bool
    {
        return $user->hasRole('superadmin');
    }
}
