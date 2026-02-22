<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ============================================
        // SUPERADMIN - Full Access
        // ============================================
        $superadmin = Role::where('name', 'superadmin')->first();
        if ($superadmin) {
            // Give all permissions
            $superadmin->givePermissionTo(Permission::all());
            $this->command->info('✓ Superadmin: All permissions assigned');
        }

        // ============================================
        // KADEP - Oversight (Mostly Read-Only)
        // ============================================
        $kadep = Role::where('name', 'kadep')->first();
        if ($kadep) {
            $kadep->givePermissionTo([
                // View-only access to most modules
                'praktikum.view',
                'praktikan.view',
                'tugas.view',
                'absensi.view',
                'inventaris.view',
                'keuangan.view',
                'piket.view-jadwal',
                'kepengurusan.view',
                'surat.view',
                'modul.view',
                'proker.view',
                'rubrik.view',
                'sertifikat.view',
                
                // Can view users but not manage
                'admin.view-users',
            ]);
            $this->command->info('✓ Kadep: Read-only permissions assigned');
        }

        // ============================================
        // ADMIN - Lab Management (Most permissions)
        // ============================================
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->givePermissionTo([
                // Praktikum - Full CRUD
                'praktikum.view', 'praktikum.create', 'praktikum.update', 'praktikum.delete',
                
                // Praktikan - Full CRUD + Import
                'praktikan.view', 'praktikan.create', 'praktikan.update', 'praktikan.delete', 'praktikan.import',
                
                // Tugas - Full CRUD + Grade
                'tugas.view', 'tugas.create', 'tugas.update', 'tugas.delete', 'tugas.grade',
                
                // Absensi - Full CRUD
                'absensi.view', 'absensi.create', 'absensi.update', 'absensi.delete',
                
                // Inventaris - Full access except approve
                'inventaris.view', 'inventaris.manage-kategori', 'inventaris.manage-items', 'inventaris.manage-permohonan',
                
                // Keuangan - Full CRUD
                'keuangan.view', 'keuangan.create-transaksi', 'keuangan.update-transaksi', 'keuangan.delete-transaksi',
                
                // Piket - Full management
                'piket.view-jadwal', 'piket.manage-periode', 'piket.manage-jadwal', 'piket.request-ganti-jadwal',
                
                // Kepengurusan - View and manage struktur
                'kepengurusan.view', 'kepengurusan.manage-struktur',
                
                // Surat - Full CRUD
                'surat.view', 'surat.create', 'surat.update', 'surat.delete',
                
                // Modul - Full CRUD
                'modul.view', 'modul.create', 'modul.update', 'modul.delete',
                
                // Proker - Full CRUD
                'proker.view', 'proker.create', 'proker.update', 'proker.delete',
                
                // Rubrik - Full CRUD + Grade
                'rubrik.view', 'rubrik.create', 'rubrik.update', 'rubrik.delete', 'rubrik.grade',
                
                // Sertifikat - Full CRUD + Generate
                'sertifikat.view', 'sertifikat.create', 'sertifikat.update', 'sertifikat.delete', 'sertifikat.generate',
            ]);
            $this->command->info('✓ Admin: Management permissions assigned');
        }

        // ============================================
        // ASISTEN - Basic Permissions
        // ============================================
        $asisten = Role::where('name', 'asisten')->first();
        if ($asisten) {
            $asisten->givePermissionTo([
                // Praktikum - View only
                'praktikum.view',
                
                // Praktikan - View only
                'praktikan.view',
                
                // Tugas - View and Create (untuk assign tugas)
                'tugas.view', 'tugas.create',
                
                // Absensi - View and Create (untuk input absensi)
                'absensi.view', 'absensi.create',
                
                // Inventaris - View and create permohonan
                'inventaris.view', 'inventaris.manage-permohonan',
                
                // Keuangan - View only
                'keuangan.view',
                
                // Piket - View and request ganti jadwal
                'piket.view-jadwal', 'piket.request-ganti-jadwal',
                
                // Kepengurusan - View only
                'kepengurusan.view',
                
                // Surat - View only
                'surat.view',
                
                // Modul - View only
                'modul.view',
                
                // Proker - View only
                'proker.view',
                
                // Rubrik - View only
                'rubrik.view',
                
                // Sertifikat - View only
                'sertifikat.view',
            ]);
            $this->command->info('✓ Asisten: Basic permissions assigned');
        }

        // ============================================
        // PRAKTIKAN - Very Limited
        // ============================================
        $praktikan = Role::where('name', 'praktikan')->first();
        if ($praktikan) {
            $praktikan->givePermissionTo([
                // Tugas - View and Submit only
                'tugas.view', 'tugas.submit',
                
                // Absensi - View only
                'absensi.view',
                
                // Piket - View jadwal only
                'piket.view-jadwal',
                
                // Modul - View only
                'modul.view',
                
                // Sertifikat - View (untuk download sertifikat mereka)
                'sertifikat.view',
            ]);
            $this->command->info('✓ Praktikan: Limited permissions assigned');
        }

        $this->command->info('');
        $this->command->info('==============================================');
        $this->command->info('Role-Permission assignment completed!');
        $this->command->info('==============================================');
        $this->command->newLine();
        
        // Show summary
        $this->showSummary();
    }

    /**
     * Show permission summary for each role
     */
    private function showSummary()
    {
        $roles = Role::with('permissions')->get();
        
        foreach ($roles as $role) {
            $this->command->info("Role: {$role->name}");
            $this->command->info("Permissions: " . $role->permissions->count());
            $this->command->newLine();
        }
    }
}
