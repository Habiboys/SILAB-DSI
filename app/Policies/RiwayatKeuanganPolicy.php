<?php

namespace App\Policies;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class RiwayatKeuanganPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('keuangan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Model $riwayatKeuangan): bool
    {
        $labId = $riwayatKeuangan->kepengurusanLab->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('keuangan.view');
        }

        return $user->hasPermissionInLab('keuangan.view', $labId);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('keuangan.create-transaksi');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Model $riwayatKeuangan): bool
    {
        $labId = $riwayatKeuangan->kepengurusanLab->laboratorium_id ?? null;

        if (!$labId) {
            return $user->hasPermissionTo('keuangan.update-transaksi');
        }

        return $user->hasPermissionInLab('keuangan.update-transaksi', $labId);
    }

    /**
     * Determine whether the user can delete the model.
     * Only superadmin and admin can delete transactions
     */
    public function delete(User $user, Model $riwayatKeuangan): bool
    {
        // Use the gate we defined
        return $user->can('delete-transaksi');
    }

    /**
     * Determine whether the user can manage nominal kas.
     * This requires position-based permission (Bendahara) or admin/superadmin
     */
    public function manageNominalKas(User $user): bool
    {
        // Bendahara position gets this automatically
        if ($user->hasPosition('Bendahara')) {
            return true;
        }

        // Or if user has the explicit permission
        return $user->hasPermissionTo('keuangan.manage-nominal-kas');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, RiwayatKeuangan $riwayatKeuangan): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, RiwayatKeuangan $riwayatKeuangan): bool
    {
        return $user->hasRole('superadmin');
    }
}
