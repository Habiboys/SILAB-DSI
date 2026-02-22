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
        return $user->hasPermissionTo('surat.view');
    }

    /**
     * Determine whether the user can view the model.
     * Users can view if they are sender or receiver
     */
    public function view(User $user, Surat $surat): bool
    {
        // Can view if sender or receiver
        if ($surat->from_user_id === $user->id || $surat->to_user_id === $user->id) {
            return true;
        }
        
        // Or if has general surat.view permission
        return $user->hasPermissionTo('surat.view');
    }

    /**
     * Determine whether the user can send surat.
     */
    public function send(User $user): bool
    {
        return $user->hasPermissionTo('surat.send');
    }

    /**
     * Determine whether the user can reply to surat.
     * Must be the receiver
     */
    public function reply(User $user, Surat $surat): bool
    {
        // Can only reply if you're the receiver
        return $surat->to_user_id === $user->id && $user->hasPermissionTo('surat.send');
    }

    /**
     * Determine whether the user can archive surat.
     */
    public function archive(User $user, Surat $surat): bool
    {
        // Can archive if sender or receiver
        if ($surat->from_user_id === $user->id || $surat->to_user_id === $user->id) {
            return $user->hasPermissionTo('surat.archive');
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
        if ($surat->from_user_id === $user->id && !$surat->is_read) {
            return true;
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
