<?php

namespace App\Policies;

use App\Models\Kuesioner;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class KuesionerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('survey.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Kuesioner $kuesioner): bool
    {
        // Internal users with permission
        if ($user->hasPermissionTo('survey.view')) {
            return true;
        }

        // Check if user is in target audience for participation view
        // This might be handled separately in 'participate' check

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('survey.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Kuesioner $kuesioner): bool
    {
        return $user->hasPermissionTo('survey.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Kuesioner $kuesioner): bool
    {
        return $user->hasPermissionTo('survey.delete');
    }

    /**
     * Determine whether the user can view results.
     */
    public function viewResults(User $user, Kuesioner $kuesioner): bool
    {
        return $user->hasPermissionTo('survey.view_results');
    }

    /**
     * Determine whether the user can participate in the survey.
     */
    public function participate(User $user, Kuesioner $kuesioner): bool
    {
        // 1. Check if kuesioner is active
        if (!$kuesioner->is_active) {
            return false;
        }

        // 2. Check dates
        $now = now();
        if ($kuesioner->tanggal_mulai && $now->lt($kuesioner->tanggal_mulai)) {
            return false;
        }
        if ($kuesioner->tanggal_selesai && $now->gt($kuesioner->tanggal_selesai)) {
            return false;
        }

        // 3. Check target audience
        // If no targets defined, assume public/all internal users? Or restricted?
        // Let's assume if targets exist, must match. If empty, maybe open to all?
        if ($kuesioner->target->count() > 0) {
            $allowedRoles = $kuesioner->target->load('role')->pluck('role.name')->filter()->toArray();
            if (!empty($allowedRoles) && !$user->hasRole($allowedRoles) && !$user->hasRole('superadmin')) {
                return false;
            }
        }

        return true;
    }
}
