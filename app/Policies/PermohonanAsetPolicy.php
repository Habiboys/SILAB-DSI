<?php

namespace App\Policies;

use App\Models\PermohonanAset;
use App\Models\User;

class PermohonanAsetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.view');
    }

    public function view(User $user, PermohonanAset $permohonanAset): bool
    {
        $labId = $permohonanAset->laboratorium_id;

        if (!$labId) {
            return $user->hasPermissionTo('inventaris.view');
        }

        return $user->hasPermissionInLab('inventaris.view', $labId);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventaris.manage-permohonan');
    }

    public function update(User $user, PermohonanAset $permohonanAset): bool
    {
        $labId = $permohonanAset->laboratorium_id;

        if (!$labId) {
            return $user->hasPermissionTo('inventaris.manage-permohonan');
        }

        return $user->hasPermissionInLab('inventaris.manage-permohonan', $labId);
    }

    public function delete(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->id === $permohonanAset->user_pemohon_id
            || $user->hasRole('superadmin');
    }

    /**
     * Kalab mereview permohonan (diajukan → disetujui_kalab / ditolak_kalab).
     */
    public function reviewKalab(User $user, PermohonanAset $permohonanAset): bool
    {
        $labId = $permohonanAset->laboratorium_id;

        if ($user->hasRole('superadmin')) {
            return true;
        }

        if (!$labId) {
            return $user->hasPositionPermission('inventaris.review-permohonan');
        }

        return $user->hasPositionPermission('inventaris.review-permohonan')
            && $user->hasPermissionInLab('inventaris.review-permohonan', $labId);
    }

    /**
     * Kadep melakukan ACC final (disetujui_kalab → disetujui_kadep / ditolak_kadep).
     */
    public function approveKadep(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasRole('superadmin')
            || $user->hasPermissionTo('inventaris.approve-final');
    }

    /**
     * Konversi item wishlist menjadi data aset setelah disetujui Kadep.
     */
    public function convertToAset(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasPermissionTo('inventaris.convert-to-aset')
            || $user->hasRole('superadmin');
    }

    public function restore(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasRole('superadmin');
    }

    public function forceDelete(User $user, PermohonanAset $permohonanAset): bool
    {
        return $user->hasRole('superadmin');
    }
}
