<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ============================================
        // MODULE: PRAKTIKUM
        // ============================================
        Permission::create(['name' => 'praktikum.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikum.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikum.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikum.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikum.assign-aslab', 'guard_name' => 'web']);

        // ============================================
        // MODULE: PRAKTIKAN
        // ============================================
        Permission::create(['name' => 'praktikan.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikan.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikan.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikan.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'praktikan.import', 'guard_name' => 'web']);

        // ============================================
        // MODULE: TUGAS
        // ============================================
        Permission::create(['name' => 'tugas.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'tugas.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'tugas.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'tugas.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'tugas.grade', 'guard_name' => 'web']);
        Permission::create(['name' => 'tugas.submit', 'guard_name' => 'web']);

        // ============================================
        // MODULE: ABSENSI
        // ============================================
        Permission::create(['name' => 'absensi.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'absensi.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'absensi.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'absensi.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'absensi.verify', 'guard_name' => 'web']);

        // ============================================
        // MODULE: INVENTARIS
        // ============================================
        Permission::create(['name' => 'inventaris.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'inventaris.manage-kategori', 'guard_name' => 'web']);
        Permission::create(['name' => 'inventaris.manage-items', 'guard_name' => 'web']);
        Permission::create(['name' => 'inventaris.manage-permohonan', 'guard_name' => 'web']);
        Permission::create(['name' => 'inventaris.approve-permohonan', 'guard_name' => 'web']);

        // ============================================
        // MODULE: KEUANGAN
        // ============================================
        Permission::create(['name' => 'keuangan.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'keuangan.create-transaksi', 'guard_name' => 'web']);
        Permission::create(['name' => 'keuangan.update-transaksi', 'guard_name' => 'web']);
        Permission::create(['name' => 'keuangan.delete-transaksi', 'guard_name' => 'web']);

        // ============================================
        // MODULE: PIKET
        // ============================================
        Permission::create(['name' => 'piket.view-jadwal', 'guard_name' => 'web']);
        Permission::create(['name' => 'piket.manage-periode', 'guard_name' => 'web']);
        Permission::create(['name' => 'piket.manage-jadwal', 'guard_name' => 'web']);
        Permission::create(['name' => 'piket.request-ganti-jadwal', 'guard_name' => 'web']);
        Permission::create(['name' => 'piket.approve-ganti-jadwal', 'guard_name' => 'web']);

        // ============================================
        // MODULE: KEPENGURUSAN
        // ============================================
        Permission::create(['name' => 'kepengurusan.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'kepengurusan.manage-anggota', 'guard_name' => 'web']);
        Permission::create(['name' => 'kepengurusan.manage-struktur', 'guard_name' => 'web']);
        Permission::create(['name' => 'kepengurusan.transfer-anggota', 'guard_name' => 'web']);

        // ============================================
        // MODULE: SURAT
        // ============================================
        Permission::create(['name' => 'surat.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'surat.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'surat.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'surat.delete', 'guard_name' => 'web']);

        // ============================================
        // MODULE: MODUL PRAKTIKUM
        // ============================================
        Permission::create(['name' => 'modul.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'modul.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'modul.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'modul.delete', 'guard_name' => 'web']);

        // ============================================
        // MODULE: PROKER
        // ============================================
        Permission::create(['name' => 'proker.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'proker.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'proker.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'proker.delete', 'guard_name' => 'web']);

        // ============================================
        // MODULE: ADMIN (User Management)
        // ============================================
        Permission::create(['name' => 'admin.view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'admin.create-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'admin.update-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'admin.delete-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'admin.manage-roles', 'guard_name' => 'web']);
        Permission::create(['name' => 'admin.manage-permissions', 'guard_name' => 'web']);

        // ============================================
        // MODULE: RUBRIK PENILAIAN
        // ============================================
        Permission::create(['name' => 'rubrik.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'rubrik.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'rubrik.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'rubrik.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'rubrik.grade', 'guard_name' => 'web']);

        // ============================================
        // MODULE: SERTIFIKAT
        // ============================================
        Permission::create(['name' => 'sertifikat.view', 'guard_name' => 'web']);
        Permission::create(['name' => 'sertifikat.create', 'guard_name' => 'web']);
        Permission::create(['name' => 'sertifikat.update', 'guard_name' => 'web']);
        Permission::create(['name' => 'sertifikat.delete', 'guard_name' => 'web']);
        Permission::create(['name' => 'sertifikat.generate', 'guard_name' => 'web']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Delete all permissions created by this migration
        $permissions = [
            // Praktikum
            'praktikum.view', 'praktikum.create', 'praktikum.update', 'praktikum.delete', 'praktikum.assign-aslab',
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
            'piket.view-jadwal', 'piket.manage-periode', 'piket.manage-jadwal', 'piket.request-ganti-jadwal', 'piket.approve-ganti-jadwal',
            // Kepengurusan
            'kepengurusan.view', 'kepengurusan.manage-anggota', 'kepengurusan.manage-struktur', 'kepengurusan.transfer-anggota',
            // Surat
            'surat.view', 'surat.create', 'surat.update', 'surat.delete',
            // Modul
            'modul.view', 'modul.create', 'modul.update', 'modul.delete',
            // Proker
            'proker.view', 'proker.create', 'proker.update', 'proker.delete',
            // Admin
            'admin.view-users', 'admin.create-users', 'admin.update-users', 'admin.delete-users', 'admin.manage-roles', 'admin.manage-permissions',
            // Rubrik
            'rubrik.view', 'rubrik.create', 'rubrik.update', 'rubrik.delete', 'rubrik.grade',
            // Sertifikat
            'sertifikat.view', 'sertifikat.create', 'sertifikat.update', 'sertifikat.delete', 'sertifikat.generate',
        ];

        foreach ($permissions as $permission) {
            Permission::where('name', $permission)->delete();
        }
    }
};
