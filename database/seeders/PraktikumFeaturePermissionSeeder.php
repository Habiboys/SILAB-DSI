<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission\Role;
use App\Models\Permission\Permission;
use Spatie\Permission\PermissionRegistrar;

class PraktikumFeaturePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('Configuring permissions for Praktikum Features...');

        // 1. Create specific permissions for Modul Praktikum (Fixing mismatch)
        // The policy uses 'modul.create-modul', 'modul.update-modul', etc.
        $permissions = [
            'modul.create-modul',
            'modul.update-modul',
            'modul.delete-modul',
            'modul.publish', // For toggling public link
            
            // Explicit permissions for Pertemuan (optional but good for future proofing)
            'praktikum.pertemuan.view',
            'praktikum.pertemuan.create',
            'praktikum.pertemuan.update',
            'praktikum.pertemuan.delete',
            
            // Sertifikat permissions
            'praktikum.sertifikat.view',
            'praktikum.sertifikat.create', // Upload template
            'praktikum.sertifikat.generate',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // 2. Assign to Roles

        // SUPERADMIN & ADMIN
        $admins = Role::whereIn('name', ['superadmin', 'admin'])->get();
        foreach ($admins as $role) {
            $role->givePermissionTo($permissions);
            $this->command->info("✓ Assigned all new permissions to {$role->name}");
        }

        // KADEP (Read-onlyish)
        $kadep = Role::where('name', 'kadep')->first();
        if ($kadep) {
            $kadep->givePermissionTo([
                'praktikum.pertemuan.view',
                'praktikum.sertifikat.view',
                // Modul view is already handled by 'modul.view' in main seeder
            ]);
            $this->command->info("✓ Assigned view permissions to kadep");
        }

        // ASISTEN
        $asisten = Role::where('name', 'asisten')->first();
        if ($asisten) {
            $asisten->givePermissionTo([
                // Modul Management
                'modul.create-modul', 
                'modul.update-modul', 
                'modul.delete-modul',
                'modul.publish',
                
                // Pertemuan Management
                'praktikum.pertemuan.view',
                'praktikum.pertemuan.create', 
                'praktikum.pertemuan.update', 
                'praktikum.pertemuan.delete',
                
                // Sertifikat Generation
                'praktikum.sertifikat.view',
                'praktikum.sertifikat.generate',
            ]);
            $this->command->info("✓ Assigned management permissions to asisten");
        }

        // PRAKTIKAN
        $praktikan = Role::where('name', 'praktikan')->first();
        if ($praktikan) {
            $praktikan->givePermissionTo([
                'praktikum.pertemuan.view',
                'praktikum.sertifikat.view',
                // They already have modul.view
            ]);
            $this->command->info("✓ Assigned view permissions to praktikan");
        }

        $this->command->info('Praktikum Feature Permissions seeding completed.');
    }
}
