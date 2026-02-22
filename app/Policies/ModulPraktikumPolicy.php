<?php

namespace App\Policies;

use App\Models\ModulPraktikum;
use App\Models\User;

class ModulPraktikumPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('modul.view');
    }

    /**
     * Determine whether the user can view the model.
     * Public if has hash, otherwise check praktikum access
     */
    public function view(User $user, ModulPraktikum $modul): bool
    {
        // If modul has public hash, anyone can view (for public sharing)
        if ($modul->hash) {
            return true;
        }
        
        // Check if user has access to the praktikum
        if ($modul->praktikum_id && $user->canAccessPraktikum($modul->praktikum_id)) {
            return true;
        }
        
        // Or has general modul.view permission
        return $user->hasPermissionTo('modul.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('modul.create-modul');
    }

    /**
     * Determine whether the user can update the model.
     * Must be aslab of the praktikum or have admin permission
     */
    public function update(User $user, ModulPraktikum $modul): bool
    {
        // Check if user is aslab for this praktikum
        if ($modul->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return $user->hasPermissionTo('modul.update-modul');
            }
        }
        
        // Or has admin/superadmin role
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('modul.update-modul');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ModulPraktikum $modul): bool
    {
        // Check if user is aslab for this praktikum
        if ($modul->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return $user->hasPermissionTo('modul.delete-modul');
            }
        }
        
        // Or has admin/superadmin role
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('modul.delete-modul');
    }

    /**
     * Determine whether the user can publish the modul.
     * Must be aslab or admin
     */
    public function publish(User $user, ModulPraktikum $modul): bool
    {
        // Check if user is aslab for this praktikum
        if ($modul->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return $user->hasPermissionTo('modul.publish');
            }
        }
        
        // Or has admin/superadmin role
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('modul.publish');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ModulPraktikum $modul): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ModulPraktikum $modul): bool
    {
        return $user->hasRole('superadmin');
    }
}
