<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class PermissionService
{
    /**
     * Get extra permissions based on struktur position (from database)
     */
    public static function getPermissionsForStruktur(string $struktur): array
    {
        // Cache for 1 hour to avoid repeated DB queries
        return Cache::remember("struktur_permissions.{$struktur}", 3600, function () use ($struktur) {
            return DB::table('struktur_permissions')
                ->where('jabatan', $struktur)
                ->pluck('permission')
                ->toArray();
        });
    }
    
    /**
     * Get all unique jabatan names
     */
    public static function getAllJabatan(): array
    {
        return Cache::remember('struktur_permissions.all_jabatan', 3600, function () {
            return DB::table('struktur_permissions')
                ->distinct()
                ->orderBy('jabatan')
                ->pluck('jabatan')
                ->toArray();
        });
    }
    
    /**
     * Get jabatan data with permission counts
     */
    public static function getJabatanWithCounts(): array
    {
        return Cache::remember('struktur_permissions.jabatan_counts', 3600, function () {
            return DB::table('struktur_permissions')
                ->select('jabatan', DB::raw('COUNT(*) as permissions_count'))
                ->groupBy('jabatan')
                ->get()
                ->toArray();
        });
    }
    
    /**
     * Clear cache when permissions are updated
     */
    public static function clearCache(?string $jabatan = null): void
    {
        if ($jabatan) {
            Cache::forget("struktur_permissions.{$jabatan}");
        } else {
            // Clear all struktur permission caches
            $jabatans = DB::table('struktur_permissions')
                ->distinct()
                ->pluck('jabatan');
                
            foreach ($jabatans as $jab) {
                Cache::forget("struktur_permissions.{$jab}");
            }
            Cache::forget('struktur_permissions.all_jabatan');
            Cache::forget('struktur_permissions.jabatan_counts');
        }
    }

    /**
     * Check if user can perform action based on role + struktur
     */
    public static function userCan(User $user, string $permission): bool
    {
        // Check direct permission via role (Spatie)
        if ($user->can($permission)) {
            return true;
        }
        
        // Check struktur-based permission
        $strukturAktif = $user->strukturAktif;
        if (!$strukturAktif) {
            return false;
        }
        
        $strukturPermissions = self::getPermissionsForStruktur($strukturAktif->struktur);
        
        return in_array($permission, $strukturPermissions);
    }
}
