<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class PermissionService
{
    /**
     * Get extra permission names for a given jabatan/struktur name (from DB FKs).
     */
    public static function getPermissionsForStruktur(string $struktur): array
    {
        return Cache::remember("struktur_permissions.{$struktur}", 3600, function () use ($struktur) {
            return DB::table('struktur_permissions')
                ->join('struktur', 'struktur_permissions.struktur_id', '=', 'struktur.id')
                ->join('permissions', 'struktur_permissions.permission_id', '=', 'permissions.id')
                ->where('struktur.struktur', $struktur)
                ->pluck('permissions.name')
                ->toArray();
        });
    }

    /**
     * Get extra permission names for a given struktur_id (UUID string).
     */
    public static function getPermissionsForStrukturId(string $strukturId): array
    {
        return Cache::remember("struktur_permissions.id.{$strukturId}", 3600, function () use ($strukturId) {
            return DB::table('struktur_permissions')
                ->join('permissions', 'struktur_permissions.permission_id', '=', 'permissions.id')
                ->where('struktur_permissions.struktur_id', $strukturId)
                ->pluck('permissions.name')
                ->toArray();
        });
    }

    /**
     * Get all unique jabatan (struktur) names that have configured permissions.
     */
    public static function getAllJabatan(): array
    {
        return Cache::remember('struktur_permissions.all_jabatan', 3600, function () {
            return DB::table('struktur_permissions')
                ->join('struktur', 'struktur_permissions.struktur_id', '=', 'struktur.id')
                ->distinct()
                ->orderBy('struktur.struktur')
                ->pluck('struktur.struktur')
                ->toArray();
        });
    }

    /**
     * Get jabatan data with permission counts.
     */
    public static function getJabatanWithCounts(): array
    {
        return Cache::remember('struktur_permissions.jabatan_counts', 3600, function () {
            return DB::table('struktur_permissions')
                ->join('struktur', 'struktur_permissions.struktur_id', '=', 'struktur.id')
                ->select('struktur.struktur as jabatan', DB::raw('COUNT(*) as permissions_count'))
                ->groupBy('struktur.struktur')
                ->get()
                ->toArray();
        });
    }

    /**
     * Clear cache for a given jabatan name, struktur_id (UUID string), or all.
     */
    public static function clearCache(?string $jabatan = null, ?string $strukturId = null): void
    {
        if ($jabatan) {
            Cache::forget("struktur_permissions.{$jabatan}");
        }
        if ($strukturId) {
            Cache::forget("struktur_permissions.id.{$strukturId}");
        }
        if (!$jabatan && !$strukturId) {
            $rows = DB::table('struktur_permissions')
                ->join('struktur', 'struktur_permissions.struktur_id', '=', 'struktur.id')
                ->distinct()
                ->get(['struktur.struktur as jabatan', 'struktur_permissions.struktur_id']);

            foreach ($rows as $r) {
                Cache::forget("struktur_permissions.{$r->jabatan}");
                Cache::forget("struktur_permissions.id.{$r->struktur_id}");
            }
            Cache::forget('struktur_permissions.all_jabatan');
            Cache::forget('struktur_permissions.jabatan_counts');
        }
    }

    /**
     * Check if user can perform action based on role + struktur permissions.
     */
    public static function userCan(User $user, string $permission): bool
    {
        if ($user->can($permission)) {
            return true;
        }

        $strukturAktif = $user->strukturAktif;
        if (!$strukturAktif) {
            return false;
        }

        $strukturPermissions = self::getPermissionsForStruktur($strukturAktif->struktur);

        return in_array($permission, $strukturPermissions);
    }
}
