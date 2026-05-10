<?php

namespace App\Policies;

use App\Models\Proker;
use App\Models\User;
use App\Services\PermissionService;

class ProkerPolicy
{
    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /** True if the user is superadmin / kadep / admin (full bypass). */
    private function isSuperUser(User $user): bool
    {
        return $user->hasRole(['superadmin', 'kadep', 'admin']);
    }

    /**
     * True if the user is currently assigned to the same lab as the proker.
     * Superadmin / kadep always pass.
     */
    private function inSameLab(User $user, Proker $proker): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        $labId = $proker->kepengurusanLab->laboratorium_id ?? null;
        if (! $labId) {
            return true; // no lab restriction possible
        }

        $currentLab = $user->getCurrentLab();
        if (! $currentLab || ! isset($currentLab['laboratorium'])) {
            return false;
        }

        return (string) $currentLab['laboratorium']->id === (string) $labId;
    }

    /**
     * True if the user's active struktur is in the same division as the proker.
     * Covers both the koordinator position AND anggota child positions.
     */
    private function inSameDivision(User $user, Proker $proker): bool
    {
        $userStruktur = $user->getCurrentStruktur();
        if (! $userStruktur) {
            return false;
        }

        // Koordinator: user IS the owner struktur
        if ($userStruktur->id === $proker->struktur_id) {
            return true;
        }

        // Anggota: user's struktur is a child of the proker's owner struktur
        if (! is_null($userStruktur->parent_id) &&
            $userStruktur->parent_id === $proker->struktur_id) {
            return true;
        }

        return false;
    }

    /** True if the user is listed as a PJ for the proker. */
    private function isPj(User $user, Proker $proker): bool
    {
        return $proker->pjs()->where('user_id', $user->id)->exists();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Policy methods
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return PermissionService::userCan($user, 'proker.view')
            || $user->hasPermissionTo('kegiatan.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Proker $proker): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        $canView = PermissionService::userCan($user, 'proker.view')
                || $user->hasPermissionTo('kegiatan.view');

        return $canView && $this->inSameLab($user, $proker);
    }

    /**
     * Determine whether the user can create models.
     *
     * Requirements:
     *  - Has `proker.create` permission
     *    Superadmin / kadep / admin bypass permission check.
     */
    public function create(User $user): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        return PermissionService::userCan($user, 'proker.create');
    }

    /**
     * Determine whether the user can update the model.
     *
     * Requirements:
     *  - Has `proker.update` permission
     *  - Is in the same division (koordinator OR anggota child) OR is a PJ
     *  - Is in the same lab
     *    Superadmin / kadep / admin bypass all checks.
     */
    public function update(User $user, Proker $proker): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        if (! PermissionService::userCan($user, 'proker.update')) {
            return false;
        }

        if (! $this->inSameLab($user, $proker)) {
            return false;
        }

        return $this->inSameDivision($user, $proker) || $this->isPj($user, $proker);
    }



    /**
     * Update proker PROGRESS: capaian (achievement %), evaluasi (LPJ), dokumentasi.
     *
     * Requirements:
     *  - status_pengajuan MUST be 'disetujui' (proker must be approved first)
     *  - Has `proker.update-progress` OR `proker.update` permission
     *  - Is in the same division OR is a PJ
     *  - Is in the same lab
     */
    public function updateProgress(User $user, Proker $proker): bool
    {
        // Hard gate: proker must be approved before any progress can be recorded
        if ($proker->status_pengajuan !== 'disetujui') {
            return false;
        }

        if ($this->isSuperUser($user)) {
            return true;
        }

        $hasPermission = PermissionService::userCan($user, 'proker.update-progress')
                      || PermissionService::userCan($user, 'proker.update');

        if (! $hasPermission) {
            return false;
        }

        if (! $this->inSameLab($user, $proker)) {
            return false;
        }

        return $this->inSameDivision($user, $proker) || $this->isPj($user, $proker);
    }

    /**
     * Determine whether the user can delete the model.
     *
     * Requirements:
     *  - Has `proker.delete` permission
     *  - Is in the same lab
     *  - Is the exact division koordinator (not just a child/anggota)
     */
    public function delete(User $user, Proker $proker): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        if (! PermissionService::userCan($user, 'proker.delete')) {
            return false;
        }

        if (! $this->inSameLab($user, $proker)) {
            return false;
        }

        // Only the exact koordinator can delete (not anggota)
        $userStruktur = $user->getCurrentStruktur();

        return $userStruktur && $userStruktur->id === $proker->struktur_id;
    }

    /**
     * Update pelaksanaan status (belum_mulai → sedang_berjalan → selesai/ditunda).
     * Same as updateProgress – proker must be approved first.
     */
    public function updateStatus(User $user, Proker $proker): bool
    {
        return $this->updateProgress($user, $proker);
    }

    /**
     * Approve or reject a submitted proker.
     *
     * Requirements:
     *  - Has `proker.approve` permission (or legacy `kegiatan.approve`)
     *  - Is in the same lab
     */
    public function approve(User $user, Proker $proker): bool
    {
        if ($this->isSuperUser($user)) {
            return true;
        }

        $hasPermission = PermissionService::userCan($user, 'proker.approve')
                      || $user->hasPermissionTo('kegiatan.approve'); // backward compat

        if (! $hasPermission) {
            return false;
        }

        return $this->inSameLab($user, $proker);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Proker $proker): bool
    {
        return $user->hasRole('superadmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Proker $proker): bool
    {
        return $user->hasRole('superadmin');
    }
}
