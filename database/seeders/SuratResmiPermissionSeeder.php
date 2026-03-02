<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\DB;

/**
 * Menambahkan dua permission baru untuk fitur Surat Resmi:
 *
 *  surat.create_resmi  → Membuat & mengelola surat atas nama laboratorium
 *  surat.view_all      → Melihat seluruh arsip surat resmi milik lab
 *
 * Assignment role:
 *  - admin, superadmin     → mendapat keduanya
 *  - asisten ber-jabatan Sekretaris → ditambahkan via struktur_permissions (jabatan-based)
 */
class SuratResmiPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Buat permission baru
        $newPermissions = ['surat.create_resmi', 'surat.view_all'];

        foreach ($newPermissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            $this->command->info("✓ Permission '{$perm}' ensured.");
        }

        // 2. Berikan ke superadmin & admin
        foreach (['superadmin', 'admin'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->givePermissionTo($newPermissions);
                $this->command->info("✓ Role '{$roleName}' diberi surat.create_resmi + surat.view_all.");
            }
        }

        // 3. Tambahkan ke mapping jabatan Sekretaris di struktur_permissions
        //    (mechanism jabatan-based permission yang sudah ada di sistem)
        $jabatan = 'Sekretaris';
        foreach ($newPermissions as $perm) {
            $exists = DB::table('struktur_permissions')
                ->where('jabatan', $jabatan)
                ->where('permission', $perm)
                ->exists();

            if (!$exists) {
                DB::table('struktur_permissions')->insert([
                    'jabatan'     => $jabatan,
                    'permission'  => $perm,
                    'description' => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
                $this->command->info("✓ Jabatan '{$jabatan}' → '{$perm}' ditambahkan ke struktur_permissions.");
            } else {
                $this->command->info("  Jabatan '{$jabatan}' → '{$perm}' sudah ada, skip.");
            }
        }

        $this->command->info('');
        $this->command->info('SuratResmiPermissionSeeder selesai.');
    }
}
