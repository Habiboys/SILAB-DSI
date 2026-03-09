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
        $praktikumId = $tugas->kelas?->praktikum_id ?? $tugas->pertemuan?->kelas?->praktikum_id;
        if ($praktikumId && $user->canManagePraktikum($praktikumId)) {
            return true;
        }
        return $user->hasRole(['superadmin', 'admin']) && $user->hasPermissionTo('tugas.view');
    }

    /**
     * Determine whether the user can submit tugas.
     * Must be praktikan enrolled in the praktikum
     */
    public function submit(User $user, TugasPraktikum $tugas): bool
    {
        $praktikumId = $tugas->kelas?->praktikum_id ?? $tugas->pertemuan?->kelas?->praktikum_id;
        return $praktikumId && $user->getEffectiveRoleForPraktikum($praktikumId) === 'praktikan';
    }

    /**
     * Determine whether the user can grade tugas.
     * Must be aslab for that praktikum
     */
    public function grade(User $user, TugasPraktikum $tugas): bool
    {
        $praktikumId = $tugas->kelas?->praktikum_id ?? $tugas->pertemuan?->kelas?->praktikum_id;
        if ($praktikumId && $user->canManagePraktikum($praktikumId)) {
            return true;
        }
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
        if ($user->hasRole('superadmin')) {
            return true;
        }
        $praktikumId = $tugas->kelas?->praktikum_id ?? $tugas->pertemuan?->kelas?->praktikum_id;
        return $praktikumId && $user->canManagePraktikum($praktikumId);
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
