<?php

namespace App\Policies;

use App\Models\TugasPraktikum;
use App\Models\User;

class TugasPraktikumPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('tugas.view');
    }

    /**
     * Determine whether the user can view the model.
     * Praktikan can view their own tugas, aslab can view all tugas for their praktikum
     */
    public function view(User $user, TugasPraktikum $tugas): bool
    {
        // Can view own tugas
        if ($tugas->user_id === $user->id) {
            return true;
        }
        
        // Check if user is aslab for this praktikum
        if ($tugas->modul?->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($tugas->modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return true;
            }
        }
        
        // Or has admin/superadmin role with permission
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('tugas.view');
    }

    /**
     * Determine whether the user can submit tugas.
     * Must be praktikan enrolled in the praktikum
     */
    public function submit(User $user, TugasPraktikum $tugas): bool
    {
        // Only the assigned user can submit
        if ($tugas->user_id !== $user->id) {
            return false;
        }
        
        // Must be enrolled as praktikan
        if ($tugas->modul?->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($tugas->modul->praktikum_id);
            return $effectiveRole === 'praktikan';
        }
        
        return false;
    }

    /**
     * Determine whether the user can grade tugas.
     * Must be aslab for that praktikum
     */
    public function grade(User $user, TugasPraktikum $tugas): bool
    {
        // Check if user is aslab for this praktikum
        if ($tugas->modul?->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($tugas->modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return $user->hasPermissionTo('tugas.grade');
            }
        }
        
        // Or has admin/superadmin role
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('tugas.grade');
    }

    /**
     * Determine whether the user can update the model.
     * Praktikan can update their own ungraded tugas, aslab can always update
     */
    public function update(User $user, TugasPraktikum $tugas): bool
    {
        // Praktikan can update own tugas if not graded yet
        if ($tugas->user_id === $user->id && !$tugas->nilai) {
            return true;
        }
        
        // Aslab can always update
        if ($tugas->modul?->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($tugas->modul->praktikum_id);
            if ($effectiveRole === 'aslab') {
                return true;
            }
        }
        
        // Or admin/superadmin
        return $user->hasRole(['superadmin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     * Only superadmin or aslab can delete
     */
    public function delete(User $user, TugasPraktikum $tugas): bool
    {
        // Superadmin can always delete
        if ($user->hasRole('superadmin')) {
            return true;
        }
        
        // Aslab can delete tugas for their praktikum
        if ($tugas->modul?->praktikum_id) {
            $effectiveRole = $user->getEffectiveRoleForPraktikum($tugas->modul->praktikum_id);
            return $effectiveRole === 'aslab';
        }
        
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TugasPraktikum $tugas): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TugasPraktikum $tugas): bool
    {
        return $user->hasRole('superadmin');
    }
}
