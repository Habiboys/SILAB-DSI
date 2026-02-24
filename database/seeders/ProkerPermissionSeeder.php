<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Spatie\Permission\PermissionRegistrar;

class ProkerPermissionSeeder extends Seeder
{
    /**
     * Seed proker-specific permissions.
     *
     * Permissions:
     *   proker.view              – view proker list & detail
     *   proker.create            – create new proker (only for parent/koordinator struktuts)
     *   proker.update            – edit proker metadata, parameters, PJ assignments
     *   proker.delete            – delete a proker (only the owning division koordinator)
     *   proker.approve           – approve / reject submitted proker (Kalab / approvers)
     *   proker.update-progress   – fill in capaian, evaluasi, dokumentasi (requires disetujui)
     *
     * Flow gate:
     *   draft → diajukan → disetujui/ditolak
     *   Capaian / evaluasi / dokumentasi only allowed when status_pengajuan = 'disetujui'
     */
    public function run(): void
    {
        // ── Reset cached permissions ───────────────────────────────────────────
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Create Spatie permissions ──────────────────────────────────────────
        $permissions = [
            'proker.view',
            'proker.create',
            'proker.update',
            'proker.delete',
            'proker.approve',
            'proker.update-progress',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // ── Assign to Roles ────────────────────────────────────────────────────

        // Asisten: can create/manage their own division proker & update progress
        $asisten = Role::firstOrCreate(['name' => 'asisten']);
        $asisten->givePermissionTo([
            'proker.view',
            'proker.create',
            'proker.update',
            'proker.delete',
            'proker.update-progress',
        ]);

        // Kalab / Dosen: can view and approve
        foreach (['kalab', 'dosen'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->givePermissionTo([
                'proker.view',
                'proker.approve',
            ]);
        }

        // Admin / Kadep / Superadmin: full access
        foreach (['admin', 'kadep', 'superadmin'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->givePermissionTo($permissions);
        }

        // ── Seed struktur_permissions ──────────────────────────────────────────
        // These position-based mappings complement the Spatie role system.
        // PermissionService::userCan() checks both sources.

        $mappings = [
            // ── Kepala Lab: full proker authority (approve + manage) ──────────
            'Kepala Lab' => [
                'proker.view',
                'proker.create',
                'proker.update',
                'proker.delete',
                'proker.approve',
                'proker.update-progress',
            ],

            // ── Division Koordinators: own their division's proker ────────────
            'Koordinator Divisi Penelitian & Pengembangan' => [
                'proker.view',
                'proker.create',
                'proker.update',
                'proker.delete',
                'proker.update-progress',
            ],
            'Koordinator Divisi Pengabdian & Pelatihan' => [
                'proker.view',
                'proker.create',
                'proker.update',
                'proker.delete',
                'proker.update-progress',
            ],
            'Koordinator Divisi Rumah Tangga' => [
                'proker.view',
                'proker.create',
                'proker.update',
                'proker.delete',
                'proker.update-progress',
            ],

            // ── Koordinator Asisten: can own a proker ────────────────────────
            'Koordinator Asisten' => [
                'proker.view',
                'proker.create',
                'proker.update',
                'proker.delete',
                'proker.update-progress',
            ],

            // ── Anggota: can only update progress (capaian/evaluasi/dok)
            //    when assigned as PJ – policy enforces division/PJ check ──────
            'Anggota Divisi Penelitian & Pengembangan' => [
                'proker.view',
                'proker.update-progress',
            ],
            'Anggota Divisi Pengabdian & Pelatihan' => [
                'proker.view',
                'proker.update-progress',
            ],
            'Anggota Divisi Rumah Tangga' => [
                'proker.view',
                'proker.update-progress',
            ],

            // ── Sekretaris & Bendahara: view only ────────────────────────────
            'Sekretaris' => [
                'proker.view',
            ],
            'Bendahara' => [
                'proker.view',
            ],
        ];

        foreach ($mappings as $jabatan => $perms) {
            foreach ($perms as $perm) {
                // Avoid duplicates
                $exists = DB::table('struktur_permissions')
                    ->where('jabatan', $jabatan)
                    ->where('permission', $perm)
                    ->exists();

                if (! $exists) {
                    DB::table('struktur_permissions')->insert([
                        'jabatan'     => $jabatan,
                        'permission'  => $perm,
                        'description' => null,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }
    }
}
