<?php

namespace App\Policies;

use App\Models\Surat;
use App\Models\User;

class SuratPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('surat-masuk.viewAny') || $user->can('surat-keluar.viewAny');
    }

    /**
     * Determine whether the user can view the model.
     * Users can view if they are sender or receiver
     */
    public function view(User $user, Surat $surat): bool
    {
        if ($surat->pengirim === $user->id) {
            return $user->can('surat-keluar.view') || $user->can('surat-keluar.viewAny');
        }

        if ($surat->penerima === $user->id) {
            return $user->can('surat-masuk.view') || $user->can('surat-masuk.viewAny');
        }

        return $user->can('surat-masuk.viewAny') || $user->can('surat-keluar.viewAny');
    }

    /**
     * Determine whether the user can send surat.
     */
    public function send(User $user): bool
    {
        return $user->can('surat-keluar.create');
    }

    /**
     * Determine whether the user can reply to surat.
     * Must be the receiver
     */
    public function reply(User $user, Surat $surat): bool
    {
        // Can only reply if you're the receiver
        return $surat->penerima === $user->id && $user->can('surat-keluar.create');
    }

    /**
     * Determine whether the user can archive surat.
     */
    public function archive(User $user, Surat $surat): bool
    {
        if ($surat->pengirim === $user->id) {
            return $user->can('surat-keluar.edit');
        }

        if ($surat->penerima === $user->id) {
            return $user->can('surat-masuk.edit');
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     * Only sender can delete (before it's read)
     */
    public function delete(User $user, Surat $surat): bool
    {
        // Only sender can delete their own sent mail (and only if not read yet)
        if ($surat->pengirim === $user->id && !$surat->isread) {
            return $user->can('surat-keluar.delete');
        }

        // Or superadmin
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Surat $surat): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Surat $surat): bool
    {
        return $user->hasRole('superadmin');
    }
}
