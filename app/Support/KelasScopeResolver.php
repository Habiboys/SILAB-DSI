<?php

namespace App\Support;

use App\Models\Kelas;

class KelasScopeResolver
{
    /**
     * Resolve kelas scope for UI/features:
     * - If selected kelas is sub-kelas: include [sub-kelas, parent].
     * - If selected kelas is parent: include [parent + all descendants].
     */
    public static function resolve(?string $kelasId): array
    {
        if (!$kelasId) {
            return [];
        }

        if (in_array($kelasId, ['all', 'umum'], true)) {
            return [];
        }

        $kelas = Kelas::find($kelasId);
        if (!$kelas) {
            return [$kelasId];
        }

        // Sub-kelas: show sub-kelas + parent only
        if (!empty($kelas->parent_kelas_id)) {
            return array_values(array_unique([$kelas->id, $kelas->parent_kelas_id]));
        }

        // Parent kelas: show parent + all descendants
        $allIds = [$kelas->id];
        $frontier = [$kelas->id];

        while (!empty($frontier)) {
            $children = Kelas::query()
                ->whereIn('parent_kelas_id', $frontier)
                ->pluck('id')
                ->all();

            $children = array_values(array_diff($children, $allIds));
            if (empty($children)) {
                break;
            }

            $allIds = array_merge($allIds, $children);
            $frontier = $children;
        }

        return array_values(array_unique($allIds));
    }
}
