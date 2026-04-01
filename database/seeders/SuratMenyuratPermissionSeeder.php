<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Permission;
use App\Models\Permission\Role;

class SuratMenyuratPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // ----------------------------------------------------------------
        // 1. Create all surat menyurat permissions
        // ----------------------------------------------------------------
        $permissions = [
            // Surat Keluar
            'surat-keluar.viewAny',
            'surat-keluar.view',
            'surat-keluar.create',
            'surat-keluar.edit',
            'surat-keluar.delete',
            'surat-keluar.export',

            // Surat Masuk
            'surat-masuk.viewAny',
            'surat-masuk.view',
            'surat-masuk.create',
            'surat-masuk.edit',
            'surat-masuk.delete',
            'surat-masuk.export',

            // Disposisi
            'disposisi.view',
            'disposisi.create',
            'disposisi.update-status',

            // Konfigurasi Surat
            'konfigurasi-surat.view',
            'konfigurasi-surat.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $this->command->info('✓ Surat menyurat permissions created.');

        // ----------------------------------------------------------------
        // 2. Superadmin — all permissions (already has Permission::all(),
        //    but re-sync to pick up new ones)
        // ----------------------------------------------------------------
        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $superadmin->givePermissionTo($permissions);
        $this->command->info('✓ Superadmin: surat menyurat permissions added.');

        // ----------------------------------------------------------------
        // 3. Admin — full CRUD + export + konfigurasi
        // ----------------------------------------------------------------
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->givePermissionTo($permissions); // all
        $this->command->info('✓ Admin: surat menyurat permissions added.');

        // ----------------------------------------------------------------
        // 4. Kalab — full CRUD + export + konfigurasi
        // ----------------------------------------------------------------
        $kalab = Role::firstOrCreate(['name' => 'kalab', 'guard_name' => 'web']);
        $kalab->givePermissionTo($permissions); // all
        $this->command->info('✓ Kalab: surat menyurat permissions added.');

        // ----------------------------------------------------------------
        // 5. Asisten — view only (Sekretaris gets CRUD via portal/jabatan
        //    logic; here we give base view so all asisten can read)
        // ----------------------------------------------------------------
        $asisten = Role::firstOrCreate(['name' => 'asisten', 'guard_name' => 'web']);
        $asisten->givePermissionTo([
            'surat-keluar.viewAny',
            'surat-keluar.view',
            'surat-masuk.viewAny',
            'surat-masuk.view',
            'disposisi.view',
            'disposisi.update-status', // recipient needs this
            'konfigurasi-surat.view',
        ]);
        $this->command->info('✓ Asisten: surat menyurat view permissions added.');

        // ----------------------------------------------------------------
        // 6. Kadep — view only
        // ----------------------------------------------------------------
        $kadep = Role::firstOrCreate(['name' => 'kadep', 'guard_name' => 'web']);
        $kadep->givePermissionTo([
            'surat-keluar.viewAny',
            'surat-keluar.view',
            'surat-masuk.viewAny',
            'surat-masuk.view',
            'disposisi.view',
            'konfigurasi-surat.view',
        ]);
        $this->command->info('✓ Kadep: surat menyurat view permissions added.');

        // ----------------------------------------------------------------
        // 7. Dosen — view only (if role exists)
        // ----------------------------------------------------------------
        $dosen = Role::firstOrCreate(['name' => 'dosen', 'guard_name' => 'web']);
        $dosen->givePermissionTo([
            'surat-keluar.viewAny',
            'surat-keluar.view',
            'surat-masuk.viewAny',
            'surat-masuk.view',
            'disposisi.view',
            'konfigurasi-surat.view',
        ]);
        $this->command->info('✓ Dosen: surat menyurat view permissions added.');

        // ----------------------------------------------------------------
        // 8. Praktikan — NO access (intentional: no permissions added)
        // ----------------------------------------------------------------
        $this->command->info('✓ Praktikan: no surat menyurat permissions (by design).');

        $this->command->info('SuratMenyuratPermissionSeeder completed.');
    }
}
