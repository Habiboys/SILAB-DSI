<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\DB;

class CompletePermissionFixSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('Starting Complete Permission Fix...');

        // 1. Define ALL Permissions
        $permissions = [
            // Praktikum Base
            'praktikum.view', 'praktikum.create', 'praktikum.update', 'praktikum.delete',
            'praktikum.assign-aslab',
            
            // Praktikum Features (New)
            'praktikum.pertemuan.view', 'praktikum.pertemuan.create', 'praktikum.pertemuan.update', 'praktikum.pertemuan.delete',
            'praktikum.sertifikat.view', 'praktikum.sertifikat.create', 'praktikum.sertifikat.generate',
            
            // Modul
            'modul.view', 'modul.create', 'modul.update', 'modul.delete',
            'modul.create-modul', 'modul.update-modul', 'modul.delete-modul', 'modul.publish', // Specific ones
            
            // Praktikan
            'praktikan.view', 'praktikan.create', 'praktikan.update', 'praktikan.delete', 'praktikan.import',
            
            // Tugas
            'tugas.view', 'tugas.create', 'tugas.update', 'tugas.delete', 'tugas.grade', 'tugas.submit',
            
            // Absensi
            'absensi.view', 'absensi.create', 'absensi.update', 'absensi.delete', 'absensi.verify',
            
            // Inventaris
            'inventaris.view', 'inventaris.manage-kategori', 'inventaris.manage-items', 'inventaris.manage-permohonan', 'inventaris.approve-permohonan',
            
            // Keuangan
            'keuangan.view', 'keuangan.create-transaksi', 'keuangan.update-transaksi', 'keuangan.delete-transaksi',
            
            // Piket
            'piket.view', 'piket.view-jadwal', 'piket.manage-periode', 'piket.manage-jadwal', 'piket.request-ganti-jadwal', 'piket.approve-ganti-jadwal',
            
            // Kepengurusan
            'kepengurusan.view', 'kepengurusan.manage-struktur', 'kepengurusan.manage-anggota',
            
            // Surat
            'surat.view', 'surat.create', 'surat.update', 'surat.delete',
            
            // Proker
            'proker.view', 'proker.create', 'proker.update', 'proker.delete',
            
            // Rubrik
            'rubrik.view', 'rubrik.create', 'rubrik.update', 'rubrik.delete', 'rubrik.grade',
            
            // Sertifikat Base
            'sertifikat.view', 'sertifikat.create', 'sertifikat.update', 'sertifikat.delete', 'sertifikat.generate',
            
            // Admin
            'admin.view-users',
        ];

        // Create Permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $this->command->info('✓ All permissions ensured.');

        // 2. Assign to Roles
        
        // SUPERADMIN
        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $superadmin->givePermissionTo(Permission::all());
        $this->command->info('✓ Superadmin permissions synced.');

        // ADMIN
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminPermissions = [
            'praktikum.view', 'praktikum.create', 'praktikum.update', 'praktikum.delete',
            'praktikum.pertemuan.view', 'praktikum.pertemuan.create', 'praktikum.pertemuan.update', 'praktikum.pertemuan.delete',
            'praktikum.sertifikat.view', 'praktikum.sertifikat.create', 'praktikum.sertifikat.generate',
            'modul.view', 'modul.create-modul', 'modul.update-modul', 'modul.delete-modul', 'modul.publish',
            'praktikan.view', 'praktikan.create', 'praktikan.update', 'praktikan.delete', 'praktikan.import',
            'tugas.view', 'tugas.create', 'tugas.update', 'tugas.delete', 'tugas.grade',
            'absensi.view', 'absensi.create', 'absensi.update', 'absensi.delete',
            'inventaris.view', 'inventaris.manage-kategori', 'inventaris.manage-items', 'inventaris.manage-permohonan',
            'keuangan.view', 'keuangan.create-transaksi', 'keuangan.update-transaksi', 'keuangan.delete-transaksi',
            'piket.view', 'piket.view-jadwal', 'piket.manage-periode', 'piket.manage-jadwal', 'piket.request-ganti-jadwal',
            'kepengurusan.view', 'kepengurusan.manage-struktur',
            'surat.view', 'surat.create', 'surat.update', 'surat.delete',
            'proker.view', 'proker.create', 'proker.update', 'proker.delete',
            'rubrik.view', 'rubrik.create', 'rubrik.update', 'rubrik.delete', 'rubrik.grade',
            'sertifikat.view', 'sertifikat.create', 'sertifikat.update', 'sertifikat.delete', 'sertifikat.generate',
            'admin.view-users',
        ];
        $admin->syncPermissions($adminPermissions);
        $this->command->info('✓ Admin permissions synced.');

        // ASISTEN
        $asisten = Role::firstOrCreate(['name' => 'asisten', 'guard_name' => 'web']);
        $asistenPermissions = [
            'praktikum.view',
            'praktikum.pertemuan.view', 'praktikum.pertemuan.create', 'praktikum.pertemuan.update', 'praktikum.pertemuan.delete',
            'praktikum.sertifikat.view', 'praktikum.sertifikat.generate',
            'modul.view', 'modul.create-modul', 'modul.update-modul', 'modul.delete-modul', 'modul.publish',
            'praktikan.view',
            'tugas.view', 'tugas.create',
            'absensi.view', 'absensi.create',
            'inventaris.view', 'inventaris.manage-permohonan',
            'keuangan.view',
            'piket.view', 'piket.view-jadwal', 'piket.request-ganti-jadwal',
            'kepengurusan.view',
            'surat.view',
            'proker.view',
            'rubrik.view',
            'sertifikat.view',
        ];
        $asisten->syncPermissions($asistenPermissions);
        $this->command->info('✓ Asisten permissions synced.');

        // KADEP
        $kadep = Role::firstOrCreate(['name' => 'kadep', 'guard_name' => 'web']);
        $kadepPermissions = [
            'praktikum.view', 'praktikum.pertemuan.view', 'praktikum.sertifikat.view',
            'praktikan.view',
            'tugas.view',
            'absensi.view',
            'inventaris.view',
            'keuangan.view',
            'piket.view', 'piket.view-jadwal',
            'kepengurusan.view',
            'surat.view',
            'modul.view',
            'proker.view',
            'rubrik.view',
            'sertifikat.view',
            'admin.view-users',
        ];
        $kadep->syncPermissions($kadepPermissions);
        $this->command->info('✓ Kadep permissions synced.');

        // PRAKTIKAN
        $praktikan = Role::firstOrCreate(['name' => 'praktikan', 'guard_name' => 'web']);
        $praktikanPermissions = [
            'tugas.view', 'tugas.submit',
            'absensi.view',
            'piket.view', 'piket.view-jadwal',
            'modul.view',
            'sertifikat.view',
            'praktikum.pertemuan.view', 'praktikum.sertifikat.view',
        ];
        $praktikan->syncPermissions($praktikanPermissions);
        $this->command->info('✓ Praktikan permissions synced.');

        $this->command->info('Complete Permission Fix Seeder Finished.');
        
        // Output Sample Debug Info for Admin
        $this->command->info("Admin Permissions Count: " . $admin->permissions->count());
    }
}
